#!/usr/bin/env node
/**
 * Prepares desktop-resources/ for electron-builder extraResources.
 *
 * Layout:
 *   desktop-resources/
 *     backend/     compiled Express + production node_modules
 *     frontend/    Next.js standalone server
 *     runtime/     Node.js binary for the current build host
 *
 * Run on the target OS when possible (native modules like bcrypt + Node binary).
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'desktop-resources');

const log = (message) => {
  console.log(`[prepare:desktop] ${message}`);
};

const run = (command, cwd = ROOT) => {
  log(`$ ${command}`);
  execSync(command, { cwd, stdio: 'inherit', env: process.env });
};

const ensureExists = (targetPath, label) => {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${label} not found:\n${targetPath}`);
  }
};

const copyDir = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
};

const main = () => {
  log('Cleaning previous desktop-resources…');
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  log('Building backend, frontend, and Electron main…');
  run('npm run backend:build');
  run('npm run frontend:build');
  run('npm run electron:compile');

  // —— Backend ——
  const backendOut = path.join(OUT, 'backend');
  const backendDist = path.join(ROOT, 'backend', 'dist');
  ensureExists(path.join(backendDist, 'server.js'), 'Backend dist/server.js');

  fs.mkdirSync(backendOut, { recursive: true });
  copyDir(backendDist, path.join(backendOut, 'dist'));
  fs.copyFileSync(
    path.join(ROOT, 'backend', 'package.json'),
    path.join(backendOut, 'package.json'),
  );

  const backendLock = path.join(ROOT, 'backend', 'package-lock.json');
  if (fs.existsSync(backendLock)) {
    fs.copyFileSync(backendLock, path.join(backendOut, 'package-lock.json'));
    run('npm ci --omit=dev', backendOut);
  } else {
    run('npm install --omit=dev', backendOut);
  }

  fs.mkdirSync(path.join(backendOut, 'uploads'), { recursive: true });

  const backendEnv = path.join(ROOT, 'backend', '.env');
  const backendEnvExample = path.join(ROOT, 'backend', '.env.example');
  if (fs.existsSync(backendEnv)) {
    fs.copyFileSync(backendEnv, path.join(backendOut, '.env'));
    log('Copied backend/.env into desktop-resources (review before public distribution).');
  } else if (fs.existsSync(backendEnvExample)) {
    fs.copyFileSync(backendEnvExample, path.join(backendOut, '.env.example'));
    log('No backend/.env found — copied .env.example only. Packaged app needs a real .env.');
  }

  // —— Frontend (Next standalone) ——
  const frontendOut = path.join(OUT, 'frontend');
  const standaloneUser = path.join(ROOT, 'user', '.next', 'standalone', 'user');
  ensureExists(path.join(standaloneUser, 'server.js'), 'Next standalone server.js');

  copyDir(standaloneUser, frontendOut);

  const staticSrc = path.join(ROOT, 'user', '.next', 'static');
  ensureExists(staticSrc, 'Next .next/static');
  copyDir(staticSrc, path.join(frontendOut, '.next', 'static'));

  const publicSrc = path.join(ROOT, 'user', 'public');
  if (fs.existsSync(publicSrc)) {
    copyDir(publicSrc, path.join(frontendOut, 'public'));
  }

  // —— Runtime Node binary (host platform) ——
  const runtimeDir = path.join(OUT, 'runtime');
  fs.mkdirSync(runtimeDir, { recursive: true });
  const nodeName = process.platform === 'win32' ? 'node.exe' : 'node';
  const nodeDest = path.join(runtimeDir, nodeName);
  fs.copyFileSync(process.execPath, nodeDest);
  if (process.platform !== 'win32') {
    fs.chmodSync(nodeDest, 0o755);
  }
  log(`Bundled Node runtime: ${process.execPath} → runtime/${nodeName}`);

  log('Done. desktop-resources/ is ready for electron-builder.');
  log('Tip: build installers on the target OS so native modules match (e.g. bcrypt).');
};

try {
  main();
} catch (error) {
  console.error('[prepare:desktop] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
