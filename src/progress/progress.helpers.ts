import { ProgramHelpers } from '../program/program.helpers.ts';
import type { DayId } from '../program/program.types.ts';
import type { Exercise } from '../program/program.types.ts';
import { ProgressionHelpers } from '../progression/progression.helpers.ts';
import { EFFORTS, EMPTY_PROGRESS, HISTORY_LIMIT, LOG_LIMIT_PER_EXERCISE } from './progress.constants.ts';
import type { Effort, FinishedSession, LoggedExercise, OpenSession, Progress, RestTimer, SetAddress, SetEntry } from './progress.types.ts';
import { SetEntryHelpers } from './set-entry.helpers.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown): SetEntry | null {
  if (!isRecord(value)) return null;
  const weightKg = typeof value.weightKg === 'number' && Number.isFinite(value.weightKg) ? value.weightKg : null;
  const reps = typeof value.reps === 'number' && Number.isInteger(value.reps) ? value.reps : null;
  return { weightKg, reps };
}

function isEffort(value: unknown): value is Effort {
  return Object.values(EFFORTS).some((effort) => effort === value);
}

function parseRest(value: unknown): RestTimer | undefined {
  return isRecord(value) && typeof value.exerciseName === 'string' && typeof value.endsAt === 'number' ? { exerciseName: value.exerciseName, endsAt: value.endsAt } : undefined;
}

function parseSession(value: unknown): OpenSession | null {
  if (!isRecord(value) || !ProgramHelpers.isDayId(value.dayId) || typeof value.startedAt !== 'string' || !Array.isArray(value.ticked)) return null;
  const entries: Record<string, SetEntry> = {};
  if (isRecord(value.entries)) {
    for (const [key, raw] of Object.entries(value.entries)) {
      const entry = parseEntry(raw);
      if (entry) entries[key] = entry;
    }
  }
  const rest = parseRest(value.rest);
  return { dayId: value.dayId, startedAt: value.startedAt, ticked: value.ticked.filter((key: unknown): key is string => typeof key === 'string'), entries, ...(rest ? { rest } : {}) };
}

function parseLog(value: unknown): Record<string, LoggedExercise[]> {
  const log: Record<string, LoggedExercise[]> = {};
  if (!isRecord(value)) return log;
  for (const [exerciseId, sessions] of Object.entries(value)) {
    if (!Array.isArray(sessions)) continue;
    const parsed = sessions.flatMap((session: unknown): LoggedExercise[] =>
      isRecord(session) && typeof session.sessionId === 'string' && ProgramHelpers.isDayId(session.dayId) && typeof session.loggedAt === 'string' && Array.isArray(session.sets)
        ? [{ sessionId: session.sessionId, dayId: session.dayId, loggedAt: session.loggedAt, sets: session.sets.map(parseEntry), ...(isEffort(session.effort) ? { effort: session.effort } : {}) }]
        : [],
    );
    if (parsed.length > 0) log[exerciseId] = parsed;
  }
  return log;
}

