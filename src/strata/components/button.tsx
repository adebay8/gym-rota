import type { ButtonHTMLAttributes, Ref } from 'react';
import type React from 'react';

import { cn } from '../class-names.helpers.ts';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly ref?: Ref<HTMLButtonElement>;
  /** primary: the one main action in a view · secondary: outlined · quiet: underlined text, low stakes. */
  readonly variant?: 'primary' | 'secondary' | 'quiet';
  readonly size?: 'default' | 'small';
}

const BASE = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-pill text-label transition-colors duration-100 ease-settle disabled:cursor-not-allowed disabled:opacity-disabled';
const VARIANTS = {
  primary: 'border border-action bg-action text-on-action hover:opacity-90',
  secondary: 'border border-edge bg-transparent text-ink hover:bg-inset',
  // Quiet sits in running text, so it keeps the text's size; min-h-6 keeps the hit target at 24px or more.
  quiet: 'min-h-6 border-0 bg-transparent p-0 text-body text-muted underline underline-offset-3 hover:text-ink',
} as const;
// Strata hit targets: 40px, 44px on touch. Small is narrower and quieter, not shorter.
const SIZES = { default: 'min-h-10 px-[18px] pointer-coarse:min-h-11', small: 'min-h-10 px-3 text-caption pointer-coarse:min-h-11' } as const;

/** Strata Button: a pill with a verb-plus-object label in sentence case ("Review draft"). */
export function Button({ variant = 'secondary', size = 'default', className, type = 'button', ...rest }: ButtonProps): React.JSX.Element {
  return <button type={type} className={cn(BASE, VARIANTS[variant], variant !== 'quiet' && SIZES[size], className)} {...rest} />;
}
