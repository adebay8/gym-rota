import type React from 'react';

/** Fixed to the bottom, in thumb reach: the rest timer and the one main action. */
export function BottomBar({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto flex max-w-[640px] flex-col gap-3">{children}</div>
    </div>
  );
}
