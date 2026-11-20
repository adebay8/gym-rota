import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Join class names; later Tailwind utilities win over earlier ones (a consumer's override beats the default). */
export function cn(...values: readonly ClassValue[]): string {
  return twMerge(clsx(values));
}
