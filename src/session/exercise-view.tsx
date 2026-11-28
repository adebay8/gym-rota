'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type React from 'react';

import { ProgramHelpers } from '../program/program.helpers.ts';
import type { DayId } from '../program/program.types.ts';
import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { SetEntryHelpers } from '../progress/set-entry.helpers.ts';
import { ProgressionHelpers } from '../progression/progression.helpers.ts';
import { Button } from '../strata/components/button.tsx';
import { Layer } from '../strata/components/layer.tsx';
import { StateMark } from '../strata/components/state-mark.tsx';
import { Swatch } from '../strata/components/swatch.tsx';
import { BottomBar } from './bottom-bar.tsx';
import { EffortChoice } from './effort-choice.tsx';
import { ExerciseHistory } from './exercise-history.tsx';
import { FinishDialog } from './finish-dialog.tsx';
import { PicturePair } from './picture-pair.tsx';
import { RestTimer } from './rest-timer.tsx';
import { SessionHelpers } from './session.helpers.ts';
import { useDaySession } from './session.hooks.ts';
import { SetRow } from './set-row.tsx';
import { useWakeLock } from './wake-lock.hooks.ts';

const PRIMARY_LINK = 'inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-action bg-action px-[18px] text-label text-on-action hover:opacity-90';
const SECONDARY_LINK = 'inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-edge px-[18px] text-label text-ink hover:bg-inset';

