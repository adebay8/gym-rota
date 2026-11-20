import { ProgramHelpers } from '../program/program.helpers.ts';
import type { DayId } from '../program/program.types.ts';
import { EMPTY_PROGRESS, HISTORY_LIMIT } from './progress.constants.ts';
import type { FinishedSession, OpenSession, Progress } from './progress.types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Pure state changes and parsing for progress. Storage lives in progress.store.ts. */
export class ProgressHelpers {
  /** Reads stored JSON defensively: anything malformed falls back to a fresh start rather than crashing the gym. */
  static parse(raw: string | null): Progress {
    if (raw === null) return EMPTY_PROGRESS;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      return EMPTY_PROGRESS;
    }
    if (!isRecord(value) || !ProgramHelpers.isDayId(value.nextDayId)) return EMPTY_PROGRESS;
    const history: FinishedSession[] = Array.isArray(value.history)
      ? value.history.flatMap((entry: unknown) => (isRecord(entry) && ProgramHelpers.isDayId(entry.dayId) && typeof entry.finishedAt === 'string' ? [{ dayId: entry.dayId, finishedAt: entry.finishedAt }] : []))
      : [];
    const session = value.session;
    const openSession: OpenSession | null =
      isRecord(session) && ProgramHelpers.isDayId(session.dayId) && typeof session.startedAt === 'string' && Array.isArray(session.ticked)
        ? { dayId: session.dayId, startedAt: session.startedAt, ticked: session.ticked.filter((key: unknown): key is string => typeof key === 'string') }
        : null;
    return { nextDayId: value.nextDayId, history, session: openSession };
  }

  static toggle(progress: Progress, dayId: DayId, key: string, now: Date): Progress {
    const current = progress.session?.dayId === dayId ? progress.session : { dayId, startedAt: now.toISOString(), ticked: [] };
    const ticked = current.ticked.includes(key) ? current.ticked.filter((existing) => existing !== key) : [...current.ticked, key];
    return { ...progress, session: { ...current, ticked } };
  }

  static finish(progress: Progress, dayId: DayId, now: Date): Progress {
    const history = [{ dayId, finishedAt: now.toISOString() }, ...progress.history].slice(0, HISTORY_LIMIT);
    return { nextDayId: ProgramHelpers.dayAfter(dayId), history, session: null };
  }

  static setNext(progress: Progress, dayId: DayId): Progress {
    return { ...progress, nextDayId: dayId };
  }

  static ticked(progress: Progress, dayId: DayId): ReadonlySet<string> {
    return new Set(progress.session?.dayId === dayId ? progress.session.ticked : []);
  }

  static lastFinished(progress: Progress, dayId: DayId): FinishedSession | undefined {
    return progress.history.find((entry) => entry.dayId === dayId);
  }

  /** "today", "yesterday", "3 days ago", or "12 Nov". */
  static describeWhen(iso: string, now: Date): string {
    const then = new Date(iso);
    const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  static setKey(exerciseId: string, setIndex: number): string {
    return `set:${exerciseId}:${setIndex}`;
  }

  static warmupKey(stepId: string): string {
    return `warmup:${stepId}`;
  }
}
