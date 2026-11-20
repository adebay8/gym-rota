import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { PROGRAM } from './program.data.ts';
import { ProgramHelpers } from './program.helpers.ts';

describe('program', () => {
  it('has four days in order', () => {
    expect(PROGRAM.map((day) => day.id)).toEqual([1, 2, 3, 4]);
  });

  it('keeps every day between 75 and 90 minutes', () => {
    for (const day of PROGRAM) {
      const minutes = ProgramHelpers.estimateMinutes(day);
      expect(minutes, `day ${day.id}`).toBeGreaterThanOrEqual(75);
      expect(minutes, `day ${day.id}`).toBeLessThanOrEqual(90);
    }
  });

  it('caps every exercise at 10 reps', () => {
    for (const exercise of PROGRAM.flatMap((day) => day.exercises)) expect(exercise.repsMax).toBeLessThanOrEqual(10);
  });

  it('has unique exercise ids within a day', () => {
    for (const day of PROGRAM) expect(new Set(day.exercises.map((exercise) => exercise.id)).size).toBe(day.exercises.length);
  });

  it('ships both pictures for every movement', () => {
    const folders = PROGRAM.flatMap((day) => [...day.warmup.map((step) => step.pictures.folder), ...day.exercises.map((exercise) => exercise.pictures.folder)]);
    for (const folder of folders) for (const url of ProgramHelpers.pictureUrls(folder)) expect(existsSync(`public${url}`), url).toBe(true);
  });

  it('cycles 4 back to 1', () => {
    expect(ProgramHelpers.dayAfter(4)).toBe(1);
    expect(ProgramHelpers.dayAfter(1)).toBe(2);
  });
});
