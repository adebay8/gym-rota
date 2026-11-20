import { ChevronDown } from 'lucide-react';
import type React from 'react';

import { cn } from '../strata/class-names.helpers.ts';

interface DisclosureButtonProps {
  readonly isOpen: boolean;
  readonly controls: string;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}

/** The row's title area: tap anywhere on it to show or hide how-to and pictures. */
export function DisclosureButton({ isOpen, controls, onToggle, children }: DisclosureButtonProps): React.JSX.Element {
  return (
    <button type="button" aria-expanded={isOpen} aria-controls={controls} onClick={onToggle} className="flex min-h-11 w-full min-w-0 flex-1 cursor-pointer items-center gap-2 bg-transparent p-0 text-left text-ink">
      <span className="flex min-w-0 flex-1 flex-col">{children}</span>
      <ChevronDown size={20} strokeWidth={1.5} aria-hidden="true" className={cn('shrink-0 text-muted transition-transform duration-150 ease-settle', isOpen && 'rotate-180')} />
    </button>
  );
}
