'use client';

import { useEffect, useState } from 'react';
import type React from 'react';

import { Button } from '../strata/components/button.tsx';
import { REST_EXTEND_SECONDS, REST_OVER_VIBRATION_MS, REST_TICK_MS } from './session.constants.ts';
import { SessionHelpers } from './session.helpers.ts';

export interface RestState {
  readonly exerciseName: string;
  /** Epoch ms. */
  readonly endsAt: number;
}

interface RestTimerProps {
  readonly rest: RestState;
  readonly onExtend: (seconds: number) => void;
  readonly onDismiss: () => void;
}

/** Counts down the rest after a ticked set. Sits at the bottom of the screen, in thumb reach. */
export function RestTimer({ rest, onExtend, onDismiss }: RestTimerProps): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = (rest.endsAt - now) / 1000;
  const isOver = secondsLeft <= 0;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), REST_TICK_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOver) navigator.vibrate?.([...REST_OVER_VIBRATION_MS]);
  }, [isOver]);

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
