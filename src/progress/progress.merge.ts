import { HISTORY_LIMIT, LOG_LIMIT_PER_EXERCISE } from './progress.constants.ts';
import type { FinishedSession, LoggedExercise, Progress } from './progress.types.ts';

function isNewer(left: string | undefined, right: string | undefined): boolean {
  return (left ?? '') > (right ?? '');
}

/**
 * Combines two copies of progress (this phone and the database) without losing sets from either.
 * Logged sessions and finished days are unions; where both sides changed the same logged session, the later edit wins.
 * The rotation (next day) and the open session come from whichever copy changed last.
 */
export class ProgressMerge {
  static merge(left: Progress, right: Progress): Progress {
    const newer = isNewer(right.updatedAt, left.updatedAt) ? right : left;
    const log: Record<string, LoggedExercise[]> = {};
    for (const exerciseId of new Set([...Object.keys(left.log), ...Object.keys(right.log)])) {
      const bySession = new Map<string, LoggedExercise>();
      for (const logged of [...(left.log[exerciseId] ?? []), ...(right.log[exerciseId] ?? [])]) {
        const existing = bySession.get(logged.sessionId);
        if (!existing || isNewer(logged.loggedAt, existing.loggedAt)) bySession.set(logged.sessionId, logged);
      }
      log[exerciseId] = [...bySession.values()].sort((a, b) => b.sessionId.localeCompare(a.sessionId)).slice(0, LOG_LIMIT_PER_EXERCISE);
    }
    const history = new Map<string, FinishedSession>();
    for (const finished of [...left.history, ...right.history]) history.set(`${finished.dayId}|${finished.finishedAt}`, finished);
    const updatedAt = isNewer(right.updatedAt, left.updatedAt) ? right.updatedAt : left.updatedAt;
    return {
      nextDayId: newer.nextDayId,
      session: newer.session,
      history: [...history.values()].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, HISTORY_LIMIT),
      log,
      ...(updatedAt ? { updatedAt } : {}),
    };
  }

  /** True when the two copies hold the same data (so nothing needs writing back). */
  static isSame(left: Progress, right: Progress): boolean {
    return JSON.stringify(ProgressMerge.#canonical(left)) === JSON.stringify(ProgressMerge.#canonical(right));
  }

  static #canonical(progress: Progress): unknown {
    // Fixed key order, so the same data always serialises the same way.
    const log = Object.fromEntries(Object.keys(progress.log).sort().map((key) => [key, progress.log[key]]));
    return { nextDayId: progress.nextDayId, history: progress.history, session: progress.session, log, updatedAt: progress.updatedAt ?? null };
  }
}
