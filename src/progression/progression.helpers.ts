import { INCREMENT_KG, REPS_MIN } from '../program/program.constants.ts';
import type { Exercise } from '../program/program.types.ts';
import { EFFORTS } from '../progress/progress.constants.ts';
import type { LoggedExercise, SetEntry } from '../progress/progress.types.ts';
import { SetEntryHelpers } from '../progress/set-entry.helpers.ts';
import { EASY_JUMP_STEPS, EASY_REPS_FROM_TOP, PROGRESSION_KINDS } from './progression.constants.ts';
import type { Target } from './progression.types.ts';

const EPLEY_REPS_DIVISOR = 30;

/**
 * Double progression with a feel check. Keep the weight and add reps until every set reaches the top of the range,
 * then go up the smallest step and build the reps back. "Easy" (3+ reps left) speeds that up; "all out" with too few
 * reps steps back. Reps in reserve as the feel scale follows Zourdos et al. 2016 and Helms et al. 2016.
 */
export class ProgressionHelpers {
  static target(exercise: Exercise, last: LoggedExercise | undefined): Target {
    const done = last?.sets.filter((set): set is SetEntry => set !== null) ?? [];
    if (!last || done.length === 0) {
      return {
        kind: PROGRESSION_KINDS.FIRST,
        weightKg: null,
        reps: [],
        headline: exercise.load === 'bodyweight' ? 'First time: as many good reps as you can' : `First time: find a weight for ${REPS_MIN}–${exercise.repsMax} reps`,
        reason: 'Log what you lift and the app will suggest your next weight.',
      };
    }

    const lastReps = Array.from({ length: exercise.sets }, (_, index) => last.sets[index]?.reps ?? null);
    const repsDone = done.map((set) => set.reps ?? 0);
    const hitTopEverySet = done.length >= exercise.sets && repsDone.every((reps) => reps >= exercise.repsMax);
    const lowestReps = Math.min(...repsDone);
    const firstReps = repsDone[0] ?? 0;
    const weight = ProgressionHelpers.workingWeight(done);
    const effort = last.effort;
    const step = INCREMENT_KG[exercise.load];

    if (exercise.load === 'bodyweight' || weight === null || weight === 0) {
      if (hitTopEverySet && effort !== EFFORTS.ALL_OUT) {
        return { kind: PROGRESSION_KINDS.ADD_WEIGHT, weightKg: null, reps: [], headline: 'Add weight: hold a light dumbbell', reason: `You got ${exercise.repsMax} on every set. Add a little weight and build the reps back up.` };
      }
      return { kind: PROGRESSION_KINDS.MORE_REPS, weightKg: weight, reps: lastReps, headline: 'Beat last time by one rep', reason: 'Add a rep to any set, keeping the form clean.' };
    }

    const goHeavier = (steps: number, reason: string): Target => {
      const next = weight + step * steps;
      return { kind: PROGRESSION_KINDS.HEAVIER, weightKg: next, reps: [], headline: `Go up to ${SetEntryHelpers.formatWeight(next)} kg`, reason };
    };

    if (hitTopEverySet && effort === EFFORTS.EASY) return goHeavier(EASY_JUMP_STEPS, `${exercise.repsMax} on every set and it felt easy, so a bigger jump. Expect fewer reps; build back to ${exercise.repsMax}.`);
    if (hitTopEverySet && effort !== EFFORTS.ALL_OUT) return goHeavier(1, `You got ${exercise.repsMax} on every set. Expect fewer reps at the new weight; build back to ${exercise.repsMax}.`);
    if (effort === EFFORTS.EASY && lowestReps >= exercise.repsMax - EASY_REPS_FROM_TOP) return goHeavier(1, 'Close to the top and it felt easy, so move up now.');
    if (effort === EFFORTS.ALL_OUT && firstReps < REPS_MIN && weight - step > 0) {
      const lighter = weight - step;
      return { kind: PROGRESSION_KINDS.LIGHTER, weightKg: lighter, reps: [], headline: `Drop to ${SetEntryHelpers.formatWeight(lighter)} kg`, reason: `Under ${REPS_MIN} reps with nothing left. A little lighter keeps you in the ${REPS_MIN}–${exercise.repsMax} range.` };
    }
    if (effort === EFFORTS.EASY) {
      return { kind: PROGRESSION_KINDS.MORE_REPS, weightKg: weight, reps: lastReps, headline: `${SetEntryHelpers.formatWeight(weight)} kg, push every set harder`, reason: 'It felt easy, so take each set closer to failure: aim for 2 more reps.' };
    }
    return { kind: PROGRESSION_KINDS.SAME, weightKg: weight, reps: lastReps, headline: `${SetEntryHelpers.formatWeight(weight)} kg, beat one set by a rep`, reason: `Stay at this weight until every set reaches ${exercise.repsMax}.` };
  }

  /** The weight most sets were done at; ties go to the heavier. */
  static workingWeight(sets: readonly SetEntry[]): number | null {
    const counts = new Map<number, number>();
    for (const set of sets) if (set.weightKg !== null) counts.set(set.weightKg, (counts.get(set.weightKg) ?? 0) + 1);
    let best: number | null = null;
    for (const [weight, count] of counts) if (best === null || count > (counts.get(best) ?? 0) || (count === counts.get(best) && weight > best)) best = weight;
    return best;
  }

  /** Volume load: weight × reps, summed. Logged weight as typed (per dumbbell), so comparisons stay like for like. */
  static volumeKg(sets: readonly (SetEntry | null)[]): number {
    return sets.reduce((total, set) => total + (set?.weightKg ?? 0) * (set?.reps ?? 0), 0);
  }

  static totalReps(sets: readonly (SetEntry | null)[]): number {
    return sets.reduce((total, set) => total + (set?.reps ?? 0), 0);
  }

  /** Estimated one-rep max (Epley). Used only to compare sets at different weights and reps. */
  static estimatedMaxKg(set: SetEntry | null): number {
    if (!set || set.weightKg === null || set.reps === null || set.reps === 0) return 0;
    return set.weightKg * (1 + set.reps / EPLEY_REPS_DIVISOR);
  }

  /** Today's sets that beat every set from earlier sessions. Only counts once there is an earlier session. */
  static newBests(today: readonly (SetEntry | null)[], earlier: readonly LoggedExercise[]): readonly number[] {
    const previousBest = Math.max(0, ...earlier.flatMap((logged) => logged.sets.map((set) => ProgressionHelpers.estimatedMaxKg(set))));
    if (previousBest === 0) return [];
    const best = Math.max(...today.map((set) => ProgressionHelpers.estimatedMaxKg(set)));
    return best > previousBest ? today.flatMap((set, index) => (ProgressionHelpers.estimatedMaxKg(set) === best ? [index] : [])) : [];
  }

  /** "up 6%" / "down 3%" / "same as" for one number against last time. */
  static describeChange(now: number, before: number): string {
    if (before === 0) return '';
    const percent = Math.round(((now - before) / before) * 100);
    if (percent === 0) return 'same as last time';
    return percent > 0 ? `up ${percent}% on last time` : `down ${Math.abs(percent)}% on last time`;
  }
}
