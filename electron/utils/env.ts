import { app } from 'electron';

export const isDevelopment = (): boolean => {
  return !app.isPackaged || process.env.ELECTRON_DEV === '1';
};
