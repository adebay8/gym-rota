import type { Progress } from './progress.types.ts';

export const PROGRESS_STORAGE_KEY = 'rota.progress.v1';
/** Enough history for "last done" on every day, with room to spare. */
export const HISTORY_LIMIT = 60;
export const EMPTY_PROGRESS: Progress = { nextDayId: 1, history: [], session: null };
