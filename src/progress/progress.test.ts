import { describe, expect, it } from 'vitest';

import { EMPTY_PROGRESS } from './progress.constants.ts';
import { ProgressHelpers } from './progress.helpers.ts';
import { SetEntryHelpers } from './set-entry.helpers.ts';

const NOW = new Date('2026-11-20T18:00:00');

describe('progress', () => {
  it('falls back to a fresh start on bad storage', () => {
    expect(ProgressHelpers.parse('not json')).toEqual(EMPTY_PROGRESS);
    expect(ProgressHelpers.parse('{"nextDayId":7}')).toEqual(EMPTY_PROGRESS);
    expect(ProgressHelpers.parse(null)).toEqual(EMPTY_PROGRESS);
  });

  it('round-trips through JSON', () => {
    const ticked = ProgressHelpers.toggle(EMPTY_PROGRESS, 2, 'set:pull-ups:0', NOW);
    expect(ProgressHelpers.parse(JSON.stringify(ticked))).toEqual(ticked);
  });

  it('toggles a tick on and off', () => {
    const on = ProgressHelpers.toggle(EMPTY_PROGRESS, 1, 'warmup:rower', NOW);
    expect(ProgressHelpers.ticked(on, 1).has('warmup:rower')).toBe(true);
    const off = ProgressHelpers.toggle(on, 1, 'warmup:rower', NOW);
    expect(ProgressHelpers.ticked(off, 1).size).toBe(0);
  });

  it('starts a fresh session when ticking a different day', () => {
    const day1 = ProgressHelpers.toggle(EMPTY_PROGRESS, 1, 'warmup:rower', NOW);
    const day3 = ProgressHelpers.toggle(day1, 3, 'warmup:bike', NOW);
    expect(ProgressHelpers.ticked(day3, 1).size).toBe(0);
    expect([...ProgressHelpers.ticked(day3, 3)]).toEqual(['warmup:bike']);
  });

  it('moves to the day after the one finished, even out of order', () => {
    const finished = ProgressHelpers.finish(EMPTY_PROGRESS, 3, NOW);
    expect(finished.nextDayId).toBe(4);
    expect(finished.session).toBeNull();
    expect(ProgressHelpers.lastFinished(finished, 3)?.finishedAt).toBe(NOW.toISOString());
  });

  it('describes when in plain words', () => {
    expect(ProgressHelpers.describeWhen('2026-11-20T07:00:00', NOW)).toBe('today');
    expect(ProgressHelpers.describeWhen('2026-11-19T21:00:00', NOW)).toBe('yesterday');
    expect(ProgressHelpers.describeWhen('2026-11-17T10:00:00', NOW)).toBe('3 days ago');
  });
});

describe('logging sets', () => {
  const BENCH = { dayId: 1 as const, exerciseId: 'smith-bench-press', setIndex: 0 };
  const LATER = new Date('2026-11-27T18:00:00');

  it('writes the log the moment a set is ticked, and keeps it after finishing', () => {
    const ticked = ProgressHelpers.logSet(EMPTY_PROGRESS, BENCH, { weightKg: 60, reps: 10 }, NOW);
    expect(ticked.log['smith-bench-press']?.[0]?.sets).toEqual([{ weightKg: 60, reps: 10 }]);
    const finished = ProgressHelpers.finish(ticked, 1, NOW);
    expect(finished.log['smith-bench-press']?.[0]?.sets).toEqual([{ weightKg: 60, reps: 10 }]);
    expect(ProgressHelpers.sessionSummary(finished, finished.history[0]?.sessionId ?? '')).toEqual({ volumeKg: 600, sets: 1, newBests: 0 });
  });

  it('follows edits to a ticked set and drops an unticked one', () => {
    const ticked = ProgressHelpers.logSet(EMPTY_PROGRESS, BENCH, { weightKg: 60, reps: 10 }, NOW);
    const edited = ProgressHelpers.draftSet(ticked, BENCH, { weightKg: 60, reps: 9 }, NOW);
    expect(edited.log['smith-bench-press']?.[0]?.sets[0]?.reps).toBe(9);
    const unticked = ProgressHelpers.unlogSet(edited, BENCH, NOW);
    expect(unticked.log['smith-bench-press']?.[0]?.sets).toEqual([]);
    expect(ProgressHelpers.lastLogged(ProgressHelpers.finish(unticked, 1, NOW), 'smith-bench-press')).toBeUndefined();
    expect(ProgressHelpers.entry(unticked, 1, 'set:smith-bench-press:0')).toEqual({ weightKg: 60, reps: 9 });
  });

  it('suggests last week’s target next week', () => {
    let progress = EMPTY_PROGRESS;
    for (const setIndex of [0, 1, 2]) progress = ProgressHelpers.logSet(progress, { ...BENCH, setIndex }, { weightKg: 60, reps: 10 }, NOW);
    progress = ProgressHelpers.finish(progress, 1, NOW);
    const bench = { id: 'smith-bench-press', load: 'smith', sets: 3, repsMax: 10 } as Parameters<typeof ProgressHelpers.suggestion>[2];
    // A new session a week later: every set hit 10, so the suggestion is 5 kg heavier with reps left open.
    progress = ProgressHelpers.toggle(progress, 1, 'warmup:rower', LATER);
    expect(ProgressHelpers.suggestion(progress, BENCH, bench)).toEqual({ weightKg: 65, reps: null });
  });

  it('records and clears how a set felt', () => {
    const ticked = ProgressHelpers.logSet(EMPTY_PROGRESS, BENCH, { weightKg: 60, reps: 10 }, NOW);
    const easy = ProgressHelpers.setEffort(ticked, 1, 'smith-bench-press', 'easy', NOW);
    expect(ProgressHelpers.effort(easy, 1, 'smith-bench-press')).toBe('easy');
    expect(ProgressHelpers.effort(ProgressHelpers.setEffort(easy, 1, 'smith-bench-press', 'easy', NOW), 1, 'smith-bench-press')).toBeUndefined();
  });

  it('reads storage from before logging existed', () => {
    const old = JSON.stringify({ nextDayId: 2, history: [{ dayId: 1, finishedAt: NOW.toISOString() }], session: { dayId: 2, startedAt: NOW.toISOString(), ticked: ['warmup:rower'] } });
    const parsed = ProgressHelpers.parse(old);
    expect(parsed.nextDayId).toBe(2);
    expect(parsed.log).toEqual({});
    expect(parsed.session?.entries).toEqual({});
  });
});

describe('set entry text', () => {
  it('parses commas and rounds to a quarter kilo', () => {
    expect(SetEntryHelpers.parseWeight('22,5')).toBe(22.5);
    expect(SetEntryHelpers.parseWeight('22.6')).toBe(22.5);
    expect(SetEntryHelpers.parseWeight('abc')).toBeNull();
    expect(SetEntryHelpers.parseReps('8.5')).toBeNull();
  });

  it('formats sets compactly', () => {
    expect(SetEntryHelpers.formatSets([{ weightKg: 22.5, reps: 10 }, { weightKg: 22.5, reps: 9 }])).toBe('22.5 kg × 10, 9');
    expect(SetEntryHelpers.formatSets([{ weightKg: 22.5, reps: 10 }, { weightKg: 25, reps: 8 }])).toBe('22.5 × 10, 25 × 8');
    expect(SetEntryHelpers.formatSets([{ weightKg: null, reps: 8 }, null, { weightKg: null, reps: 6 }])).toBe('bodyweight × 8, 6');
  });
});
