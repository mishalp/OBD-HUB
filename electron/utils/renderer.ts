import { dialog, type BrowserWindow } from 'electron';
import { isDevelopment } from './env';
import { getFrontendUrl } from './frontendProcess';
import { DEV_RENDERER_URL } from './paths';

export { isDevelopment };

/**
 * Resolve the URL used to load the Next.js frontend.
 * The frontend process manager owns starting that server.
 */
export const getRendererTarget = (): { type: 'url'; value: string } => {
  const override = process.env.ELECTRON_START_URL?.trim();
  if (override) {
    return { type: 'url', value: override };
  }

  return {
    type: 'url',
    value: getFrontendUrl() || DEV_RENDERER_URL,
  };
};

export const loadRenderer = async (win: BrowserWindow): Promise<void> => {
  const target = getRendererTarget();

  try {
    await win.loadURL(target.value);
  } catch (error) {
    const message = `Unable to load the frontend at ${target.value}.\n\nMake sure Next.js started successfully, then restart the desktop app.`;

    console.error('[electron] Failed to load renderer:', error);

    dialog.showErrorBox('Frontend Unavailable', message);
    throw error;
  }
};
