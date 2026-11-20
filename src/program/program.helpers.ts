import { PROGRAM } from './program.data.ts';
import { DAY_COUNT, RAMP_UP_MINUTES, SECONDS_PER_SET, TRANSITION_SECONDS_PER_EXERCISE, WARMUP_MINUTES } from './program.constants.ts';
import type { DayId, Exercise, TrainingDay } from './program.types.ts';

export class ProgramHelpers {
  static findDay(dayId: DayId): TrainingDay {
    const day = PROGRAM.find((candidate) => candidate.id === dayId);
    if (!day) throw new Error(`No day ${dayId}`);
    return day;
  }

  static isDayId(value: unknown): value is DayId {
    return value === 1 || value === 2 || value === 3 || value === 4;
  }

  static dayAfter(dayId: DayId): DayId {
    return ((dayId % DAY_COUNT) + 1) as DayId;
  }

  static exerciseSeconds(exercise: Exercise): number {
    const sides = exercise.perSide ? 2 : 1;
    const work = exercise.sets * SECONDS_PER_SET * sides;
    // No rest needed after the last set: you walk to the next kit instead.
    const rest = (exercise.sets - 1) * exercise.restSeconds;
    return work + rest + TRANSITION_SECONDS_PER_EXERCISE;
  }

  /** Whole session, warm-up included, in minutes rounded to 5. */
  static estimateMinutes(day: TrainingDay): number {
    const lifting = day.exercises.reduce((total, exercise) => total + ProgramHelpers.exerciseSeconds(exercise), 0) / 60;
    return Math.round((WARMUP_MINUTES + RAMP_UP_MINUTES + lifting) / 5) * 5;
  }

  static totalSets(day: TrainingDay): number {
    return day.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  }

  static formatRest(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest === 0 ? `${minutes} min` : `${minutes}:${String(rest).padStart(2, '0')}`;
  }

  static pictureUrls(folder: string): readonly [string, string] {
    return [`/exercises/${folder}/0.jpg`, `/exercises/${folder}/1.jpg`];
  }
}
