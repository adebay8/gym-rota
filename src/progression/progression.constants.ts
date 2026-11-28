export const PROGRESSION_KINDS = {
  FIRST: 'first',
  HEAVIER: 'heavier',
  SAME: 'same',
  MORE_REPS: 'moreReps',
  LIGHTER: 'lighter',
  ADD_WEIGHT: 'addWeight',
} as const;

/** Reps short of the top that still count as "close" when a set felt easy. */
export const EASY_REPS_FROM_TOP = 2;
/** Easy at the top of the range earns a double jump. */
export const EASY_JUMP_STEPS = 2;
