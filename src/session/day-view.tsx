'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type React from 'react';

import { ProgramHelpers } from '../program/program.helpers.ts';
import type { DayId, Exercise } from '../program/program.types.ts';
import { WARMUP_MINUTES } from '../program/program.constants.ts';
import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { useProgress } from '../progress/progress.store.ts';
import { Button } from '../strata/components/button.tsx';
import { Dialog } from '../strata/components/dialog.tsx';
import { Layer, Rows } from '../strata/components/layer.tsx';
import { Swatch } from '../strata/components/swatch.tsx';
import { ExerciseRow } from './exercise-row.tsx';
import { RestTimer } from './rest-timer.tsx';
import type { RestState } from './rest-timer.tsx';
import { SessionHelpers } from './session.helpers.ts';
import { useWakeLock } from './wake-lock.hooks.ts';
import { WarmupRow } from './warmup-row.tsx';

const STRATUM_FILL = { 1: 'bg-ochre', 2: 'bg-slate', 3: 'bg-lichen', 4: 'bg-heather', 5: 'bg-glacier' } as const;

export function DayView({ dayId }: { readonly dayId: DayId }): React.JSX.Element {
  const day = ProgramHelpers.findDay(dayId);
  const router = useRouter();
  const [progress, update] = useProgress();
  const [rest, setRest] = useState<RestState | null>(null);
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  useWakeLock();

  const ticked = progress ? ProgressHelpers.ticked(progress, dayId) : new Set<string>();
  const allKeys = SessionHelpers.allKeys(day);
  const tickedCount = SessionHelpers.countTicked(allKeys, ticked);
  const setsLeft = day.exercises.reduce((total, exercise) => total + exercise.sets - SessionHelpers.countTicked(SessionHelpers.setKeys(exercise), ticked), 0);
  const isOutOfOrder = progress !== null && progress.nextDayId !== dayId && progress.session?.dayId !== dayId;
  const otherOpen = progress?.session && progress.session.dayId !== dayId && progress.session.ticked.length > 0 ? progress.session.dayId : null;

  const toggle = (key: string): void => update((current) => ProgressHelpers.toggle(current, dayId, key, new Date()));

  const toggleSet = (exercise: Exercise, setIndex: number): void => {
    const key = ProgressHelpers.setKey(exercise.id, setIndex);
    const isTicking = !ticked.has(key);
    toggle(key);
    // Ticking a set starts the rest; the last set of an exercise doesn't need one (you move to the next kit).
    const setsAfterThis = SessionHelpers.setKeys(exercise).filter((other) => other !== key && !ticked.has(other)).length;
    if (isTicking && setsAfterThis > 0) setRest({ exerciseName: exercise.name, endsAt: Date.now() + exercise.restSeconds * 1000 });
    else if (!isTicking || setsAfterThis === 0) setRest(null);
  };

  const finish = (): void => {
    update((current) => ProgressHelpers.finish(current, dayId, new Date()));
    router.push('/');
  };

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
        {otherOpen !== null && <p className="m-0 text-caption text-muted">Ticking anything here clears what you ticked on day {otherOpen}.</p>}
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
              <WarmupRow key={step.id} step={step} isTicked={ticked.has(ProgressHelpers.warmupKey(step.id))} onToggle={() => toggle(ProgressHelpers.warmupKey(step.id))} />
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
          <span className="text-caption text-faint">heaviest first</span>
        </div>
        <p className="m-0 text-body text-muted">Every set as hard as you can, up to 10 reps. Stop when your form breaks. Tap a number when the set is done; the rest timer starts.</p>
        <Layer flush>
          <Rows label="Exercises">
            {day.exercises.map((exercise, index) => (
              <ExerciseRow key={exercise.id} exercise={exercise} position={index + 1} ticked={ticked} onToggleSet={(setIndex) => toggleSet(exercise, setIndex)} />
            ))}
          </Rows>
        </Layer>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto flex max-w-[640px] flex-col gap-3">
          {rest && (
            <RestTimer
              key={rest.endsAt}
              rest={rest}
              onExtend={(seconds) => setRest((current) => (current ? { ...current, endsAt: current.endsAt + seconds * 1000 } : current))}
              onDismiss={() => setRest(null)}
            />
          )}
          <Button variant="primary" className="w-full" onClick={() => (setsLeft > 0 ? setIsConfirmingFinish(true) : finish())}>
            Finish day {day.id}
          </Button>
        </div>
      </div>

      {isConfirmingFinish && (
        <Dialog title={`Finish with ${setsLeft} ${setsLeft === 1 ? 'set' : 'sets'} not ticked?`} onClose={() => setIsConfirmingFinish(false)}>
          <p className="m-0 text-body text-muted">Day {day.id} is marked done and day {ProgramHelpers.dayAfter(dayId)} becomes next. Your ticks for today are cleared.</p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button onClick={() => setIsConfirmingFinish(false)}>Keep going</Button>
            <Button variant="primary" onClick={finish}>
              Finish anyway
            </Button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
