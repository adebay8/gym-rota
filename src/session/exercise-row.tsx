'use client';

import { useId, useState } from 'react';
import type React from 'react';

import { ProgramHelpers } from '../program/program.helpers.ts';
import type { Exercise } from '../program/program.types.ts';
import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { StateMark } from '../strata/components/state-mark.tsx';
import { DisclosureButton } from './disclosure-button.tsx';
import { PicturePair } from './picture-pair.tsx';
import { TickButton } from './tick-button.tsx';

interface ExerciseRowProps {
  readonly exercise: Exercise;
  readonly position: number;
  readonly ticked: ReadonlySet<string>;
  readonly onToggleSet: (setIndex: number) => void;
}

export function ExerciseRow({ exercise, position, ticked, onToggleSet }: ExerciseRowProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const detailId = useId();
  const setIndexes = Array.from({ length: exercise.sets }, (_, index) => index);
  const isDone = setIndexes.every((index) => ticked.has(ProgressHelpers.setKey(exercise.id, index)));
  const reps = `${exercise.sets} sets · up to ${exercise.repsMax} reps${exercise.perSide ? ' each side' : ''}`;

  return (
    <li className="py-4">
      <DisclosureButton isOpen={isOpen} controls={detailId} onToggle={() => setIsOpen((open) => !open)}>
        <span className="flex items-baseline gap-2">
          <span className="w-5 shrink-0 text-label text-faint">{position}</span>
          <span className="font-display text-title">{exercise.name}</span>
        </span>
        <span className="pl-7 text-caption text-muted">
          {reps} · rest {ProgramHelpers.formatRest(exercise.restSeconds)}
        </span>
      </DisclosureButton>

      <div className="mt-3 flex items-center gap-2 pl-7">
        {setIndexes.map((index) => (
          <TickButton
            key={index}
            isTicked={ticked.has(ProgressHelpers.setKey(exercise.id, index))}
            label={`Set ${index + 1} of ${exercise.sets}, ${exercise.name}`}
            text={String(index + 1)}
            onToggle={() => onToggleSet(index)}
          />
        ))}
        {isDone && (
          <span className="ml-2 text-caption">
            <StateMark state="done" />
          </span>
        )}
      </div>

      {isOpen && (
        <div id={detailId} className="mt-4 flex flex-col gap-4 pl-7 animate-settle">
          <PicturePair pictures={exercise.pictures} name={exercise.name} />
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body">
            <dt className="text-muted">Kit</dt>
            <dd className="m-0">{exercise.kit}</dd>
            <dt className="text-muted">Works</dt>
            <dd className="m-0">{exercise.works}</dd>
          </dl>
          <ol className="m-0 flex list-decimal flex-col gap-1 pl-5 text-body">
            {exercise.how.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <p className="m-0 text-body text-muted">
            <span className="text-label text-ink">If it’s taken: </span>
            {exercise.swap}
          </p>
        </div>
      )}
    </li>
  );
}
