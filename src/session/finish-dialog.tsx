'use client';

import type React from 'react';

import { ProgramHelpers } from '../program/program.helpers.ts';
import type { DayId } from '../program/program.types.ts';
import { Button } from '../strata/components/button.tsx';
import { Dialog } from '../strata/components/dialog.tsx';

interface FinishDialogProps {
  readonly dayId: DayId;
  readonly setsLeft: number;
  readonly onFinish: () => void;
  readonly onClose: () => void;
}

export function FinishDialog({ dayId, setsLeft, onFinish, onClose }: FinishDialogProps): React.JSX.Element {
  return (
    <Dialog title={`Finish with ${setsLeft} ${setsLeft === 1 ? 'set' : 'sets'} not ticked?`} onClose={onClose}>
      <p className="m-0 text-body text-muted">Day {dayId} is marked done and day {ProgramHelpers.dayAfter(dayId)} becomes next. Everything you logged is kept.</p>
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={onClose}>Keep going</Button>
        <Button variant="primary" onClick={onFinish}>
          Finish anyway
        </Button>
      </div>
    </Dialog>
  );
}
