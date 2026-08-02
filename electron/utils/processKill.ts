import { spawn, type ChildProcess } from 'node:child_process';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Best-effort kill of a child process tree (Windows taskkill / Unix SIGTERM→SIGKILL).
 */
export const killProcessTree = async (child: ChildProcess): Promise<void> => {
  if (!child.pid) {
    return;
  }

  const pid = child.pid;

  if (process.platform === 'win32') {
    await new Promise<void>((resolve) => {
      const killer = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
    });
    return;
  }

  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }

  await sleep(800);

  if (child.exitCode === null) {
    try {
      child.kill('SIGKILL');
    } catch {
      // ignore
    }
  }
};
