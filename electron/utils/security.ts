import { app, type BrowserWindow, type WebContents } from 'electron';
import {
  DEFAULT_FRONTEND_URL,
  DEV_RENDERER_URL,
  PROD_RENDERER_URL,
} from './paths';

const ALLOWED_ORIGINS = new Set([
  new URL(DEV_RENDERER_URL).origin,
  new URL(PROD_RENDERER_URL).origin,
  new URL(DEFAULT_FRONTEND_URL).origin,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const isAllowedNavigation = (url: string): boolean => {
  try {
    const parsed = new URL(url);

    if (parsed.protocol === 'file:') {
      return true;
    }

    return ALLOWED_ORIGINS.has(parsed.origin);
  } catch {
    return false;
  }
};

/**
 * Apply navigation and window-open restrictions to a BrowserWindow.
 */
export const hardenBrowserWindow = (win: BrowserWindow): void => {
  win.webContents.setWindowOpenHandler(({ url }) => {
    console.warn('[electron] Blocked new window request:', url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) {
      console.warn('[electron] Blocked navigation to:', url);
      event.preventDefault();
    }
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[electron] Renderer process gone:', details.reason, details.exitCode);
  });

  win.webContents.on('unresponsive', () => {
    console.error('[electron] Renderer became unresponsive');
  });

  win.webContents.on('responsive', () => {
    console.info('[electron] Renderer became responsive again');
  });
};

/**
 * Deny unexpected window creation from any webContents in the app.
 */
export const registerAppSecurityHandlers = (): void => {
  app.on('web-contents-created', (_event, contents: WebContents) => {
    contents.setWindowOpenHandler(({ url }) => {
      console.warn('[electron] Blocked window.open from webContents:', url);
      return { action: 'deny' };
    });

    contents.on('will-navigate', (event, url) => {
      if (!isAllowedNavigation(url)) {
        console.warn('[electron] Blocked webContents navigation to:', url);
        event.preventDefault();
      }
    });
  });
};
