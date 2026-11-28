/** Kept apart from the log, so a backup file never contains the key. */
export const SYNC_KEY_STORAGE_KEY = 'rota.sync-key.v1';
export const SYNC_LAST_AT_STORAGE_KEY = 'rota.sync-last.v1';
/** Trailing slash: the site uses trailingSlash, so this avoids a redirect on every call. */
export const SYNC_PATH = '/api/progress/';
/** Wait for a pause in ticking before sending. */
export const SYNC_DEBOUNCE_MS = 2000;
/** After a failure, try again in a minute. */
export const SYNC_RETRY_MS = 60_000;

export const SYNC_STATES = {
  OFF: 'off',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  OFFLINE: 'offline',
  WRONG_KEY: 'wrongKey',
  NOT_CONFIGURED: 'notConfigured',
  ERROR: 'error',
} as const;
