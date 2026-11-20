'use client';

import { useEffect } from 'react';

/** Keeps the screen on while a day is open, so the phone doesn't lock between sets. Silently does nothing where unsupported. */
export function useWakeLock(): void {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    let isActive = true;
    const request = async (): Promise<void> => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
        if (!isActive) await sentinel.release();
      } catch {
        // Low battery mode or a denied request: the app still works, the screen just may lock.
      }
    };
    void request();
    // The lock drops when the tab is hidden; take it again on return.
    const onVisible = (): void => void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
    };
  }, []);
}
