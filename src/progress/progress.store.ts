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
    const next = change(readSnapshot());
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
    for (const listener of listeners) listener();
  }, []);
  return [progress, update] as const;
}
