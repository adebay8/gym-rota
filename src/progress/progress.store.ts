'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { EMPTY_PROGRESS, PROGRESS_STORAGE_KEY } from './progress.constants.ts';
import { ProgressHelpers } from './progress.helpers.ts';
import type { Progress } from './progress.types.ts';

const listeners = new Set<() => void>();
// Cached so useSyncExternalStore sees a stable snapshot between writes.
let cachedRaw: string | null | undefined;
let cachedProgress: Progress = EMPTY_PROGRESS;

function readSnapshot(): Progress {
  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedProgress = ProgressHelpers.parse(raw);
  }
  return cachedProgress;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab finishing a session updates this one too.
  const onStorage = (event: StorageEvent): void => {
    if (event.key === PROGRESS_STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Progress lives only on this device, in localStorage. Returns null until the browser has loaded it. */
export function useProgress(): readonly [Progress | null, (change: (progress: Progress) => Progress) => void] {
  const progress = useSyncExternalStore(subscribe, readSnapshot, () => null);
  const update = useCallback((change: (progress: Progress) => Progress) => {
    const next = { ...change(readSnapshot()), updatedAt: new Date().toISOString() };
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
    for (const listener of listeners) listener();
  }, []);
  return [progress, update] as const;
}

/** Replace everything stored (restoring a backup, or taking the merged copy from a sync). */
export function replaceProgress(progress: Progress): void {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  for (const listener of listeners) listener();
}

export function readProgressJson(): string {
  return window.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? JSON.stringify(EMPTY_PROGRESS);
}

/** The current stored copy, outside React (for the sync agent). */
export function readProgress(): Progress {
  return ProgressHelpers.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
}

/** Calls back after every local change, in this tab. */
export function onProgressChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
