import { ProgramHelpers } from '../program/program.helpers.ts';
import { HISTORY_LIMIT, LOG_LIMIT_PER_EXERCISE } from './progress.constants.ts';
import type { FinishedSession, LoggedExercise, Progress } from './progress.types.ts';

function isNewer(left: string | undefined, right: string | undefined): boolean {
  return (left ?? '') > (right ?? '');
}

/**
 * Combines two copies of progress (this phone and the database) without losing sets from either.
 * Logged sessions and finished days are unions; where both sides changed the same logged session, the later edit wins.
 * The next day is worked out from the merged finished days, never taken from one copy: a fresh browser starts at
 * day 1, and a tap there must not reset the rotation everywhere. The open session comes from the copy changed last,
 * unless another device has already finished it.
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
    const mergedHistory = [...history.values()].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, HISTORY_LIMIT);
    const finishedIds = new Set(mergedHistory.flatMap((finished) => (finished.sessionId ? [finished.sessionId] : [])));
    const session = newer.session && !finishedIds.has(newer.session.startedAt) ? newer.session : null;
    return {
      nextDayId: ProgressMerge.nextDayId(mergedHistory),
      session,
      history: mergedHistory,
      log,
      ...(updatedAt ? { updatedAt } : {}),
    };
  }

  /** The day after the most recently finished one; day 1 before anything is finished. */
  static nextDayId(history: readonly FinishedSession[]): Progress['nextDayId'] {
    const latest = history[0];
    return latest ? ProgramHelpers.dayAfter(latest.dayId) : 1;
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
