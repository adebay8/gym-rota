/** The five state marks (Strata: StateMark). Shape carries the state; only Stopped has colour. */
export const STATES = {
  NEEDS_YOU: 'needs',
  RUNNING: 'running',
  DONE: 'done',
  STOPPED: 'stopped',
  SETTLED: 'settled',
} as const;

export const STATE_WORDS = {
  needs: 'Needs you',
  running: 'Running',
  done: 'Done',
  stopped: 'Stopped',
  settled: 'Settled',
} as const;


/** Radio-group keys (WAI-ARIA): either axis moves, wrapping at the ends. */
export const NEXT_KEYS = ['ArrowRight', 'ArrowDown'] as const;
export const PREVIOUS_KEYS = ['ArrowLeft', 'ArrowUp'] as const;
