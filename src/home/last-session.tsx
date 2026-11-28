import type React from 'react';

import { ProgramHelpers } from '../program/program.helpers.ts';
import { ProgressHelpers } from '../progress/progress.helpers.ts';
import type { FinishedSession, Progress } from '../progress/progress.types.ts';

/** One line about the last session: when, and what you lifted, so the next one has something to beat. */
export function LastSession({ progress, session, now }: { readonly progress: Progress; readonly session: FinishedSession; readonly now: Date }): React.JSX.Element {
  const day = ProgramHelpers.findDay(session.dayId);
  const summary = session.sessionId ? ProgressHelpers.sessionSummary(progress, session.sessionId) : null;
  const parts = [`day ${session.dayId}, ${day.name.toLowerCase()}, ${ProgressHelpers.describeWhen(session.finishedAt, now)}`];
  if (summary && summary.sets > 0) {
    parts.push(`${summary.sets} sets${summary.volumeKg > 0 ? `, ${Math.round(summary.volumeKg).toLocaleString('en-GB')} kg lifted` : ''}`);
    if (summary.newBests > 0) parts.push(`${summary.newBests} new ${summary.newBests === 1 ? 'best' : 'bests'}`);
  }
  return <p className="m-0 text-caption text-faint">Last session: {parts.join(' · ')}.</p>;
}
