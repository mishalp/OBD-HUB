import { execSync } from 'child_process';
import fs from 'fs';

const ext = process.platform === 'win32' ? '.exe' : '';

const targetTriple = execSync('rustc --print host-tuple').toString().trim();
if (!targetTriple) {
    console.error('Failed to determine platform target triple');
}
// TODO: create `src-tauri/binaries` dir
fs.renameSync(
    `masjid-backend${ext}`,
    `my-sidecar-${targetTriple}${ext}`
);