/** Pure state changes and parsing for progress. Storage lives in progress.store.ts. */
export class ProgressHelpers {
  /** Reads stored JSON defensively: anything malformed falls back to a fresh start rather than crashing at the gym. */
  static parse(raw: string | null): Progress {
    if (raw === null) return EMPTY_PROGRESS;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      return EMPTY_PROGRESS;
    }
    return ProgressHelpers.fromUnknown(value) ?? EMPTY_PROGRESS;
  }

  /** Null when the value isn't progress at all (used to reject a wrong file on restore). */
  static fromUnknown(value: unknown): Progress | null {
    if (!isRecord(value) || !ProgramHelpers.isDayId(value.nextDayId)) return null;
    const history: FinishedSession[] = Array.isArray(value.history)
      ? value.history.flatMap((entry: unknown) =>
          isRecord(entry) && ProgramHelpers.isDayId(entry.dayId) && typeof entry.finishedAt === 'string'
            ? [{ dayId: entry.dayId, finishedAt: entry.finishedAt, ...(typeof entry.sessionId === 'string' ? { sessionId: entry.sessionId } : {}) }]
            : [],
        )
      : [];
    return { nextDayId: value.nextDayId, history, session: parseSession(value.session), log: parseLog(value.log), ...(typeof value.updatedAt === 'string' ? { updatedAt: value.updatedAt } : {}) };
  }

  /** The open session for this day, starting a fresh one if another day (or none) was open. */
  static sessionFor(progress: Progress, dayId: DayId, now: Date): OpenSession {
    return progress.session?.dayId === dayId ? progress.session : { dayId, startedAt: now.toISOString(), ticked: [], entries: {} };
  }

  static toggle(progress: Progress, dayId: DayId, key: string, now: Date): Progress {
    const current = ProgressHelpers.sessionFor(progress, dayId, now);
    const ticked = current.ticked.includes(key) ? current.ticked.filter((existing) => existing !== key) : [...current.ticked, key];
    return { ...progress, session: { ...current, ticked } };
  }

  /** Typing into a set's fields. If the set is already ticked, the log follows the edit. */
  static draftSet(progress: Progress, address: SetAddress, entry: SetEntry, now: Date): Progress {
    const key = ProgressHelpers.setKey(address.exerciseId, address.setIndex);
    const current = ProgressHelpers.sessionFor(progress, address.dayId, now);
    const session: OpenSession = { ...current, entries: { ...current.entries, [key]: entry } };
    const next = { ...progress, session };
    return current.ticked.includes(key) ? ProgressHelpers.#writeLog(next, session, address, entry, now) : next;
  }

  /** Ticking a set: it's done, with these values. */
  static logSet(progress: Progress, address: SetAddress, entry: SetEntry, now: Date): Progress {
    const key = ProgressHelpers.setKey(address.exerciseId, address.setIndex);
    const current = ProgressHelpers.sessionFor(progress, address.dayId, now);
    const ticked = current.ticked.includes(key) ? current.ticked : [...current.ticked, key];
    const session: OpenSession = { ...current, ticked, entries: { ...current.entries, [key]: entry } };
    return ProgressHelpers.#writeLog({ ...progress, session }, session, address, entry, now);
  }

  /** Unticking a set takes it out of the log but keeps what was typed. */
  static unlogSet(progress: Progress, address: SetAddress, now: Date): Progress {
    const key = ProgressHelpers.setKey(address.exerciseId, address.setIndex);
    const current = ProgressHelpers.sessionFor(progress, address.dayId, now);
    const session: OpenSession = { ...current, ticked: current.ticked.filter((existing) => existing !== key) };
    return ProgressHelpers.#writeLog({ ...progress, session }, session, address, null, now);
  }

  static #writeLog(progress: Progress, session: OpenSession, address: SetAddress, entry: SetEntry | null, now: Date): Progress {
    const sessions = progress.log[address.exerciseId] ?? [];
    const existing = sessions.find((logged) => logged.sessionId === session.startedAt);
    const sets = [...(existing?.sets ?? [])];
    while (sets.length <= address.setIndex) sets.push(null);
    sets[address.setIndex] = entry;
    while (sets.length > 0 && sets.at(-1) === null) sets.pop();
    const others = sessions.filter((logged) => logged.sessionId !== session.startedAt);
    const effort = existing?.effort;
    // An emptied entry is kept (with no sets) rather than removed, so a sync carries the untick to other devices.
    const updated: LoggedExercise[] = [{ sessionId: session.startedAt, dayId: address.dayId, loggedAt: now.toISOString(), sets, ...(effort ? { effort } : {}) }, ...others];
    return { ...progress, log: { ...progress.log, [address.exerciseId]: updated.slice(0, LOG_LIMIT_PER_EXERCISE) } };
  }

  /** How the last set felt. Tapping the same answer again clears it. */
  static setEffort(progress: Progress, dayId: DayId, exerciseId: string, effort: Effort, now: Date): Progress {
    const sessionId = progress.session?.dayId === dayId ? progress.session.startedAt : undefined;
    const sessions = progress.log[exerciseId];
    if (!sessionId || !sessions) return progress;
    const updated = sessions.map((logged) => {
      if (logged.sessionId !== sessionId) return logged;
      // A new loggedAt so the choice wins when another copy of this session is merged in.
      const { effort: previous, ...rest } = { ...logged, loggedAt: now.toISOString() };
      return previous === effort ? rest : { ...rest, effort };
    });
    return { ...progress, log: { ...progress.log, [exerciseId]: updated } };
  }

  static effort(progress: Progress, dayId: DayId, exerciseId: string): Effort | undefined {
    const sessionId = progress.session?.dayId === dayId ? progress.session.startedAt : undefined;
    return progress.log[exerciseId]?.find((logged) => logged.sessionId === sessionId)?.effort;
  }

  /** The current session's sets for one exercise, as logged. */
  static todaySets(progress: Progress, dayId: DayId, exerciseId: string): readonly (SetEntry | null)[] {
    const sessionId = progress.session?.dayId === dayId ? progress.session.startedAt : undefined;
    return progress.log[exerciseId]?.find((logged) => logged.sessionId === sessionId)?.sets ?? [];
  }

  static startRest(progress: Progress, rest: RestTimer | null): Progress {
    if (!progress.session) return progress;
    const { rest: _previous, ...session } = progress.session;
    return { ...progress, session: rest ? { ...session, rest } : session };
  }

  /** Totals for one session across every exercise: volume, sets and new bests. */
  static sessionSummary(progress: Progress, sessionId: string): { readonly volumeKg: number; readonly sets: number; readonly newBests: number } {
    let volumeKg = 0;
    let sets = 0;
    let newBests = 0;
    for (const sessions of Object.values(progress.log)) {
      const index = sessions.findIndex((logged) => logged.sessionId === sessionId);
      const logged = sessions[index];
      if (!logged) continue;
      const earlier = sessions.slice(index + 1).filter((other) => other.sets.some((set) => set !== null));
      volumeKg += ProgressionHelpers.volumeKg(logged.sets);
      sets += logged.sets.filter((set) => set !== null).length;
      if (ProgressionHelpers.newBests(logged.sets, earlier).length > 0) newBests += 1;
    }
    return { volumeKg, sets, newBests };
  }

  static finish(progress: Progress, dayId: DayId, now: Date): Progress {
    const sessionId = progress.session?.dayId === dayId ? progress.session.startedAt : undefined;
    const history = [{ dayId, finishedAt: now.toISOString(), ...(sessionId ? { sessionId } : {}) }, ...progress.history].slice(0, HISTORY_LIMIT);
    return { ...progress, nextDayId: ProgramHelpers.dayAfter(dayId), history, session: null };
  }

  static ticked(progress: Progress, dayId: DayId): ReadonlySet<string> {
    return new Set(progress.session?.dayId === dayId ? progress.session.ticked : []);
  }

  static entry(progress: Progress, dayId: DayId, key: string): SetEntry | undefined {
    return progress.session?.dayId === dayId ? progress.session.entries[key] : undefined;
  }

  /** The most recent session of this exercise other than the one open now. */
  static lastLogged(progress: Progress, exerciseId: string): LoggedExercise | undefined {
    return ProgressHelpers.pastLogs(progress, exerciseId)[0];
  }

  static pastLogs(progress: Progress, exerciseId: string): readonly LoggedExercise[] {
    const openId = progress.session?.startedAt;
    return (progress.log[exerciseId] ?? []).filter((logged) => logged.sessionId !== openId && logged.sets.some((set) => set !== null));
  }

  /** True when every set last time reached the rep target: time to go heavier. */
  static isReadyToGoHeavier(logged: LoggedExercise | undefined, setCount: number, repsMax: number): boolean {
    if (!logged || logged.sets.length < setCount) return false;
    return logged.sets.slice(0, setCount).every((set) => set !== null && set.reps !== null && set.reps >= repsMax);
  }

  static lastFinished(progress: Progress, dayId: DayId): FinishedSession | undefined {
    return progress.history.find((entry) => entry.dayId === dayId);
  }

  static hasAnyLog(progress: Progress): boolean {
    return Object.values(progress.log).some((sessions) => sessions.some((logged) => logged.sets.some((set) => set !== null)));
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

  /** What the app suggests for one set: the target, unless you already chose a weight on an earlier set today. */
  static suggestion(progress: Progress, address: SetAddress, exercise: Exercise): SetEntry | undefined {
    const target = ProgressionHelpers.target(exercise, ProgressHelpers.lastLogged(progress, address.exerciseId));
    const targetReps = target.reps[address.setIndex] ?? null;
    for (let index = address.setIndex - 1; index >= 0; index -= 1) {
      const earlier = ProgressHelpers.entry(progress, address.dayId, ProgressHelpers.setKey(address.exerciseId, index));
      if (earlier && earlier.weightKg !== null) return { weightKg: earlier.weightKg, reps: earlier.weightKg === target.weightKg ? targetReps : null };
    }
    if (target.weightKg !== null || target.reps.length > 0) return { weightKg: target.weightKg, reps: targetReps };
    return undefined;
  }
}
