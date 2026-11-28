'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type React from 'react';

import { WARMUP_MINUTES } from '../program/program.constants.ts';
import { ProgramHelpers } from '../program/program.helpers.ts';
import type { DayId } from '../program/program.types.ts';
import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { ProgressionHelpers } from '../progression/progression.helpers.ts';
import { Button } from '../strata/components/button.tsx';
import { Layer, Rows } from '../strata/components/layer.tsx';
import { StateMark } from '../strata/components/state-mark.tsx';
import { Swatch } from '../strata/components/swatch.tsx';
import { BottomBar } from './bottom-bar.tsx';
import { FinishDialog } from './finish-dialog.tsx';
import { RestTimer } from './rest-timer.tsx';
import { SessionHelpers } from './session.helpers.ts';
import { useDaySession } from './session.hooks.ts';
import { useWakeLock } from './wake-lock.hooks.ts';
import { WarmupRow } from './warmup-row.tsx';

const STRATUM_FILL = { 1: 'bg-ochre', 2: 'bg-slate', 3: 'bg-lichen', 4: 'bg-heather', 5: 'bg-glacier' } as const;
const PRIMARY_LINK = 'inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-action bg-action px-[18px] text-label text-on-action hover:opacity-90';

/** The day as a plan: warm-up checklist, then every exercise with its target. Tap any exercise, in any order. */
export function DayView({ dayId }: { readonly dayId: DayId }): React.JSX.Element {
  const session = useDaySession(dayId);
  const { day, progress, ticked } = session;
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  useWakeLock();

  const allKeys = SessionHelpers.allKeys(day);
  const tickedCount = SessionHelpers.countTicked(allKeys, ticked);
  const setsLeft = day.exercises.reduce((total, exercise) => total + SessionHelpers.setKeys(exercise).filter((key) => !ticked.has(key)).length, 0);
  const isOutOfOrder = progress !== null && progress.nextDayId !== dayId && progress.session?.dayId !== dayId;
  const otherOpen = progress?.session && progress.session.dayId !== dayId && progress.session.ticked.length > 0 ? progress.session.dayId : null;
  const next = session.nextUnfinished();
  const hasStartedLifting = day.exercises.some((exercise) => SessionHelpers.setKeys(exercise).some((key) => ticked.has(key)));
  const volumeToday = progress?.session?.dayId === dayId ? ProgressHelpers.sessionSummary(progress, progress.session.startedAt).volumeKg : 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col gap-8 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(env(safe-area-inset-bottom)+180px)] sm:px-6">
      <nav>
        <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1 px-2 text-label text-muted hover:text-ink">
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
          All days
        </Link>
      </nav>

      <header className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-2 text-label text-muted">
          <Swatch stratum={day.stratum} />
          Day {day.id} of 4
        </span>
        <h1 className="m-0 text-display-l">{day.name}</h1>
        <p className="m-0 text-body-l text-muted">{day.focus}</p>
        <p className="m-0 text-caption text-faint">
          About {ProgramHelpers.estimateMinutes(day)} min · {day.exercises.length} exercises · {ProgramHelpers.totalSets(day)} hard sets
          {volumeToday > 0 && ` · ${Math.round(volumeToday).toLocaleString('en-GB')} kg lifted so far`}
        </p>
        <div className="mt-2 flex items-center gap-3" aria-label={`${tickedCount} of ${allKeys.length} ticked`}>
          <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-inset">
            <div className={`h-full rounded-pill ${STRATUM_FILL[day.stratum]} transition-[width] duration-200 ease-settle`} style={{ width: `${(tickedCount / allKeys.length) * 100}%` }} />
          </div>
          <span className="text-caption text-muted">
            {tickedCount} of {allKeys.length}
          </span>
        </div>
        {isOutOfOrder && (
          <p className="m-0 text-caption text-muted">
            Day {progress.nextDayId} is next in your rotation. Finishing this day instead moves you on to day {ProgramHelpers.dayAfter(dayId)}.
          </p>
        )}
        {otherOpen !== null && <p className="m-0 text-caption text-muted">Ticking anything here closes day {otherOpen}. What you logged there is kept.</p>}
      </header>

      <section aria-labelledby="warmup-heading" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="warmup-heading" className="m-0 text-title">
            Warm-up
          </h2>
          <span className="text-caption text-faint">about {WARMUP_MINUTES} min</span>
        </div>
        <Layer flush>
          <Rows label="Warm-up steps">
            {day.warmup.map((step) => (
              <WarmupRow key={step.id} step={step} isTicked={ticked.has(ProgressHelpers.warmupKey(step.id))} onToggle={() => session.toggleWarmup(step.id)} />
            ))}
          </Rows>
        </Layer>
        <p className="m-0 text-body text-muted">
          <span className="text-label text-ink">Then ramp up. </span>
          {day.rampUp}
        </p>
      </section>

      <section aria-labelledby="workout-heading" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="workout-heading" className="m-0 text-title">
            Workout
          </h2>
          <span className="text-caption text-faint">heaviest first, any order</span>
        </div>
        <p className="m-0 text-body text-muted">Every set as hard as you can, up to 10 reps. Machine taken? Pick another and come back to it.</p>
        <Layer flush>
          <Rows label="Exercises">
            {day.exercises.map((exercise, index) => {
              const done = SessionHelpers.countTicked(SessionHelpers.setKeys(exercise), ticked);
              const target = ProgressionHelpers.target(exercise, progress ? ProgressHelpers.lastLogged(progress, exercise.id) : undefined);
              return (
                <li key={exercise.id}>
                  <Link href={`/day/${dayId}/${exercise.id}/`} className="flex min-h-16 items-center gap-3 py-3 text-ink">
                    <span className="w-5 shrink-0 text-label text-faint">{index + 1}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-label">{exercise.name}</span>
                      <span className="truncate text-caption text-muted">{progress ? target.headline : `${exercise.sets} sets · up to ${exercise.repsMax} reps`}</span>
                    </span>
                    <span className="shrink-0 text-caption">
                      {done === exercise.sets ? <StateMark state="done" /> : done > 0 ? <StateMark state="running" label={`${done} of ${exercise.sets}`} /> : <span className="text-faint">{exercise.sets} sets</span>}
                    </span>
                    <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </Rows>
        </Layer>
      </section>

      <BottomBar>
        {progress?.session?.dayId === dayId && progress.session.rest && <RestTimer key={progress.session.rest.endsAt} rest={progress.session.rest} onExtend={session.extendRest} onDismiss={session.dismissRest} />}
        {next ? (
          <Link href={`/day/${dayId}/${next.id}/`} className={PRIMARY_LINK}>
            {hasStartedLifting ? `Continue: ${next.name}` : `Start with ${next.name}`}
          </Link>
        ) : (
          <Button variant="primary" className="w-full" onClick={session.finish}>
            Finish day {day.id}
          </Button>
        )}
        {next && hasStartedLifting && (
          <Button variant="quiet" className="self-center" onClick={() => (setsLeft > 0 ? setIsConfirmingFinish(true) : session.finish())}>
            Finish day {day.id} now
          </Button>
        )}
      </BottomBar>

      {isConfirmingFinish && <FinishDialog dayId={dayId} setsLeft={setsLeft} onFinish={session.finish} onClose={() => setIsConfirmingFinish(false)} />}
    </main>
  );
}
