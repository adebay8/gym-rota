import type { Progress } from './progress.types.ts';

export const PROGRESS_STORAGE_KEY = 'rota.progress.v1';
/** Enough history for "last done" on every day, with room to spare. */
export const HISTORY_LIMIT = 60;
/** Sessions kept per exercise: about two years at one session a week. */
export const LOG_LIMIT_PER_EXERCISE = 100;
export const EMPTY_PROGRESS: Progress = { nextDayId: 1, history: [], session: null, log: {} };

/** Typed values outside these bounds are treated as typos and ignored. */
export const MAX_WEIGHT_KG = 500;
export const MAX_REPS = 100;
/** Weights round to the nearest 0.25 kg (the smallest plate pair). */
export const WEIGHT_STEP_KG = 0.25;

export const EFFORTS = {
  EASY: 'easy',
  HARD: 'hard',
  ALL_OUT: 'allOut',
} as const;
