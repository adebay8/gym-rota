'use client';

import { useEffect } from 'react';

import { startSyncAgent } from './sync.agent.ts';

/** Mounted once in the root layout so sync runs on every screen. Renders nothing. */
export function SyncAgent(): null {
  useEffect(() => startSyncAgent(), []);
  return null;
}
