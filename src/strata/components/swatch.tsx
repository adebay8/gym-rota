import type React from 'react';

import { cn } from '../class-names.helpers.ts';
import type { Stratum } from './components.types.ts';

const FILLS: Record<Stratum, string> = {
  1: 'bg-ochre',
  2: 'bg-slate',
  3: 'bg-lichen',
  4: 'bg-heather',
  5: 'bg-glacier',
  other: 'bg-faint',
};

/** A 10px square naming a stream of work. Colour identifies the work, never its status. */
export function Swatch({ stratum }: { readonly stratum: Stratum }): React.JSX.Element {
  return <span className={cn('inline-block size-2.5 shrink-0', FILLS[stratum])} aria-hidden="true" />;
}
