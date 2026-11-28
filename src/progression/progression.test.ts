import { describe, expect, it } from 'vitest';

import { ProgramHelpers } from '../program/program.helpers.ts';
import type { Exercise } from '../program/program.types.ts';
import type { Effort, LoggedExercise, SetEntry } from '../progress/progress.types.ts';
import { ProgressionHelpers } from './progression.helpers.ts';

const SMITH_BENCH = ProgramHelpers.findDay(1).exercises[0] as Exercise; // smith, 3 sets, +5 kg
const DUMBBELL_PRESS = ProgramHelpers.findDay(1).exercises[1] as Exercise; // dumbbell, +2 kg
const PULL_UPS = ProgramHelpers.findDay(2).exercises[0] as Exercise; // bodyweight

function logged(sets: readonly [number | null, number][], effort?: Effort): LoggedExercise {
  return { sessionId: 's', dayId: 1, loggedAt: '2026-11-20T18:00:00.000Z', sets: sets.map(([weightKg, reps]): SetEntry => ({ weightKg, reps })), ...(effort ? { effort } : {}) };
}

describe('progression target', () => {
  it('asks for a starting weight the first time', () => {
    expect(ProgressionHelpers.target(SMITH_BENCH, undefined).kind).toBe('first');
  });

  it('keeps the weight until every set reaches 10', () => {
    const target = ProgressionHelpers.target(SMITH_BENCH, logged([[60, 10], [60, 9], [60, 8]]));
    expect(target).toMatchObject({ kind: 'same', weightKg: 60, reps: [10, 9, 8] });
  });

  it('goes up one step when every set reaches 10', () => {
    expect(ProgressionHelpers.target(SMITH_BENCH, logged([[60, 10], [60, 10], [60, 10]]))).toMatchObject({ kind: 'heavier', weightKg: 65, reps: [] });
    expect(ProgressionHelpers.target(DUMBBELL_PRESS, logged([[20, 10], [20, 10], [20, 10]], 'hard'))).toMatchObject({ kind: 'heavier', weightKg: 22 });
  });

  it('jumps two steps when 10 everywhere felt easy', () => {
    expect(ProgressionHelpers.target(DUMBBELL_PRESS, logged([[20, 10], [20, 10], [20, 10]], 'easy')).weightKg).toBe(24);
  });

  it('holds when 10 everywhere took everything', () => {
    expect(ProgressionHelpers.target(DUMBBELL_PRESS, logged([[20, 10], [20, 10], [20, 10]], 'allOut')).kind).toBe('same');
  });

  it('moves up early when close to the top and easy', () => {
    expect(ProgressionHelpers.target(DUMBBELL_PRESS, logged([[20, 9], [20, 8], [20, 8]], 'easy'))).toMatchObject({ kind: 'heavier', weightKg: 22 });
  });

  it('asks for more reps when easy but far from the top', () => {
    expect(ProgressionHelpers.target(DUMBBELL_PRESS, logged([[20, 7], [20, 6], [20, 6]], 'easy')).kind).toBe('moreReps');
  });

  it('drops a step when all out under 6 reps', () => {
    expect(ProgressionHelpers.target(SMITH_BENCH, logged([[80, 4], [80, 3], [80, 3]], 'allOut'))).toMatchObject({ kind: 'lighter', weightKg: 75 });
  });

  it('adds reps, then weight, on bodyweight moves', () => {
    expect(ProgressionHelpers.target(PULL_UPS, logged([[null, 8], [null, 7], [null, 6]])).kind).toBe('moreReps');
    expect(ProgressionHelpers.target(PULL_UPS, logged([[null, 10], [null, 10], [null, 10]])).kind).toBe('addWeight');
  });

  it('does not call it 10 everywhere when a set is missing', () => {
    expect(ProgressionHelpers.target(SMITH_BENCH, logged([[60, 10], [60, 10]])).kind).toBe('same');
  });
});

describe('volume and bests', () => {
  it('sums weight × reps', () => {
    expect(ProgressionHelpers.volumeKg([{ weightKg: 20, reps: 10 }, null, { weightKg: 22.5, reps: 8 }])).toBe(380);
  });

  it('finds a new best only against earlier sessions', () => {
    const earlier = [logged([[60, 10], [60, 9]])];
    expect(ProgressionHelpers.newBests([{ weightKg: 65, reps: 8 }, { weightKg: 65, reps: 6 }], earlier)).toEqual([0]);
    expect(ProgressionHelpers.newBests([{ weightKg: 60, reps: 8 }], earlier)).toEqual([]);
    expect(ProgressionHelpers.newBests([{ weightKg: 60, reps: 8 }], [])).toEqual([]);
  });

  it('describes change in percent', () => {
    expect(ProgressionHelpers.describeChange(1060, 1000)).toBe('up 6% on last time');
    expect(ProgressionHelpers.describeChange(970, 1000)).toBe('down 3% on last time');
    expect(ProgressionHelpers.describeChange(1000, 1000)).toBe('same as last time');
  });
});
