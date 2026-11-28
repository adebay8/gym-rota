'use client';

import { useState } from 'react';
import type React from 'react';

import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { Button } from '../strata/components/button.tsx';
import { StateMark } from '../strata/components/state-mark.tsx';
import { connectSync, disconnectSync, syncNow, useSyncStatus } from './sync.agent.ts';
import { SYNC_STATES } from './sync.constants.ts';
import type { SyncStatus } from './sync.types.ts';

function describe(status: SyncStatus, now: Date): { readonly mark: 'done' | 'running' | 'stopped' | 'settled'; readonly words: string } {
  const when = status.lastSyncedAt ? `, last synced ${ProgressHelpers.describeWhen(status.lastSyncedAt, now)} at ${new Date(status.lastSyncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '';
  switch (status.state) {
    case SYNC_STATES.SYNCING:
      return { mark: 'running', words: 'Syncing' };
    case SYNC_STATES.SYNCED:
      return { mark: 'done', words: `Synced to your database${when}` };
    case SYNC_STATES.OFFLINE:
      return { mark: 'settled', words: `Offline. Saved on this phone; it syncs when you’re back online${when}` };
    case SYNC_STATES.WRONG_KEY:
      return { mark: 'stopped', words: 'Wrong sync key. Check it matches ROTA_SYNC_KEY in Vercel.' };
    case SYNC_STATES.NOT_CONFIGURED:
      return { mark: 'stopped', words: 'The database isn’t set up yet: add MONGO_URI and ROTA_SYNC_KEY in Vercel, then redeploy.' };
    default:
      return { mark: 'stopped', words: `Couldn’t reach the database. Trying again in a minute${when}` };
  }
}

/** Connect this phone to MongoDB with the sync key, and show whether the log is synced. */
export function SyncSettings(): React.JSX.Element {
  const status = useSyncStatus();
  const [key, setKey] = useState('');

  if (status.state === SYNC_STATES.OFF) {
    return (
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (key.trim()) void connectSync(key);
        }}
      >
        <label htmlFor="sync-key" className="text-label">
          Sync to your database
        </label>
        <span className="text-caption text-muted">Paste the sync key (ROTA_SYNC_KEY) once. Your log then copies to MongoDB in the background.</span>
        <div className="flex gap-2">
          <input
            id="sync-key"
            type="password"
            autoComplete="off"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-s border border-edge bg-transparent px-3 text-body text-ink focus:border-ink focus:outline-none"
          />
          <Button type="submit" disabled={!key.trim()}>
            Connect
          </Button>
        </div>
      </form>
    );
  }

  const { mark, words } = describe(status, new Date());
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption" role="status">
        <StateMark state={mark} label={words} />
      </span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Button variant="quiet" onClick={() => void syncNow()} disabled={status.state === SYNC_STATES.SYNCING}>
          Sync now
        </Button>
        <Button variant="quiet" onClick={disconnectSync}>
          Disconnect this phone
        </Button>
      </div>
    </div>
  );
}
