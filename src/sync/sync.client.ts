import { ProgressHelpers } from '../progress/progress.helpers.ts';
import type { Progress } from '../progress/progress.types.ts';
import { SYNC_PATH, SYNC_STATES } from './sync.constants.ts';
import type { SyncState } from './sync.types.ts';

export type SyncResult = { readonly ok: true; readonly progress: Progress | null } | { readonly ok: false; readonly state: SyncState };

function failure(status: number): SyncResult {
  if (status === 401) return { ok: false, state: SYNC_STATES.WRONG_KEY };
  // 404: running without the API (next dev without env, or an old deploy). 503: MONGO_URI or the key not set.
  if (status === 503 || status === 404) return { ok: false, state: SYNC_STATES.NOT_CONFIGURED };
  return { ok: false, state: SYNC_STATES.ERROR };
}

async function call(key: string, init: RequestInit): Promise<SyncResult> {
  let response: Response;
  try {
    response = await fetch(SYNC_PATH, { ...init, headers: { ...init.headers, authorization: `Bearer ${key}` }, cache: 'no-store' });
  } catch {
    return { ok: false, state: SYNC_STATES.OFFLINE };
  }
  if (!response.ok) return failure(response.status);
  const body: unknown = await response.json().catch(() => null);
  const raw = typeof body === 'object' && body !== null && 'progress' in body ? body.progress : undefined;
  if (raw === undefined) return { ok: false, state: SYNC_STATES.ERROR };
  return { ok: true, progress: raw === null ? null : ProgressHelpers.fromUnknown(raw) };
}

/** Talks to /api/progress. */
export class SyncClient {
  /** Sends this phone's copy; gets back the merged copy the database now holds. */
  static push(key: string, progress: Progress): Promise<SyncResult> {
    return call(key, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(progress) });
  }

  static pull(key: string): Promise<SyncResult> {
    return call(key, { method: 'GET' });
  }
}
