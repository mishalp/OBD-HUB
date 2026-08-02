import {
  app,
  BrowserWindow,
  Menu,
  dialog,
  nativeTheme,
  type BrowserWindowConstructorOptions,
} from 'electron';
import path from 'node:path';
import { ensureBackendReady, stopBackend } from './utils/backendProcess';
import { ensureFrontendReady, stopFrontend } from './utils/frontendProcess';
import { resolvePreloadPath } from './utils/paths';
import { loadRenderer, isDevelopment } from './utils/renderer';
import { hardenBrowserWindow, registerAppSecurityHandlers } from './utils/security';
import {
  DEFAULT_WINDOW_STATE,
  loadWindowState,
  trackWindowState,
} from './utils/windowState';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const APP_NAME = 'OBD Billing & CRM';

const getIconPath = (): string => {
  return path.join(__dirname, '..', 'electron', 'resources', 'icon.png');
};

const prepareRuntime = async (): Promise<void> => {
  // Backend first (API), then frontend (UI), then the window.
  await ensureBackendReady();
  await ensureFrontendReady();
};

const createMainWindow = async (): Promise<BrowserWindow> => {
  const state = loadWindowState(app.getPath('userData'));
  const iconPath = getIconPath();

  const windowOptions: BrowserWindowConstructorOptions = {
    width: state.width || DEFAULT_WINDOW_STATE.width,
    height: state.height || DEFAULT_WINDOW_STATE.height,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    center: state.x === undefined || state.y === undefined,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    autoHideMenuBar: true,
    backgroundColor: '#111111',
    title: APP_NAME,
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  };

  if (state.x !== undefined && state.y !== undefined) {
    windowOptions.x = state.x;
    windowOptions.y = state.y;
    windowOptions.center = false;
  }

  if (iconPath) {
    windowOptions.icon = iconPath;
  }

  // Dark title bar styling where the platform supports it without breaking layout.
  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.trafficLightPosition = { x: 16, y: 16 };
  }

  const win = new BrowserWindow(windowOptions);
  mainWindow = win;

  // Hide the application menu for a cleaner desktop feel.
  Menu.setApplicationMenu(null);

  hardenBrowserWindow(win);
  trackWindowState(app.getPath('userData'), win);

  win.once('ready-to-show', () => {
    if (state.isMaximized) {
      win.maximize();
    }
    win.show();
    if (isDevelopment()) {
      // DevTools stay closed by default; open manually when needed.
    }
  });

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  await loadRenderer(win);
  return win;
};

const stopOwnedServices = async (): Promise<void> => {
  await stopFrontend();
  await stopBackend();
};

const bootstrap = async (): Promise<void> => {
  // Prefer a dark native chrome where supported.
  nativeTheme.themeSource = 'dark';

  registerAppSecurityHandlers();

  app.setName(APP_NAME);

  await app.whenReady();

  try {
    await prepareRuntime();
    await createMainWindow();
  } catch (error) {
    console.error('[electron] Startup failed:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'The desktop application could not start. Check the logs for details.';

    dialog.showErrorBox('Desktop App Startup Failed', message);
    await stopOwnedServices();
    app.quit();
    return;
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void (async () => {
        try {
          await prepareRuntime();
          await createMainWindow();
        } catch (error: unknown) {
          console.error('[electron] Failed to recreate window:', error);
          dialog.showErrorBox(
            'Unable to Reopen Window',
            error instanceof Error ? error.message : 'Unexpected error while reopening.',
          );
        }
      })();
    }
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  if (isQuitting) {
    return;
  }

  event.preventDefault();
  isQuitting = true;

  void (async () => {
    try {
      await stopOwnedServices();
    } finally {
      app.exit(0);
    }
  })();
});

process.on('uncaughtException', (error) => {
  console.error('[electron] Uncaught exception:', error);
  dialog.showErrorBox(
    'Unexpected Error',
    error instanceof Error ? error.message : 'An unexpected error occurred.',
  );
});

process.on('unhandledRejection', (reason) => {
  console.error('[electron] Unhandled rejection:', reason);
});

void bootstrap();
