/**
 * Preload bridge — the only surface between Electron and the renderer.
 *
 * Security rules:
 * - contextIsolation is enabled
 * - nodeIntegration is disabled
 * - sandbox is enabled
 * - No Node.js APIs are exposed
 * - Business IPC is intentionally empty in Step 1
 */
import { contextBridge } from 'electron';

export interface DesktopBridge {
  readonly platform: NodeJS.Platform;
  readonly isElectron: true;
  readonly versions: {
    readonly electron: string;
    readonly chrome: string;
    readonly node: string;
  };
}

const desktopBridge: DesktopBridge = {
  platform: process.platform,
  isElectron: true,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
};

contextBridge.exposeInMainWorld('desktop', desktopBridge);
