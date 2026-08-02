/**
 * Allowed IPC channel names.
 *
 * Step 1 exposes no business IPC. Future channels must be registered here
 * before they can be used from the preload bridge.
 */
export const ALLOWED_IPC_CHANNELS = [] as const;

export type AllowedIpcChannel = (typeof ALLOWED_IPC_CHANNELS)[number];

export const isAllowedIpcChannel = (channel: string): channel is AllowedIpcChannel => {
  return (ALLOWED_IPC_CHANNELS as readonly string[]).includes(channel);
};
