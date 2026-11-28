'use client';

import { useEffect, useId, useState } from 'react';
import type React from 'react';

import type { SetEntry } from '../progress/progress.types.ts';
import { SetEntryHelpers } from '../progress/set-entry.helpers.ts';
import { TickButton } from './tick-button.tsx';

interface SetRowProps {
  readonly exerciseName: string;
  readonly setNumber: number;
  readonly setCount: number;
  readonly isPerSide: boolean;
  readonly isTicked: boolean;
  readonly isNewBest: boolean;
  readonly typed: SetEntry | undefined;
  /** Shown faintly in the fields and recorded on tick when a field is left empty. */
  readonly suggestion: SetEntry | undefined;
  readonly onType: (entry: SetEntry) => void;
  readonly onToggle: () => void;
}

const FIELD = 'h-11 w-full min-w-0 rounded-s border border-edge bg-transparent pl-3 text-right text-label text-ink placeholder:font-normal placeholder:text-faint placeholder:opacity-100 focus:border-ink focus:outline-none';
const UNIT = 'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-caption text-muted';

/** One set: weight, reps, tick. The keyboard is the phone's number pad; the text stays local until it parses. */
export function SetRow({ exerciseName, setNumber, setCount, isPerSide, isTicked, isNewBest, typed, suggestion, onType, onToggle }: SetRowProps): React.JSX.Element {
  const [weightText, setWeightText] = useState(() => SetEntryHelpers.formatWeight(typed?.weightKg ?? null));
  const [repsText, setRepsText] = useState(() => (typed?.reps === null || typed?.reps === undefined ? '' : String(typed.reps)));
  const labelId = useId();

  // A tick fills empty fields from the suggestion; show those values once they're stored.
  useEffect(() => {
    if (typed?.weightKg !== undefined && typed.weightKg !== null && SetEntryHelpers.parseWeight(weightText) !== typed.weightKg) setWeightText(SetEntryHelpers.formatWeight(typed.weightKg));
    if (typed?.reps !== undefined && typed.reps !== null && SetEntryHelpers.parseReps(repsText) !== typed.reps) setRepsText(String(typed.reps));
    // Only react to stored changes, not to typing.
  }, [typed?.weightKg, typed?.reps]);

  const changeWeight = (text: string): void => {
    setWeightText(text);
    onType({ weightKg: SetEntryHelpers.parseWeight(text), reps: SetEntryHelpers.parseReps(repsText) });
  };
  const changeReps = (text: string): void => {
    setRepsText(text);
    onType({ weightKg: SetEntryHelpers.parseWeight(weightText), reps: SetEntryHelpers.parseReps(text) });
  };

  return (
    <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2" role="group" aria-labelledby={labelId}>
      <span id={labelId} className="w-5 shrink-0 text-label text-faint">
        <span className="sr-only">
          {exerciseName}, set {setNumber} of {setCount}
        </span>
        <span aria-hidden="true">{setNumber}</span>
      </span>
      <label className="relative min-w-0 flex-[1.2]">
        <span className="sr-only">Weight in kilograms{isPerSide ? ', per dumbbell' : ''}</span>
        <input
          className={`${FIELD} pr-9`}
          type="text"
          inputMode="decimal"
          enterKeyHint="next"
          autoComplete="off"
          value={weightText}
          placeholder={SetEntryHelpers.formatWeight(suggestion?.weightKg ?? null)}
          onChange={(event) => changeWeight(event.target.value)}
        />
        <span className={UNIT} aria-hidden="true">
          kg
        </span>
      </label>
      <span className="text-caption text-faint" aria-hidden="true">
        ×
      </span>
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Reps{isPerSide ? ' each side' : ''}</span>
        <input
          className={`${FIELD} pr-12`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          enterKeyHint="done"
          autoComplete="off"
          value={repsText}
          placeholder={suggestion?.reps === null || suggestion?.reps === undefined ? '' : String(suggestion.reps)}
          onChange={(event) => changeReps(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !isTicked) {
              event.currentTarget.blur();
              onToggle();
            }
          }}
        />
        <span className={UNIT} aria-hidden="true">
          reps
        </span>
      </label>
      <TickButton isTicked={isTicked} label={`Set ${setNumber} done`} onToggle={onToggle} />
    </div>
      {isNewBest && <span className="pl-7 text-caption text-ink">New best set</span>}
    </div>
  );
}
