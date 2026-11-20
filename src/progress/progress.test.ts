import { describe, expect, it } from 'vitest';

import { EMPTY_PROGRESS } from './progress.constants.ts';
import { ProgressHelpers } from './progress.helpers.ts';

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
