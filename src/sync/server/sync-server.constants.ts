export const DEFAULT_DATABASE = 'rota';
export const PROGRESS_COLLECTION = 'progress';
/** One document holds everything: it's one person's log. */
export const PROGRESS_DOCUMENT_ID = 'progress';
/** Years of logging fit in well under this; anything bigger is a mistake or abuse. */
export const MAX_BODY_BYTES = 2_000_000;
export const SERVER_SELECTION_TIMEOUT_MS = 8000;
export const MIN_SYNC_KEY_LENGTH = 24;
