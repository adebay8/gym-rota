'use client';

import { useEffect, useId, useRef } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';

import type { WithChildren } from './components.types.ts';

interface DialogProps extends WithChildren {
  /** The dialog's heading, asked as a question ("What did Cortex miss?"). It also names the dialog. */
  readonly title: string;
  readonly onClose: () => void;
}

/**
 * A modal on its own layer. Everything behind it is inert, so focus stays inside; Escape or the scrim
 * closes it, and focus returns to where it was.
 */
export function Dialog({ title, onClose, children }: DialogProps): React.JSX.Element {
  const scrim = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const behind = [...document.body.children].filter((element): element is HTMLElement => element instanceof HTMLElement && element !== scrim.current && !element.inert);
    for (const element of behind) element.inert = true;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close.current();
    };
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      for (const element of behind) element.inert = false;
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div
      ref={scrim}
      className="fixed inset-0 z-50 flex items-center justify-center bg-page/70 p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[calc(100vh-48px)] w-full max-w-[560px] flex-col gap-6 overflow-auto rounded-l border border-panel-border bg-panel p-8 animate-settle"
      >
        <h2 id={titleId} className="text-display-m">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
