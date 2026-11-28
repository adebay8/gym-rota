'use client';

import { useSyncExternalStore } from 'react';

import { ProgressMerge } from '../progress/progress.merge.ts';
import { onProgressChange, readProgress, replaceProgress } from '../progress/progress.store.ts';
import { SyncClient } from './sync.client.ts';
import { SYNC_DEBOUNCE_MS, SYNC_KEY_STORAGE_KEY, SYNC_LAST_AT_STORAGE_KEY, SYNC_RETRY_MS, SYNC_STATES } from './sync.constants.ts';
import type { SyncState, SyncStatus } from './sync.types.ts';

const OFF_STATUS: SyncStatus = { state: SYNC_STATES.OFF, lastSyncedAt: null };

const listeners = new Set<() => void>();
let status: SyncStatus = OFF_STATUS;
let isStarted = false;
let isRunning = false;
let isQueued = false;
let debounceTimer: number | undefined;
let retryTimer: number | undefined;
// What the database is known to hold, so an unchanged log isn't sent again.
let lastSyncedJson: string | null = null;

function setStatus(next: SyncStatus): void {
  status = next;
  for (const listener of listeners) listener();
}

function readKey(): string | null {
  return window.localStorage.getItem(SYNC_KEY_STORAGE_KEY);
}

function fail(state: SyncState): void {
  setStatus({ state, lastSyncedAt: status.lastSyncedAt });
  // A wrong key or a missing setup won't fix itself; being offline or a database blip might.
  if (state === SYNC_STATES.OFFLINE || state === SYNC_STATES.ERROR) {
    window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(() => void syncNow(), SYNC_RETRY_MS);
  }
}

/** Sends this phone's log, then takes the merged copy back (it may hold sets from another device). */
export async function syncNow(): Promise<void> {
  const key = readKey();
  if (!key) {
    setStatus(OFF_STATUS);
    return;
  }
  if (isRunning) {
    isQueued = true;
    return;
  }
  isRunning = true;
  setStatus({ state: SYNC_STATES.SYNCING, lastSyncedAt: status.lastSyncedAt });
  try {
    const local = readProgress();
    const result = await SyncClient.push(key, local);
    if (!result.ok) {
      fail(result.state);
      return;
    }
    if (result.progress) {
      // Ticks made while the request was out are merged in, not lost.
      const merged = ProgressMerge.merge(readProgress(), result.progress);
      lastSyncedJson = JSON.stringify(merged);
      if (!ProgressMerge.isSame(readProgress(), merged)) replaceProgress(merged);
    }
    const lastSyncedAt = new Date().toISOString();
    window.localStorage.setItem(SYNC_LAST_AT_STORAGE_KEY, lastSyncedAt);
    setStatus({ state: SYNC_STATES.SYNCED, lastSyncedAt });
  } finally {
    isRunning = false;
    if (isQueued) {
      isQueued = false;
      void syncNow();
    }
  }
}

function scheduleSync(): void {
  if (!readKey() || JSON.stringify(readProgress()) === lastSyncedJson) return;
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => void syncNow(), SYNC_DEBOUNCE_MS);
}

/** Starts background sync once per page load: on open, after changes, when back online, and when the app comes back to the front. */
export function startSyncAgent(): void {
  if (isStarted) return;
  isStarted = true;
  const lastSyncedAt = window.localStorage.getItem(SYNC_LAST_AT_STORAGE_KEY);
  status = readKey() ? { state: SYNC_STATES.SYNCED, lastSyncedAt } : OFF_STATUS;
  onProgressChange(scheduleSync);
  window.addEventListener('online', () => void syncNow());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
  void syncNow();
}

export function connectSync(key: string): Promise<void> {
  window.localStorage.setItem(SYNC_KEY_STORAGE_KEY, key.trim());
  lastSyncedJson = null;
  return syncNow();
}

export function disconnectSync(): void {
  window.localStorage.removeItem(SYNC_KEY_STORAGE_KEY);
  window.localStorage.removeItem(SYNC_LAST_AT_STORAGE_KEY);
  window.clearTimeout(retryTimer);
  lastSyncedJson = null;
  setStatus(OFF_STATUS);
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => status,
    () => OFF_STATUS,
  );
}
