import { existsSync } from 'node:fs';
import path from 'node:path';

/** Compiled Electron output directory (relative to repo root). */
export const DIST_ELECTRON_DIR = 'dist-electron';

/** Default Next.js development URL. */
export const DEV_RENDERER_URL = 'http://localhost:3000';

/** Default Next.js production / desktop URL. */
export const PROD_RENDERER_URL = 'http://127.0.0.1:3000';

/** Default Next.js port. */
export const DEFAULT_FRONTEND_PORT = 3000;

/** Default Next.js URL used by the desktop shell. */
export const DEFAULT_FRONTEND_URL = `http://127.0.0.1:${DEFAULT_FRONTEND_PORT}`;

/** Default Express API port. */
export const DEFAULT_BACKEND_PORT = 5000;

/** Default Express health-check URL. */
export const DEFAULT_BACKEND_HEALTH_URL = `http://127.0.0.1:${DEFAULT_BACKEND_PORT}/api/health`;

/**
 * dist-electron/ root.
 * This file compiles to dist-electron/utils/paths.js → parent is dist-electron.
 */
const resolveDistElectronRoot = (): string => path.join(__dirname, '..');

/**
 * Absolute path to a compiled Electron artifact under dist-electron/.
 */
export const resolveElectronPath = (...segments: string[]): string => {
  return path.join(resolveDistElectronRoot(), ...segments);
};

export const resolvePreloadPath = (): string => {
  return resolveElectronPath('preload.js');
};

/**
 * Repository root while developing, or resources root when packaged.
 */
export const resolveProjectRoot = (isPackaged: boolean, resourcesPath: string): string => {
  if (isPackaged) {
    return resourcesPath;
  }

  // dist-electron/utils → repo root
  return path.join(__dirname, '..', '..');
};

/**
 * Absolute path to the Express backend project.
 * Packaged: <resources>/backend
 * Development: <repo>/backend
 */
export const resolveBackendRoot = (isPackaged: boolean, resourcesPath: string): string => {
  const override = process.env.ELECTRON_BACKEND_ROOT?.trim();
  if (override) {
    return path.resolve(override);
  }

  if (isPackaged) {
    return path.join(resourcesPath, 'backend');
  }

  return path.join(resolveProjectRoot(false, resourcesPath), 'backend');
};

/**
 * Absolute path to the Next.js frontend.
 * Packaged: <resources>/frontend (standalone layout)
 * Development: <repo>/user
 */
export const resolveFrontendRoot = (isPackaged: boolean, resourcesPath: string): string => {
  const override = process.env.ELECTRON_FRONTEND_ROOT?.trim();
  if (override) {
    return path.resolve(override);
  }

  if (isPackaged) {
    return path.join(resourcesPath, 'frontend');
  }

  const projectRoot = resolveProjectRoot(false, resourcesPath);
  const userDir = path.join(projectRoot, 'user');
  const frontendDir = path.join(projectRoot, 'frontend');

  if (existsSync(userDir)) {
    return userDir;
  }

  return frontendDir;
};

/**
 * Locate Next.js standalone server.js.
 */
export const resolveStandaloneServer = (frontendRoot: string): string | null => {
  const candidates = [
    path.join(frontendRoot, 'server.js'),
    path.join(frontendRoot, '.next', 'standalone', 'server.js'),
    path.join(frontendRoot, '.next', 'standalone', 'user', 'server.js'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

/**
 * Resolve a real Node.js binary for spawning Express / Next.
 * Packaged apps prefer the bundled runtime under resources/runtime.
 */
export const resolveNodeBinary = (
  isPackaged = false,
  resourcesPath = '',
): string => {
  if (isPackaged && resourcesPath) {
    const bundledName = process.platform === 'win32' ? 'node.exe' : 'node';
    const bundled = path.join(resourcesPath, 'runtime', bundledName);
    if (existsSync(bundled)) {
      return bundled;
    }
  }

  const fromNpm = process.env.npm_node_execpath?.trim();
  if (fromNpm && existsSync(fromNpm)) {
    return fromNpm;
  }

  const fromEnv = process.env.NODE_BINARY?.trim();
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }

  return process.platform === 'win32' ? 'node.exe' : 'node';
};
