'use client';

import { useEffect, useState } from 'react';
import type React from 'react';

import type { RestTimer as RestTimerState } from '../progress/progress.types.ts';
import { Button } from '../strata/components/button.tsx';
import { REST_EXTEND_SECONDS, REST_OVER_VIBRATION_MS, REST_TICK_MS } from './session.constants.ts';
import { SessionHelpers } from './session.helpers.ts';

interface RestTimerProps {
  readonly rest: RestTimerState;
  readonly onExtend: (seconds: number) => void;
  readonly onDismiss: () => void;
}

/** Counts down the rest after a ticked set. Sits at the bottom of the screen, in thumb reach, on every screen of the day. */
export function RestTimer({ rest, onExtend, onDismiss }: RestTimerProps): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = (rest.endsAt - now) / 1000;
  const isOver = secondsLeft <= 0;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), REST_TICK_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    // Only buzz for a rest that ended while you watched, not one that ended long ago before a reload.
    if (isOver && Date.now() - rest.endsAt < REST_TICK_MS * 4) navigator.vibrate?.([...REST_OVER_VIBRATION_MS]);
  }, [isOver, rest.endsAt]);

  return (
    <div role="timer" aria-live={isOver ? 'assertive' : 'off'} className="flex items-center gap-3 rounded-m border border-panel-border bg-inset px-4 py-3 animate-settle">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-numeral">{isOver ? 'Go' : SessionHelpers.formatClock(secondsLeft)}</span>
        <span className="truncate text-caption text-muted">{isOver ? `Rest over · next set of ${rest.exerciseName}` : `Rest · ${rest.exerciseName}`}</span>
      </div>
      {!isOver && (
        <Button size="small" onClick={() => onExtend(REST_EXTEND_SECONDS)}>
          +30 s
        </Button>
      )}
      <Button size="small" onClick={onDismiss}>
        {isOver ? 'Close' : 'Skip'}
      </Button>
    </div>
  );
}
