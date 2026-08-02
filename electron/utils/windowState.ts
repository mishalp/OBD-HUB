import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { screen, type BrowserWindow, type Rectangle } from 'electron';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

export const DEFAULT_WINDOW_STATE: WindowState = {
  width: 1400,
  height: 900,
  isMaximized: false,
};

const STATE_FILE_NAME = 'window-state.json';

const isValidNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isVisibleOnAnyDisplay = (bounds: Rectangle): boolean => {
  return screen.getAllDisplays().some((display) => {
    const area = display.workArea;
    return (
      bounds.x < area.x + area.width &&
      bounds.x + bounds.width > area.x &&
      bounds.y < area.y + area.height &&
      bounds.y + bounds.height > area.y
    );
  });
};

export const loadWindowState = (userDataPath: string): WindowState => {
  const filePath = path.join(userDataPath, STATE_FILE_NAME);

  if (!existsSync(filePath)) {
    return { ...DEFAULT_WINDOW_STATE };
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<WindowState>;
    const width = isValidNumber(parsed.width) ? parsed.width : DEFAULT_WINDOW_STATE.width;
    const height = isValidNumber(parsed.height) ? parsed.height : DEFAULT_WINDOW_STATE.height;
    const x = isValidNumber(parsed.x) ? parsed.x : undefined;
    const y = isValidNumber(parsed.y) ? parsed.y : undefined;
    const isMaximized = Boolean(parsed.isMaximized);

    if (x !== undefined && y !== undefined) {
      const bounds = { x, y, width, height };
      if (!isVisibleOnAnyDisplay(bounds)) {
        return { width, height, isMaximized: false };
      }
    }

    return { x, y, width, height, isMaximized };
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
};

export const persistWindowState = (userDataPath: string, win: BrowserWindow): void => {
  try {
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }

    const isMaximized = win.isMaximized();
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    };

    writeFileSync(
      path.join(userDataPath, STATE_FILE_NAME),
      JSON.stringify(state, null, 2),
      'utf8',
    );
  } catch (error) {
    console.error('[electron] Failed to persist window state:', error);
  }
};

export const trackWindowState = (userDataPath: string, win: BrowserWindow): void => {
  const save = (): void => {
    persistWindowState(userDataPath, win);
  };

  win.on('resize', save);
  win.on('move', save);
  win.on('maximize', save);
  win.on('unmaximize', save);
  win.on('close', save);
};
