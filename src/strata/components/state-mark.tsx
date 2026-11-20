import type React from 'react';

import { cn } from '../class-names.helpers.ts';
import { STATE_WORDS } from './components.constants.ts';
import type { StateKind } from './components.types.ts';

const MARKS: Record<StateKind, string> = {
  needs: 'size-2.5 rounded-full bg-ink',
  running: 'size-2.5 rounded-full border-2 border-ink',
  done: 'h-[3px] w-3 rounded-[1px] bg-ink',
  stopped: 'size-2.5 bg-danger',
  settled: 'size-2.5 border border-dashed border-settled',
};

interface StateMarkProps {
  readonly state: StateKind;
  /** Overrides the default word ("Needs you"…). */
  readonly label?: string;
  /** Show the word next to the mark; when false, it becomes the mark's accessible label. */
  readonly showLabel?: boolean;
}

/** A shape plus a word for where a piece of work stands. Never tinted with a stratum colour. */
export function StateMark({ state, label, showLabel = true }: StateMarkProps): React.JSX.Element {
  const word = label ?? STATE_WORDS[state];
  const mark = cn('inline-block shrink-0', MARKS[state]);
  if (!showLabel) {
    return <span className={mark} role="img" aria-label={word} />;
  }
  return (
    <span className="inline-flex items-center gap-2 text-muted">
      <span className={mark} aria-hidden="true" />
      {word}
    </span>
  );
}
