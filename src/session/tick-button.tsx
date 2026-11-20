import { Check } from 'lucide-react';
import type React from 'react';

import { cn } from '../strata/class-names.helpers.ts';

interface TickButtonProps {
  readonly isTicked: boolean;
  /** Spoken name, e.g. "Set 2 of 3, Pull-ups". */
  readonly label: string;
  /** Shown inside when not ticked (a set number); empty for warm-up steps. */
  readonly text?: string;
  readonly onToggle: () => void;
}

/** A 44px round toggle: hollow with a number until done, then filled with a tick. Big enough to hit mid-workout. */
export function TickButton({ isTicked, label, text, onToggle }: TickButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={isTicked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill border text-label transition-colors duration-100 ease-settle',
        isTicked ? 'border-action bg-action text-on-action' : 'border-edge bg-transparent text-ink hover:bg-inset',
      )}
    >
      {isTicked ? <Check size={20} strokeWidth={2} aria-hidden="true" /> : text}
    </button>
  );
}
