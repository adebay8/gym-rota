'use client';

import { useRef, useState } from 'react';
import type React from 'react';

import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { readProgressJson, replaceProgress } from '../progress/progress.store.ts';
import { Button } from '../strata/components/button.tsx';
import { SyncSettings } from '../sync/sync-settings.tsx';

/** Sync to MongoDB, plus a backup file as a fallback (new phone, cleared Safari, no database). */
export function BackupControls(): React.JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const download = (): void => {
    const blob = new Blob([readProgressJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rota-log-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Backup saved to your downloads.');
  };

  const restore = async (file: File): Promise<void> => {
    let value: unknown;
    try {
      value = JSON.parse(await file.text());
    } catch {
      setMessage('That file isn’t a Rota backup. Nothing was changed.');
      return;
    }
    const progress = ProgressHelpers.fromUnknown(value);
    if (!progress) {
      setMessage('That file isn’t a Rota backup. Nothing was changed.');
      return;
    }
    if (!window.confirm('Replace everything on this phone with the backup?')) return;
    replaceProgress(progress);
    setMessage('Backup restored.');
  };

  return (
    <section aria-labelledby="backup-heading" className="flex flex-col gap-3">
      <h2 id="backup-heading" className="m-0 text-title">
        Your log
      </h2>
      <p className="m-0 text-body text-muted">It’s saved on this phone first, so logging works with no signal. Sync it to your database, or keep a backup file.</p>
      <SyncSettings />
      <div className="flex flex-wrap gap-3">
        <Button onClick={download}>Save backup</Button>
        <Button onClick={() => fileInput.current?.click()}>Restore backup</Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void restore(file);
            event.target.value = '';
          }}
        />
      </div>
      {message && (
        <p className="m-0 text-caption text-muted" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