/** One exercise at a time: what to aim for, the sets to log, how it felt, and where you stand against last time. */
export function ExerciseView({ dayId, exerciseId }: { readonly dayId: DayId; readonly exerciseId: string }): React.JSX.Element {
  const session = useDaySession(dayId);
  const { day, progress, ticked } = session;
  const exercise = day.exercises.find((candidate) => candidate.id === exerciseId);
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const [howChoice, setHowChoice] = useState<boolean | null>(null);
  useWakeLock();
  if (!exercise) throw new Error(`No exercise ${exerciseId} on day ${dayId}`);

  const position = day.exercises.indexOf(exercise) + 1;
  const pastLogs = progress ? ProgressHelpers.pastLogs(progress, exercise.id) : [];
  const last = pastLogs[0];
  const target = ProgressionHelpers.target(exercise, last);
  const todaySets = progress ? ProgressHelpers.todaySets(progress, dayId, exercise.id) : [];
  const isDone = session.isExerciseDone(exercise);
  const next = session.nextUnfinished(exercise.id);
  const volumeToday = ProgressionHelpers.volumeKg(todaySets);
  const volumeLast = last ? ProgressionHelpers.volumeKg(last.sets) : 0;
  const repsToday = ProgressionHelpers.totalReps(todaySets);
  const bests = ProgressionHelpers.newBests(todaySets, pastLogs);
  const setsLeft = day.exercises.reduce((total, other) => total + SessionHelpers.setKeys(other).filter((key) => !ticked.has(key)).length, 0);
  const now = new Date();
  // Show how-to up front the first time; after that it's one tap away.
  const isHowOpen = howChoice ?? (progress !== null && pastLogs.length === 0);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col gap-6 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[calc(env(safe-area-inset-bottom)+200px)] sm:px-6">
      <nav>
        <Link href={`/day/${dayId}/`} className="-ml-2 inline-flex min-h-11 items-center gap-1 px-2 text-label text-muted hover:text-ink">
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
          <Swatch stratum={day.stratum} />
          <span className="ml-1">
            Day {day.id} · {day.name}
          </span>
        </Link>
      </nav>

      <header className="flex flex-col gap-1">
        <span className="text-caption text-faint">
          Exercise {position} of {day.exercises.length}
        </span>
        <h1 className="m-0 text-display-m">{exercise.name}</h1>
        <p className="m-0 text-body text-muted">
          {exercise.sets} sets · up to {exercise.repsMax} reps{exercise.perSide ? ' each side' : ''} · rest {ProgramHelpers.formatRest(exercise.restSeconds)}
        </p>
      </header>

      <section aria-label="Target" className="flex flex-col gap-1 border-l-2 border-edge pl-4">
        <p className="m-0 font-display text-title">{target.headline}</p>
        <p className="m-0 text-body text-muted">{target.reason}</p>
        {last && (
          <p className="m-0 text-caption text-faint">
            Last time, {ProgressHelpers.describeWhen(last.loggedAt, now)}: {SetEntryHelpers.formatSets(last.sets)}
          </p>
        )}
      </section>

      <section aria-labelledby="sets-heading" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="sets-heading" className="m-0 text-title">
            Sets
          </h2>
          <span className="text-caption text-faint">{exercise.load === 'dumbbell' ? 'kg per dumbbell' : exercise.load === 'bodyweight' ? 'kg added, if any' : 'kg on the machine'}</span>
        </div>
        <Layer className="flex flex-col gap-3 p-4">
          {Array.from({ length: exercise.sets }, (_, index) => {
            const key = ProgressHelpers.setKey(exercise.id, index);
            return (
              <SetRow
                key={`${progress?.session?.startedAt ?? 'none'}-${index}`}
                exerciseName={exercise.name}
                setNumber={index + 1}
                setCount={exercise.sets}
                isPerSide={exercise.perSide === true}
                isTicked={ticked.has(key)}
                isNewBest={bests.includes(index)}
                typed={progress ? ProgressHelpers.entry(progress, dayId, key) : undefined}
                suggestion={progress ? ProgressHelpers.suggestion(progress, { dayId, exerciseId: exercise.id, setIndex: index }, exercise) : undefined}
                onType={(entry) => session.typeSet(exercise, index, entry)}
                onToggle={() => session.toggleSet(exercise, index)}
              />
            );
          })}
        </Layer>
        <p className="m-0 text-caption text-faint">Faint numbers are the suggestion. Type what you actually did, or tick to log the suggestion as is.</p>
      </section>

      {isDone && (
        <section aria-label="How it went" className="flex flex-col gap-4 animate-settle">
          <div className="flex flex-col gap-1">
            <StateMark state="done" />
            {volumeToday > 0 ? (
              <p className="m-0 text-body">
                <span className="font-display text-title">{Math.round(volumeToday).toLocaleString('en-GB')} kg</span> volume
                {volumeLast > 0 && <span className="text-muted">, {ProgressionHelpers.describeChange(volumeToday, volumeLast)}</span>}
              </p>
            ) : (
              <p className="m-0 text-body">
                <span className="font-display text-title">{repsToday} reps</span>
                {last && <span className="text-muted">, {ProgressionHelpers.describeChange(repsToday, ProgressionHelpers.totalReps(last.sets))}</span>}
              </p>
            )}
            {bests.length > 0 && <p className="m-0 text-body text-muted">New best set: {SetEntryHelpers.formatSets([todaySets[bests[0] ?? 0] ?? null])}.</p>}
          </div>
          {progress && <EffortChoice value={ProgressHelpers.effort(progress, dayId, exercise.id)} onChoose={(effort) => session.chooseEffort(exercise, effort)} />}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <p className="m-0 text-body text-muted">
          <span className="text-label text-ink">Machine taken? </span>
          {exercise.swap} Or do it later: it stays on the list.
        </p>
      </section>

      <section aria-labelledby="how-heading" className="flex flex-col gap-3">
        <button type="button" aria-expanded={isHowOpen} onClick={() => setHowChoice(!isHowOpen)} className="flex min-h-11 cursor-pointer items-center justify-between bg-transparent p-0 text-left text-ink">
          <h2 id="how-heading" className="m-0 text-title">
            How to do it
          </h2>
          <span className="text-label text-muted">{isHowOpen ? 'Hide' : 'Show'}</span>
        </button>
        {isHowOpen && (
          <div className="flex flex-col gap-4 animate-settle">
            <PicturePair pictures={exercise.pictures} name={exercise.name} />
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body">
              <dt className="text-muted">Kit</dt>
              <dd className="m-0">{exercise.kit}</dd>
              <dt className="text-muted">Works</dt>
              <dd className="m-0">{exercise.works}</dd>
            </dl>
            <ol className="m-0 flex list-decimal flex-col gap-1 pl-5 text-body">
              {exercise.how.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {progress && <ExerciseHistory logs={pastLogs} now={now} />}

      <BottomBar>
        {progress?.session?.dayId === dayId && progress.session.rest && <RestTimer key={progress.session.rest.endsAt} rest={progress.session.rest} onExtend={session.extendRest} onDismiss={session.dismissRest} />}
        {next ? (
          <Link href={`/day/${dayId}/${next.id}/`} className={isDone ? PRIMARY_LINK : SECONDARY_LINK}>
            {isDone ? `Next: ${next.name}` : `Do later · go to ${next.name}`}
          </Link>
        ) : isDone ? (
          <Button variant="primary" className="w-full" onClick={() => (setsLeft > 0 ? setIsConfirmingFinish(true) : session.finish())}>
            Finish day {day.id}
          </Button>
        ) : (
          <Link href={`/day/${dayId}/`} className={SECONDARY_LINK}>
            Back to day {day.id}
          </Link>
        )}
      </BottomBar>

      {isConfirmingFinish && <FinishDialog dayId={dayId} setsLeft={setsLeft} onFinish={session.finish} onClose={() => setIsConfirmingFinish(false)} />}
    </main>
  );
}
