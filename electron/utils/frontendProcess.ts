import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import {
  DEFAULT_FRONTEND_PORT,
  DEFAULT_FRONTEND_URL,
  resolveFrontendRoot,
  resolveNodeBinary,
  resolveStandaloneServer,
} from './paths';
import { isDevelopment } from './env';
import { killProcessTree, sleep } from './processKill';

export interface FrontendStartResult {
  owned: boolean;
  url: string;
  port: number;
}

const READY_POLL_MS = 400;
const READY_TIMEOUT_MS = 90_000;

let frontendChild: ChildProcess | null = null;
let frontendOwned = false;
let stopping = false;

export const getFrontendUrl = (): string => {
  const fromEnv = process.env.ELECTRON_START_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const port = Number(process.env.FRONTEND_PORT) || DEFAULT_FRONTEND_PORT;
  // Prefer 127.0.0.1 for desktop reliability; Next dev also accepts it.
  return `http://127.0.0.1:${port}`;
};

export const getFrontendPort = (): number => {
  try {
    const parsed = new URL(getFrontendUrl());
    return Number(parsed.port) || DEFAULT_FRONTEND_PORT;
  } catch {
    return DEFAULT_FRONTEND_PORT;
  }
};

/**
 * True when the Next.js server accepts HTTP connections.
 */
export const isFrontendReady = async (url = getFrontendUrl()): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(2_500),
    });

    // Any HTTP response means the server is up (including redirects / 404).
    return response.status > 0 && response.status < 500;
  } catch {
    return false;
  }
};

const waitForFrontendReady = async (url: string): Promise<void> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    if (await isFrontendReady(url)) {
      return;
    }

    if (frontendOwned && frontendChild && frontendChild.exitCode !== null) {
      throw new Error(
        `Frontend process exited early with code ${frontendChild.exitCode ?? 'unknown'}.`,
      );
    }

    await sleep(READY_POLL_MS);
  }

  throw new Error(
    `Frontend did not become ready within ${Math.round(READY_TIMEOUT_MS / 1000)}s.\n\n` +
      `Checked: ${url}\n` +
      'Ensure the Next.js app can start (run npm run frontend:build for production mode).',
  );
};

const attachProcessLogs = (child: ChildProcess): void => {
  child.stdout?.on('data', (chunk: Buffer | string) => {
    const text = String(chunk).trimEnd();
    if (text) {
      console.log(`[frontend] ${text}`);
    }
  });

  child.stderr?.on('data', (chunk: Buffer | string) => {
    const text = String(chunk).trimEnd();
    if (text) {
      console.error(`[frontend] ${text}`);
    }
  });

  child.on('exit', (code, signal) => {
    console.log(
      `[frontend] process exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`,
    );
    if (frontendChild === child) {
      frontendChild = null;
      frontendOwned = false;
    }
  });
};

const buildFrontendEnv = (): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const port = String(getFrontendPort());
  env.PORT = port;
  env.HOSTNAME = '127.0.0.1';
  env.NODE_ENV = app.isPackaged || !isDevelopment() ? 'production' : 'development';

  return env;
};

const spawnFrontendProcess = (frontendRoot: string): ChildProcess => {
  const env = buildFrontendEnv();
  const nodeBinary = resolveNodeBinary(app.isPackaged, process.resourcesPath);
  const standaloneServer = resolveStandaloneServer(frontendRoot);
  const useStandalone =
    Boolean(standaloneServer) &&
    (app.isPackaged ||
      process.env.ELECTRON_FRONTEND_USE_STANDALONE === '1' ||
      (!isDevelopment() && process.env.ELECTRON_FRONTEND_USE_START !== '1'));
  const useStart =
    useStandalone ||
    app.isPackaged ||
    !isDevelopment() ||
    process.env.ELECTRON_FRONTEND_USE_START === '1';

  if (useStandalone) {
    if (!standaloneServer) {
      throw new Error(
        `Next.js standalone server not found under:\n${frontendRoot}\n\n` +
          'Run: npm run prepare:desktop (or npm run frontend:build with output: "standalone").',
      );
    }

    const standaloneDir = path.dirname(standaloneServer);
    console.log(`[frontend] Starting standalone server with ${nodeBinary}`);
    console.log(`[frontend] ${standaloneServer}`);
    return spawn(nodeBinary, [standaloneServer], {
      cwd: standaloneDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const useShell = process.platform === 'win32';

  if (useStart) {
    console.log('[frontend] Starting production server (npm run start)');
    return spawn(npmCmd, ['run', 'start'], {
      cwd: frontendRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: useShell,
      windowsHide: true,
    });
  }

  console.log('[frontend] Starting development server (npm run dev)');
  return spawn(
    npmCmd,
    ['run', 'dev', '--', '-H', '127.0.0.1', '-p', String(getFrontendPort())],
    {
      cwd: frontendRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: useShell,
      windowsHide: true,
    },
  );
};

/**
 * Ensures the Next.js frontend is running.
 *
 * - If already reachable, reuses it (does not take ownership).
 * - Otherwise spawns Next and waits until HTTP responds.
 */
export const ensureFrontendReady = async (): Promise<FrontendStartResult> => {
  if (process.env.ELECTRON_SKIP_FRONTEND === '1') {
    console.log('[frontend] ELECTRON_SKIP_FRONTEND=1 — skipping auto-start');
    const url = getFrontendUrl();
    await waitForFrontendReady(url);
    return { owned: false, url, port: getFrontendPort() };
  }

  const url = getFrontendUrl() || DEFAULT_FRONTEND_URL;
  const port = getFrontendPort();

  if (await isFrontendReady(url)) {
    console.log(`[frontend] Already ready at ${url}`);
    return { owned: false, url, port };
  }

  const frontendRoot = resolveFrontendRoot(app.isPackaged, process.resourcesPath);
  if (!existsSync(frontendRoot)) {
    throw new Error(`Frontend directory not found:\n${frontendRoot}`);
  }

  if (!existsSync(path.join(frontendRoot, 'package.json'))) {
    throw new Error(`Frontend package.json not found in:\n${frontendRoot}`);
  }

  console.log(`[frontend] Spawning from ${frontendRoot}`);
  frontendChild = spawnFrontendProcess(frontendRoot);
  frontendOwned = true;
  attachProcessLogs(frontendChild);

  if (frontendChild.pid) {
    console.log(`[frontend] Spawned pid=${frontendChild.pid}`);
  }

  await waitForFrontendReady(url);
  console.log(`[frontend] Ready at ${url}`);

  return { owned: true, url, port };
};

/**
 * Stops the frontend only when this Electron process owns it.
 */
export const stopFrontend = async (): Promise<void> => {
  if (stopping) {
    return;
  }
  stopping = true;

  try {
    if (!frontendOwned || !frontendChild) {
      return;
    }

    console.log('[frontend] Stopping owned frontend process...');
    const child = frontendChild;
    frontendChild = null;
    frontendOwned = false;
    await killProcessTree(child);
  } finally {
    stopping = false;
  }
};
