'use client';

import { useId } from 'react';
import type React from 'react';

import { EFFORTS } from '../progress/progress.constants.ts';
import type { Effort } from '../progress/progress.types.ts';
import { cn } from '../strata/class-names.helpers.ts';

const OPTIONS: readonly { readonly value: Effort; readonly label: string; readonly hint: string }[] = [
  { value: EFFORTS.EASY, label: 'Easy', hint: '3+ reps left' },
  { value: EFFORTS.HARD, label: 'Hard', hint: '1–2 left' },
  { value: EFFORTS.ALL_OUT, label: 'All out', hint: 'nothing left' },
];

interface EffortChoiceProps {
  readonly value: Effort | undefined;
  readonly onChoose: (effort: Effort) => void;
}

/** One optional tap after the last set: how many reps you had left. It tunes next time's target. */
export function EffortChoice({ value, onChoose }: EffortChoiceProps): React.JSX.Element {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-label">
        How did the last set feel?
      </span>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby={labelId}>
        {OPTIONS.map((option) => {
          const isChosen = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isChosen}
              onClick={() => onChoose(option.value)}
              className={cn(
                'flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-m border px-2 py-1 transition-colors duration-100 ease-settle',
                isChosen ? 'border-action bg-action text-on-action' : 'border-edge bg-transparent text-ink hover:bg-inset',
              )}
            >
              <span className="text-label">{option.label}</span>
              <span className={cn('text-caption', isChosen ? 'text-on-action' : 'text-muted')}>{option.hint}</span>
            </button>
          );
        })}
      </div>
      <span className="text-caption text-faint">Optional. It decides how much to add next time.</span>
    </div>
  );
}
