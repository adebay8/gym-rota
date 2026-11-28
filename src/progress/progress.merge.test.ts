import { describe, expect, it } from 'vitest';

import { EMPTY_PROGRESS } from './progress.constants.ts';
import { ProgressHelpers } from './progress.helpers.ts';
import { ProgressMerge } from './progress.merge.ts';

const MONDAY = new Date('2026-11-23T18:00:00Z');
const TUESDAY = new Date('2026-11-24T18:00:00Z');
const bench = (setIndex: number) => ({ dayId: 1 as const, exerciseId: 'smith-bench-press', setIndex });

describe('merging two copies of the log', () => {
  it('keeps sets from both devices', () => {
    const phone = { ...ProgressHelpers.logSet(EMPTY_PROGRESS, bench(0), { weightKg: 60, reps: 10 }, MONDAY), updatedAt: MONDAY.toISOString() };
    const laptop = { ...ProgressHelpers.logSet(EMPTY_PROGRESS, { dayId: 2, exerciseId: 'pull-ups', setIndex: 0 }, { weightKg: null, reps: 8 }, TUESDAY), updatedAt: TUESDAY.toISOString() };
    const merged = ProgressMerge.merge(phone, laptop);
    expect(Object.keys(merged.log).sort()).toEqual(['pull-ups', 'smith-bench-press']);
    expect(merged.updatedAt).toBe(TUESDAY.toISOString());
  });

  it('takes the later edit of the same session', () => {
    const first = ProgressHelpers.logSet(EMPTY_PROGRESS, bench(0), { weightKg: 60, reps: 10 }, MONDAY);
    const edited = ProgressHelpers.draftSet(first, bench(0), { weightKg: 60, reps: 8 }, TUESDAY);
    expect(ProgressMerge.merge(edited, first).log['smith-bench-press']?.[0]?.sets[0]?.reps).toBe(8);
    expect(ProgressMerge.merge(first, edited).log['smith-bench-press']?.[0]?.sets[0]?.reps).toBe(8);
  });

  it('carries an untick instead of bringing the set back', () => {
    const ticked = ProgressHelpers.logSet(EMPTY_PROGRESS, bench(0), { weightKg: 60, reps: 10 }, MONDAY);
    const unticked = ProgressHelpers.unlogSet(ticked, bench(0), TUESDAY);
    expect(ProgressMerge.merge(ticked, unticked).log['smith-bench-press']?.[0]?.sets).toEqual([]);
  });

  it('takes the rotation from the copy changed last, and unions finished days', () => {
    const older = { ...ProgressHelpers.finish(EMPTY_PROGRESS, 1, MONDAY), updatedAt: MONDAY.toISOString() };
    const newer = { ...ProgressHelpers.finish(older, 2, TUESDAY), updatedAt: TUESDAY.toISOString() };
    const merged = ProgressMerge.merge(newer, older);
    expect(merged.nextDayId).toBe(3);
    expect(merged.history.map((finished) => finished.dayId)).toEqual([2, 1]);
  });

  it('is unchanged by merging with itself', () => {
    const progress = { ...ProgressHelpers.logSet(EMPTY_PROGRESS, bench(0), { weightKg: 60, reps: 10 }, MONDAY), updatedAt: MONDAY.toISOString() };
    expect(ProgressMerge.isSame(ProgressMerge.merge(progress, progress), progress)).toBe(true);
  });

  it('keeps the rotation when a fresh browser (starting at day 1) is newer', () => {
    // The main phone finished days 1-3, so day 4 is next.
    let phone = EMPTY_PROGRESS;
    for (const [dayId, date] of [[1, '2026-11-20'], [2, '2026-11-22'], [3, '2026-11-24']] as const) phone = ProgressHelpers.finish(phone, dayId, new Date(`${date}T18:00:00Z`));
    phone = { ...phone, updatedAt: '2026-11-24T18:00:00Z' };
    expect(phone.nextDayId).toBe(4);
    // A new browser: day 1, nothing finished, but one tap made it the newest copy.
    const fresh = { ...ProgressHelpers.toggle(EMPTY_PROGRESS, 1, 'warmup:rower', TUESDAY), updatedAt: '2026-11-28T10:00:00Z' };
    expect(ProgressMerge.merge(phone, fresh).nextDayId).toBe(4);
    expect(ProgressMerge.merge(fresh, phone).nextDayId).toBe(4);
  });

  it('drops an open session that another device already finished', () => {
    const started = { ...ProgressHelpers.logSet(EMPTY_PROGRESS, bench(0), { weightKg: 60, reps: 10 }, MONDAY), updatedAt: '2026-11-23T18:00:00Z' };
    const finishedElsewhere = { ...ProgressHelpers.finish(started, 1, MONDAY), updatedAt: '2026-11-23T19:00:00Z' };
    // The other copy still has the session open and was touched later (say, a stray tick).
    const stale = { ...started, updatedAt: '2026-11-23T20:00:00Z' };
    const merged = ProgressMerge.merge(finishedElsewhere, stale);
    expect(merged.session).toBeNull();
    expect(merged.nextDayId).toBe(2);
  });

  it('keeps how a set felt through a merge', () => {
    const ticked = ProgressHelpers.logSet(EMPTY_PROGRESS, bench(0), { weightKg: 60, reps: 10 }, MONDAY);
    const rated = ProgressHelpers.setEffort(ticked, 1, 'smith-bench-press', 'hard', TUESDAY);
    expect(ProgressMerge.merge(ticked, rated).log['smith-bench-press']?.[0]?.effort).toBe('hard');
  });
});
