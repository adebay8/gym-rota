import type { SYNC_STATES } from './sync.constants.ts';

export type SyncState = (typeof SYNC_STATES)[keyof typeof SYNC_STATES];

export interface SyncStatus {
  readonly state: SyncState;
  /** ISO timestamp of the last successful sync. */
  readonly lastSyncedAt: string | null;
}
