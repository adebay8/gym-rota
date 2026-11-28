import type React from 'react';

import { ProgramHelpers } from '../program/program.helpers.ts';
import type { LoggedExercise } from '../progress/progress.types.ts';
import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { SetEntryHelpers } from '../progress/set-entry.helpers.ts';
import { HISTORY_ROWS_SHOWN } from './session.constants.ts';

/** The last few sessions of one exercise, newest first, so progress over weeks is visible at the machine. */
export function ExerciseHistory({ logs, now }: { readonly logs: readonly LoggedExercise[]; readonly now: Date }): React.JSX.Element {
  return (
    <section className="flex flex-col gap-2" aria-label="History">
      <h3 className="m-0 font-sans text-label">History</h3>
      {logs.length === 0 ? (
        <p className="m-0 text-body text-muted">Nothing logged yet. Type the weight and reps for each set, then tick it.</p>
      ) : (
        <ul className="m-0 list-none divide-y divide-line p-0">
          {logs.slice(0, HISTORY_ROWS_SHOWN).map((logged) => (
            <li key={logged.sessionId} className="flex items-baseline justify-between gap-4 py-2">
              <span className="text-body">{SetEntryHelpers.formatSets(logged.sets)}</span>
              <span className="shrink-0 text-caption text-faint">
                {ProgressHelpers.describeWhen(logged.loggedAt, now)}
                {logged.dayId !== undefined && ` · day ${logged.dayId}`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {logs.length > HISTORY_ROWS_SHOWN && <p className="m-0 text-caption text-faint">Showing the last {HISTORY_ROWS_SHOWN} of {logs.length} sessions.</p>}
    </section>
  );
}
