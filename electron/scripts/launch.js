#!/usr/bin/env node
/**
 * Launches Electron with a clean environment.
 *
 * Some IDEs set ELECTRON_RUN_AS_NODE=1, which breaks require('electron')
 * in the main process. Always unset it before spawning Electron.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const electronBinary = require('electron');
const appRoot = path.resolve(__dirname, '../..');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const electronArgs = process.argv.slice(2).filter((arg) => {
  if (arg === '--use-dist-backend') {
    env.ELECTRON_BACKEND_USE_DIST = '1';
    return false;
  }
  if (arg === '--use-start-frontend') {
    env.ELECTRON_FRONTEND_USE_START = '1';
    return false;
  }
  if (arg === '--use-standalone-frontend') {
    env.ELECTRON_FRONTEND_USE_STANDALONE = '1';
    return false;
  }
  return true;
});

const child = spawn(String(electronBinary), ['.', ...electronArgs], {
  cwd: appRoot,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
