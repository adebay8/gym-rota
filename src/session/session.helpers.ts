import { ProgressHelpers } from '../progress/progress.helpers.ts';
import type { Exercise, TrainingDay } from '../program/program.types.ts';

export class SessionHelpers {
  static allKeys(day: TrainingDay): readonly string[] {
    return [...day.warmup.map((step) => ProgressHelpers.warmupKey(step.id)), ...day.exercises.flatMap((exercise) => SessionHelpers.setKeys(exercise))];
  }

  static setKeys(exercise: Exercise): readonly string[] {
    return Array.from({ length: exercise.sets }, (_, index) => ProgressHelpers.setKey(exercise.id, index));
  }

  static countTicked(keys: readonly string[], ticked: ReadonlySet<string>): number {
    return keys.filter((key) => ticked.has(key)).length;
  }

  static formatClock(totalSeconds: number): string {
    const seconds = Math.max(0, Math.ceil(totalSeconds));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
}
