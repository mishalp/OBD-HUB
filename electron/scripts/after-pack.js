/**
 * electron-builder afterPack hook.
 *
 * Copies desktop-resources into the app Resources folder with a raw filesystem
 * copy so node_modules / .env are not stripped by gitignore-based filters.
 */
const { cpSync, existsSync, rmSync } = require('node:fs');
const path = require('node:path');

/**
 * @param {import('electron-builder').AfterPackContext} context
 */
exports.default = async function afterPack(context) {
  const projectDir = context.packager.projectDir;
  const stagingRoot = path.join(projectDir, 'desktop-resources');

  if (!existsSync(stagingRoot)) {
    throw new Error(
      `[afterPack] desktop-resources/ missing. Run: npm run prepare:desktop\n` +
        stagingRoot,
    );
  }

  const resourcesDir =
    context.electronPlatformName === 'darwin'
      ? path.join(
          context.appOutDir,
          `${context.packager.appInfo.productFilename}.app`,
          'Contents',
          'Resources',
        )
      : path.join(context.appOutDir, 'resources');

  for (const name of ['backend', 'frontend', 'runtime']) {
    const from = path.join(stagingRoot, name);
    const to = path.join(resourcesDir, name);

    if (!existsSync(from)) {
      throw new Error(`[afterPack] Missing staged folder: ${from}`);
    }

    rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
    console.log(`[afterPack] Copied ${name} → ${to}`);
  }
};
