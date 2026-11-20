import type { Stratum } from '../strata/components/components.types.ts';

export type DayId = 1 | 2 | 3 | 4;

/** One picture pair from free-exercise-db: `0.jpg` is the start position, `1.jpg` the end. */
export interface Pictures {
  readonly folder: string;
  /** Set when the pictures show a close cousin of the movement (another machine), so the caption can say so. */
  readonly note?: string;
}

export interface WarmupStep {
  readonly id: string;
  readonly name: string;
  /** How much: "5 min easy", "10 each side". */
  readonly dose: string;
  readonly how: readonly string[];
  readonly pictures: Pictures;
}

export interface Exercise {
  readonly id: string;
  readonly name: string;
  /** The machine or kit, in the words you'd use in the gym. */
  readonly kit: string;
  readonly sets: number;
  readonly repsMax: number;
  readonly restSeconds: number;
  /** Muscles worked, short. */
  readonly works: string;
  readonly how: readonly string[];
  /** What to do instead when the kit is taken. */
  readonly swap: string;
  readonly pictures: Pictures;
  /** Per leg or per arm: shown after the reps. */
  readonly perSide?: boolean;
}

export interface TrainingDay {
  readonly id: DayId;
  readonly name: string;
  readonly focus: string;
  readonly stratum: Exclude<Stratum, 'other'>;
  readonly warmup: readonly WarmupStep[];
  /** The first lift's ramp-up, said in words: no weights. */
  readonly rampUp: string;
  readonly exercises: readonly Exercise[];
}
