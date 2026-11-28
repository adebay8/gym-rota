/** Time estimates for a session. A hard set of up to 10 reps takes about 40 s; moving between kit about 2 min. */
export const SECONDS_PER_SET = 40;
export const TRANSITION_SECONDS_PER_EXERCISE = 120;
export const WARMUP_MINUTES = 12;
/** Ramp-up sets before the first lift. */
export const RAMP_UP_MINUTES = 4;
export const DAY_COUNT = 4;

export const LOADS = {
  DUMBBELL: 'dumbbell',
  MACHINE: 'machine',
  CABLE: 'cable',
  SMITH: 'smith',
  EZ_BAR: 'ezBar',
  BODYWEIGHT: 'bodyweight',
} as const;

/** The usual smallest step up for each kind of load. Dumbbells are per dumbbell; Smith and EZ bar are the total added. */
export const INCREMENT_KG = {
  dumbbell: 2,
  machine: 5,
  cable: 2.5,
  smith: 5,
  ezBar: 2.5,
  bodyweight: 0,
} as const;

/** The bottom of the rep range. Below this on the first set, the weight is too heavy. */
export const REPS_MIN = 6;
