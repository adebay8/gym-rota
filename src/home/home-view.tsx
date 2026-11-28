'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';

import { PROGRAM } from '../program/program.data.ts';
import { ProgramHelpers } from '../program/program.helpers.ts';
import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { useProgress } from '../progress/progress.store.ts';
import { Layer, Rows } from '../strata/components/layer.tsx';
import { StateMark } from '../strata/components/state-mark.tsx';
import { Swatch } from '../strata/components/swatch.tsx';
import { cn } from '../strata/class-names.helpers.ts';
import { BackupControls } from './backup-controls.tsx';
import { LastSession } from './last-session.tsx';

const PRIMARY_LINK = 'inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-action bg-action px-[18px] text-label text-on-action hover:opacity-90 sm:w-auto';

const TRAINING_RULES = [
  { title: 'Heaviest first.', text: 'The big lifts open each day while you are fresh. Smaller, single-joint moves come last.' },
  { title: 'Every set hard.', text: 'Up to 10 reps, as many as you can with good form. Stopping at 6, 7 or 8 is fine if that is where it gets hard.' },
  { title: 'Go up when you hit 10.', text: 'When you get 10 clean reps on every set, use a heavier weight next time. The app works this out from your log.' },
  { title: 'Rest as shown.', text: 'About 2–3 min on big lifts and 1–1½ min on small ones, so the next set can be hard too.' },
  { title: 'Short on time?', text: 'Do 2 sets instead of 3 on the last few exercises. Never skip the warm-up.' },
] as const;

export function HomeView(): React.JSX.Element {
  const [progress] = useProgress();
  const now = new Date();
  const openSession = progress?.session && progress.session.ticked.length > 0 ? progress.session : null;
  const focusDayId = openSession?.dayId ?? progress?.nextDayId ?? 1;
  const focusDay = ProgramHelpers.findDay(focusDayId);
  const lastSession = progress?.history[0];

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col gap-10 px-4 pt-[max(24px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))] sm:px-6">
      <span className="font-display text-title">Rota</span>

      <section aria-labelledby="next-heading" className={cn('flex flex-col gap-4', progress === null && 'invisible')}>
        <span className="inline-flex items-center gap-2 text-label text-muted">
          <Swatch stratum={focusDay.stratum} />
          {openSession ? `Day ${focusDay.id} in progress` : `Next up · day ${focusDay.id} of 4`}
        </span>
        <h1 id="next-heading" className="m-0 text-display-l">
          {focusDay.name}
        </h1>
        <p className="m-0 text-body-l text-muted">{focusDay.focus}</p>
        <p className="m-0 text-caption text-faint">
          About {ProgramHelpers.estimateMinutes(focusDay)} min · {focusDay.exercises.length} exercises · warm-up included
        </p>
        <Link href={`/day/${focusDay.id}/`} className={PRIMARY_LINK}>
          {openSession ? `Resume day ${focusDay.id}` : `Start day ${focusDay.id}`}
        </Link>
        {lastSession && progress && <LastSession progress={progress} session={lastSession} now={now} />}
      </section>

      <section aria-labelledby="days-heading" className="flex flex-col gap-3">
        <h2 id="days-heading" className="m-0 text-title">
          The four days
        </h2>
        <p className="m-0 text-body text-muted">Train them in order, on whichever days suit you. Open any day to see it or do it out of order.</p>
        <Layer flush>
          <Rows label="Training days">
            {PROGRAM.map((day) => {
              const last = progress ? ProgressHelpers.lastFinished(progress, day.id) : undefined;
              const isNext = progress !== null && day.id === focusDayId;
              return (
                <li key={day.id}>
                  <Link href={`/day/${day.id}/`} className="flex min-h-16 items-center gap-3 py-3 text-ink">
                    <Swatch stratum={day.stratum} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-label">
                        Day {day.id} · {day.name}
                      </span>
                      <span className="truncate text-caption text-muted">{day.focus}</span>
                    </span>
                    <span className="shrink-0 text-right text-caption">
                      {isNext ? (
                        <StateMark state={openSession ? 'running' : 'needs'} label={openSession ? 'In progress' : 'Next'} />
                      ) : last ? (
                        <span className="text-faint">{ProgressHelpers.describeWhen(last.finishedAt, now)}</span>
                      ) : (
                        <span className="text-faint">{ProgramHelpers.estimateMinutes(day)} min</span>
                      )}
                    </span>
                    <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </Rows>
        </Layer>
      </section>

      <section aria-labelledby="rules-heading" className="flex flex-col gap-3">
        <h2 id="rules-heading" className="m-0 text-title">
          How to train
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0 text-body">
          {TRAINING_RULES.map((rule) => (
            <li key={rule.title}>
              <span className="text-label">{rule.title} </span>
              <span className="text-muted">{rule.text}</span>
            </li>
          ))}
        </ul>
        <p className="m-0 text-caption text-faint">The first time, pick a weight you can lift 6–10 times. After that, log your sets and the app suggests the next weight: same weight until every set reaches 10, then the smallest step up. Tell it how the last set felt and it adjusts.</p>
      </section>

      {progress && <BackupControls />}

      <footer className="border-t border-line pt-4 text-caption text-faint">
        Your log is saved on this phone, and in your database once sync is connected. Exercise pictures from{' '}
        <a href="https://github.com/yuhonas/free-exercise-db" className="underline underline-offset-3 hover:text-ink">
          free-exercise-db
        </a>{' '}
        (public domain).
      </footer>
    </main>
  );
}
