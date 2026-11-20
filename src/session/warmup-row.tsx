'use client';

import { useId, useState } from 'react';
import type React from 'react';

import type { WarmupStep } from '../program/program.types.ts';
import { DisclosureButton } from './disclosure-button.tsx';
import { PicturePair } from './picture-pair.tsx';
import { TickButton } from './tick-button.tsx';

interface WarmupRowProps {
  readonly step: WarmupStep;
  readonly isTicked: boolean;
  readonly onToggle: () => void;
}

export function WarmupRow({ step, isTicked, onToggle }: WarmupRowProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const detailId = useId();
  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <TickButton isTicked={isTicked} label={`${step.name}, done`} onToggle={onToggle} />
        <DisclosureButton isOpen={isOpen} controls={detailId} onToggle={() => setIsOpen((open) => !open)}>
          <span className={isTicked ? 'text-label text-muted' : 'text-label'}>{step.name}</span>
          <span className="text-caption text-muted">{step.dose}</span>
        </DisclosureButton>
      </div>
      {isOpen && (
        <div id={detailId} className="mt-3 flex flex-col gap-3 pb-1 animate-settle sm:pl-14">
          <PicturePair pictures={step.pictures} name={step.name} />
          <ol className="m-0 flex list-decimal flex-col gap-1 pl-5 text-body text-muted">
            {step.how.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
      )}
    </li>
  );
}
