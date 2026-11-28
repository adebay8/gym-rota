import { describe, expect, it } from 'vitest';

import { EMPTY_PROGRESS } from '../../progress/progress.constants.ts';
import { ProgressHelpers } from '../../progress/progress.helpers.ts';
import type { Progress } from '../../progress/progress.types.ts';
import { ProgressApiHandler } from './progress-api.handler.ts';
import type { ProgressRepository } from './sync-server.types.ts';

const KEY = 'a-long-random-sync-key-for-tests-only';
const NOW = new Date('2026-11-28T12:00:00Z');

function memoryRepository(initial: Progress | null = null): ProgressRepository & { stored: Progress | null; writes: number } {
  const repository = {
    stored: initial,
    writes: 0,
    read: async () => repository.stored,
    write: async (progress: Progress) => {
      repository.stored = progress;
      repository.writes += 1;
    },
  };
  return repository;
}

function request(method: string, body?: unknown, key = KEY): Request {
  return new Request('https://rota.test/api/progress/', { method, headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}

describe('progress API', () => {
  it('says so when MongoDB or the key is not set up', async () => {
    expect((await ProgressApiHandler.handle(request('GET'), { syncKey: KEY, openRepository: null })).status).toBe(503);
    expect((await ProgressApiHandler.handle(request('GET'), { syncKey: 'short', openRepository: async () => memoryRepository() })).status).toBe(503);
  });

  it('refuses a wrong key without touching the database', async () => {
    let opened = false;
    const response = await ProgressApiHandler.handle(request('GET', undefined, 'not-the-key-not-the-key-not-the-key'), {
      syncKey: KEY,
      openRepository: async () => {
        opened = true;
        return memoryRepository();
      },
    });
    expect(response.status).toBe(401);
    expect(opened).toBe(false);
  });

  it('stores the first push and merges later ones', async () => {
    const repository = memoryRepository();
    const options = { syncKey: KEY, openRepository: async () => repository };
    const phone = ProgressHelpers.logSet(EMPTY_PROGRESS, { dayId: 1, exerciseId: 'smith-bench-press', setIndex: 0 }, { weightKg: 60, reps: 10 }, NOW);
    expect((await ProgressApiHandler.handle(request('PUT', phone), options)).status).toBe(200);
    const laptop = ProgressHelpers.logSet(EMPTY_PROGRESS, { dayId: 2, exerciseId: 'pull-ups', setIndex: 0 }, { weightKg: null, reps: 8 }, NOW);
    const response = await ProgressApiHandler.handle(request('PUT', laptop), options);
    const body = (await response.json()) as { progress: Progress };
    expect(Object.keys(body.progress.log).sort()).toEqual(['pull-ups', 'smith-bench-press']);
    expect(repository.writes).toBe(2);
    // Sending the same thing again writes nothing.
    await ProgressApiHandler.handle(request('PUT', body.progress), options);
    expect(repository.writes).toBe(2);
  });

  it('rejects something that is not a log', async () => {
    const response = await ProgressApiHandler.handle(request('PUT', { hello: 'world' }), { syncKey: KEY, openRepository: async () => memoryRepository() });
    expect(response.status).toBe(400);
  });

  it('reports an unreachable database without details', async () => {
    const response = await ProgressApiHandler.handle(request('GET'), {
      syncKey: KEY,
      openRepository: async () => {
        throw new Error('mongodb+srv://user:secret@cluster0.example.net');
      },
    });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('secret');
  });
});
