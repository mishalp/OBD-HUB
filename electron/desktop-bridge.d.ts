/**
 * Global typings for the secure preload bridge.
 * Reference from the Next.js app when detecting the Electron shell.
 */
interface DesktopBridge {
  readonly platform: NodeJS.Platform;
  readonly isElectron: true;
  readonly versions: {
    readonly electron: string;
    readonly chrome: string;
    readonly node: string;
  };
}

interface Window {
  desktop?: DesktopBridge;
}
