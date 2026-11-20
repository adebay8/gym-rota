import type { DayId } from '../program/program.types.ts';

export interface FinishedSession {
  readonly dayId: DayId;
  /** ISO timestamp. */
  readonly finishedAt: string;
}

/** The day in progress: which warm-up steps and sets are ticked. Survives closing the tab. */
export interface OpenSession {
  readonly dayId: DayId;
  readonly startedAt: string;
  readonly ticked: readonly string[];
}

export interface Progress {
  readonly nextDayId: DayId;
  readonly history: readonly FinishedSession[];
  readonly session: OpenSession | null;
}
