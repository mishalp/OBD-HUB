#!/usr/bin/env node
/**
 * Launches electronmon with ELECTRON_RUN_AS_NODE cleared.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '../..');
const electronmonCli = require.resolve('electronmon/bin/cli.js');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(process.execPath, [electronmonCli, '.'], {
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
