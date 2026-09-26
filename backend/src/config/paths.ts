import path from 'path';
import fs from 'fs';

/**
 * Backend package root (folder that contains package.json, uploads/, dist/).
 * Prefer this over process.cwd() — cwd is unreliable with `npm --prefix` / Electron.
 */
export const getBackendRoot = (): string => {
  // src/config → ../.. = backend; dist/config → ../.. = backend
  return path.resolve(__dirname, '..', '..');
};

/**
 * Absolute path to the uploads directory.
 *
 * Override with UPLOADS_DIR (used by the packaged Electron app to write under
 * userData, since Resources/ may be read-only).
 */
export const getUploadsRoot = (): string => {
  const fromEnv = process.env.UPLOADS_DIR?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  return path.join(getBackendRoot(), 'uploads');
};

export const ensureUploadsRoot = (): string => {
  const root = getUploadsRoot();
  fs.mkdirSync(path.join(root, 'logos'), { recursive: true });
  fs.mkdirSync(path.join(root, 'avatars'), { recursive: true });
  return root;
};
