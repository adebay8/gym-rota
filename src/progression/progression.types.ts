import type { PROGRESSION_KINDS } from './progression.constants.ts';

export type ProgressionKind = (typeof PROGRESSION_KINDS)[keyof typeof PROGRESSION_KINDS];

/** What to aim for this time, worked out from last time. */
export interface Target {
  readonly kind: ProgressionKind;
  /** Null when there's nothing to go on, or the movement is bodyweight. */
  readonly weightKg: number | null;
  /** Per set; null where the reps will depend on the new weight. */
  readonly reps: readonly (number | null)[];
  /** One short line, shown under the exercise name. */
  readonly headline: string;
  /** Why, in one sentence, for the exercise screen. */
  readonly reason: string;
}
