import { ProgressHelpers } from '../../progress/progress.helpers.ts';
import { ProgressMerge } from '../../progress/progress.merge.ts';
import type { Progress } from '../../progress/progress.types.ts';
import { MAX_BODY_BYTES, MIN_SYNC_KEY_LENGTH } from './sync-server.constants.ts';
import type { ProgressApiOptions, ProgressRepository } from './sync-server.types.ts';

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

/** Compares in constant time, so the key can't be guessed a character at a time from response timings. */
function isSameSecret(given: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(given);
  const right = encoder.encode(expected);
  let difference = left.length ^ right.length;
  for (let index = 0; index < right.length; index += 1) difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  return difference === 0;
}

/**
 * GET: the database copy. PUT: merge the phone's copy into the database copy, store the result, return it.
 * Merging here means two devices syncing at once can't drop each other's sets.
 */
export class ProgressApiHandler {
  static async handle(request: Request, options: ProgressApiOptions): Promise<Response> {
    if (!options.openRepository || !options.syncKey || options.syncKey.length < MIN_SYNC_KEY_LENGTH) return json({ error: 'not_configured' }, 503);
    const given = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    if (!isSameSecret(given, options.syncKey)) return json({ error: 'wrong_key' }, 401);
    if (request.method !== 'GET' && request.method !== 'PUT') return json({ error: 'method_not_allowed' }, 405);

    let incoming: Progress | null = null;
    if (request.method === 'PUT') {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413);
      try {
        incoming = ProgressHelpers.fromUnknown(JSON.parse(text));
      } catch {
        incoming = null;
      }
      if (!incoming) return json({ error: 'invalid_progress' }, 400);
    }

    let repository: ProgressRepository;
    try {
      repository = await options.openRepository();
    } catch {
      // No details in the response: the error can include the cluster's host.
      console.error('rota sync: could not connect to MongoDB');
      return json({ error: 'database_unreachable' }, 502);
    }
    try {
      const stored = await repository.read();
      if (!incoming) return json({ progress: stored });
      const merged = stored ? ProgressMerge.merge(stored, incoming) : incoming;
      if (!stored || !ProgressMerge.isSame(stored, merged)) await repository.write(merged);
      return json({ progress: merged });
    } catch {
      console.error('rota sync: MongoDB read or write failed');
      return json({ error: 'database_error' }, 502);
    }
  }
}
