import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import {
  DEFAULT_BACKEND_HEALTH_URL,
  DEFAULT_BACKEND_PORT,
  resolveBackendRoot,
  resolveNodeBinary,
} from './paths';
import { isDevelopment } from './env';
import { killProcessTree, sleep } from './processKill';

export interface BackendStartResult {
  /** True when this Electron process spawned the backend. */
  owned: boolean;
  healthUrl: string;
  port: number;
}

const HEALTH_POLL_MS = 400;
const HEALTH_TIMEOUT_MS = 60_000;

let backendChild: ChildProcess | null = null;
let backendOwned = false;
let stopping = false;

const getHealthUrl = (): string => {
  const fromEnv = process.env.ELECTRON_BACKEND_HEALTH_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const port = Number(process.env.PORT) || DEFAULT_BACKEND_PORT;
  return `http://127.0.0.1:${port}/api/health`;
};

const getBackendPort = (): number => {
  const healthUrl = getHealthUrl();
  try {
    const parsed = new URL(healthUrl);
    return Number(parsed.port) || DEFAULT_BACKEND_PORT;
  } catch {
    return DEFAULT_BACKEND_PORT;
  }
};

/**
 * Returns true when the Express API is up and MongoDB is connected.
 */
export const isBackendHealthy = async (healthUrl = getHealthUrl()): Promise<boolean> => {
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(2_500),
    });

    if (!response.ok) {
      return false;
    }

    const body = (await response.json()) as {
      data?: { status?: string; database?: string };
    };

    return body.data?.status === 'ok' && body.data?.database === 'connected';
  } catch {
    return false;
  }
};

const waitForBackendHealthy = async (healthUrl: string): Promise<void> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < HEALTH_TIMEOUT_MS) {
    if (await isBackendHealthy(healthUrl)) {
      return;
    }

    if (backendOwned && backendChild && backendChild.exitCode !== null) {
      throw new Error(
        `Backend process exited early with code ${backendChild.exitCode ?? 'unknown'}.`,
      );
    }

    await sleep(HEALTH_POLL_MS);
  }

  throw new Error(
    `Backend did not become ready within ${Math.round(HEALTH_TIMEOUT_MS / 1000)}s.\n\n` +
      `Checked: ${healthUrl}\n` +
      'Ensure MongoDB is running and backend/.env is configured.',
  );
};

const attachProcessLogs = (child: ChildProcess): void => {
  child.stdout?.on('data', (chunk: Buffer | string) => {
    const text = String(chunk).trimEnd();
    if (text) {
      console.log(`[backend] ${text}`);
    }
  });

  child.stderr?.on('data', (chunk: Buffer | string) => {
    const text = String(chunk).trimEnd();
    if (text) {
      console.error(`[backend] ${text}`);
    }
  });

  child.on('exit', (code, signal) => {
    console.log(
      `[backend] process exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`,
    );
    if (backendChild === child) {
      backendChild = null;
      backendOwned = false;
    }
  });
};

const buildBackendEnv = (): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  // Prefer a dedicated Node runtime for the Express child.
  env.PORT = String(getBackendPort());
  env.NODE_ENV = app.isPackaged || !isDevelopment() ? 'production' : 'development';
  env.CLIENT_URL = env.CLIENT_URL || 'http://127.0.0.1:3000';

  return env;
};

const spawnBackendProcess = (backendRoot: string): ChildProcess => {
  const env = buildBackendEnv();
  const nodeBinary = resolveNodeBinary(app.isPackaged, process.resourcesPath);
  const compiledEntry = path.join(backendRoot, 'dist', 'server.js');
  const useCompiled =
    app.isPackaged || !isDevelopment() || process.env.ELECTRON_BACKEND_USE_DIST === '1';

  if (useCompiled) {
    if (!existsSync(compiledEntry)) {
      throw new Error(
        `Compiled backend not found at:\n${compiledEntry}\n\nRun: npm run backend:build`,
      );
    }

    console.log(`[backend] Starting compiled server with ${nodeBinary}`);
    return spawn(nodeBinary, [compiledEntry], {
      cwd: backendRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
  }

  console.log('[backend] Starting development server (npm run dev)');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return spawn(npmCmd, ['run', 'dev'], {
    cwd: backendRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    windowsHide: true,
  });
};

/**
 * Ensures the Express backend is running.
 *
 * - If already healthy, reuses it (does not take ownership).
 * - Otherwise spawns backend and waits for /api/health.
 */
export const ensureBackendReady = async (): Promise<BackendStartResult> => {
  if (process.env.ELECTRON_SKIP_BACKEND === '1') {
    console.log('[backend] ELECTRON_SKIP_BACKEND=1 — skipping auto-start');
    const healthUrl = getHealthUrl();
    await waitForBackendHealthy(healthUrl);
    return { owned: false, healthUrl, port: getBackendPort() };
  }

  const healthUrl = getHealthUrl() || DEFAULT_BACKEND_HEALTH_URL;
  const port = getBackendPort();

  if (await isBackendHealthy(healthUrl)) {
    console.log(`[backend] Already healthy at ${healthUrl}`);
    return { owned: false, healthUrl, port };
  }

  const backendRoot = resolveBackendRoot(app.isPackaged, process.resourcesPath);
  if (!existsSync(backendRoot)) {
    throw new Error(`Backend directory not found:\n${backendRoot}`);
  }

  if (!existsSync(path.join(backendRoot, 'package.json'))) {
    throw new Error(`Backend package.json not found in:\n${backendRoot}`);
  }

  console.log(`[backend] Spawning from ${backendRoot}`);
  backendChild = spawnBackendProcess(backendRoot);
  backendOwned = true;
  attachProcessLogs(backendChild);

  if (backendChild.pid) {
    console.log(`[backend] Spawned pid=${backendChild.pid}`);
  }

  await waitForBackendHealthy(healthUrl);
  console.log(`[backend] Ready at ${healthUrl}`);

  return { owned: true, healthUrl, port };
};

/**
 * Stops the backend only when this Electron process owns it.
 */
export const stopBackend = async (): Promise<void> => {
  if (stopping) {
    return;
  }
  stopping = true;

  try {
    if (!backendOwned || !backendChild) {
      return;
    }

    console.log('[backend] Stopping owned backend process...');
    const child = backendChild;
    backendChild = null;
    backendOwned = false;
    await killProcessTree(child);
  } finally {
    stopping = false;
  }
};
