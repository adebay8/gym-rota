import type { DayId } from '../program/program.types.ts';
import type { EFFORTS } from './progress.constants.ts';

/** How hard the last set felt, as reps left in the tank (the RIR scale). */
export type Effort = (typeof EFFORTS)[keyof typeof EFFORTS];

export interface FinishedSession {
  readonly dayId: DayId;
  /** ISO timestamp. */
  readonly finishedAt: string;
  /** The open session's id, to find its sets in the log. Missing on sessions finished before logging existed. */
  readonly sessionId?: string;
}

/** What you lifted in one set. Weight is null for bodyweight; reps is null if you didn't count. */
export interface SetEntry {
  readonly weightKg: number | null;
  readonly reps: number | null;
}

/** The day in progress: which warm-up steps and sets are ticked, and what's typed. Survives closing the tab. */
export interface OpenSession {
  readonly dayId: DayId;
  /** ISO timestamp; also the session's id in the exercise log. */
  readonly startedAt: string;
  readonly ticked: readonly string[];
  /** Typed values by set key, ticked or not yet. */
  readonly entries: Readonly<Record<string, SetEntry>>;
  /** The running rest timer, kept here so it carries across exercise screens and reloads. */
  readonly rest?: RestTimer;
}

export interface RestTimer {
  readonly exerciseName: string;
  /** Epoch ms. */
  readonly endsAt: number;
}

/** One session's sets for one exercise, by set index. A gap (null) is a set you didn't tick. */
export interface LoggedExercise {
  readonly sessionId: string;
  readonly dayId: DayId;
  /** ISO timestamp of the last change. */
  readonly loggedAt: string;
  readonly sets: readonly (SetEntry | null)[];
  readonly effort?: Effort;
}

export interface Progress {
  readonly nextDayId: DayId;
  readonly history: readonly FinishedSession[];
  readonly session: OpenSession | null;
  /** Newest first, by exercise id. Written the moment a set is ticked, so nothing waits on "Finish". */
  readonly log: Readonly<Record<string, readonly LoggedExercise[]>>;
  /** ISO timestamp of the last change on any device; decides whose rotation and open session win in a sync. */
  readonly updatedAt?: string;
}

export interface SetAddress {
  readonly dayId: DayId;
  readonly exerciseId: string;
  readonly setIndex: number;
}
