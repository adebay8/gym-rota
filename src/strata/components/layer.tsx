import type React from 'react';

import { cn } from '../class-names.helpers.ts';
import type { WithChildren } from './components.types.ts';

interface LayerProps extends WithChildren {
  /** No vertical padding: for a layer that holds rows edge to edge. */
  readonly flush?: boolean;
  readonly className?: string;
}

/** A layer-1 surface: no border in Night, a line border in Day. Never nest cards inside cards. */
export function Layer({ children, flush = false, className }: LayerProps): React.JSX.Element {
  return <div className={cn('rounded-m border border-panel-border bg-panel', flush ? 'px-6' : 'p-6', className)}>{children}</div>;
}

/** Rows inside one surface, separated by hairlines. */
export function Rows({ children, label }: WithChildren & { readonly label?: string }): React.JSX.Element {
  return (
    <ul className="m-0 list-none divide-y divide-line p-0" aria-label={label}>
      {children}
    </ul>
  );
}
