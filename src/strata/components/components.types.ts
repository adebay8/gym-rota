import type { ReactNode } from 'react';

import type { STATES } from './components.constants.ts';

export type StateKind = (typeof STATES)[keyof typeof STATES];
/** Strata assigns strata 1–5 by current activity; a sixth and beyond fold into 'other'. */
export type Stratum = 1 | 2 | 3 | 4 | 5 | 'other';

export interface ChoiceOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface MenuItem {
  readonly label: string;
  readonly onSelect: () => void;
  /** Destructive items go last, after a divider. */
  readonly danger?: boolean;
}

export interface ToastMessage {
  readonly text: string;
  readonly undo?: (() => void) | undefined;
}

export interface WithChildren {
  readonly children?: ReactNode;
}
