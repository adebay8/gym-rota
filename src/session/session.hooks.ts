'use client';

import { useRouter } from 'next/navigation';

import { ProgramHelpers } from '../program/program.helpers.ts';
import type { DayId, Exercise, TrainingDay } from '../program/program.types.ts';
import { ProgressHelpers } from '../progress/progress.helpers.ts';
import { useProgress } from '../progress/progress.store.ts';
import type { Effort, Progress, SetEntry } from '../progress/progress.types.ts';
import { SetEntryHelpers } from '../progress/set-entry.helpers.ts';
import { SessionHelpers } from './session.helpers.ts';

export interface DaySession {
  readonly day: TrainingDay;
  /** Null until the browser has read storage. */
  readonly progress: Progress | null;
  readonly ticked: ReadonlySet<string>;
  readonly toggleWarmup: (stepId: string) => void;
  readonly typeSet: (exercise: Exercise, setIndex: number, entry: SetEntry) => void;
  readonly toggleSet: (exercise: Exercise, setIndex: number) => void;
  readonly chooseEffort: (exercise: Exercise, effort: Effort) => void;
  readonly extendRest: (seconds: number) => void;
  readonly dismissRest: () => void;
  readonly finish: () => void;
  readonly isExerciseDone: (exercise: Exercise) => boolean;
  /** The first unfinished exercise after this one, wrapping round; undefined when everything else is done. */
  readonly nextUnfinished: (afterExerciseId?: string) => Exercise | undefined;
}

/** Everything a day's screens need: state plus the actions that change it. */
export function useDaySession(dayId: DayId): DaySession {
  const day = ProgramHelpers.findDay(dayId);
  const router = useRouter();
  const [progress, update] = useProgress();
  const ticked = progress ? ProgressHelpers.ticked(progress, dayId) : new Set<string>();

  const isExerciseDone = (exercise: Exercise): boolean => SessionHelpers.setKeys(exercise).every((key) => ticked.has(key));

  const nextUnfinished = (afterExerciseId?: string): Exercise | undefined => {
    const start = afterExerciseId ? day.exercises.findIndex((exercise) => exercise.id === afterExerciseId) + 1 : 0;
    const ordered = [...day.exercises.slice(start), ...day.exercises.slice(0, start)];
    return ordered.find((exercise) => exercise.id !== afterExerciseId && !isExerciseDone(exercise));
  };

  const toggleSet = (exercise: Exercise, setIndex: number): void => {
    update((current) => {
      const address = { dayId, exerciseId: exercise.id, setIndex };
      const key = ProgressHelpers.setKey(exercise.id, setIndex);
      const now = new Date();
      if (ProgressHelpers.ticked(current, dayId).has(key)) return ProgressHelpers.startRest(ProgressHelpers.unlogSet(current, address, now), null);
      const entry = SetEntryHelpers.merge(ProgressHelpers.entry(current, dayId, key), ProgressHelpers.suggestion(current, address, exercise));
      const logged = ProgressHelpers.logSet(current, address, entry, now);
      // Rest after every set except the last one of the exercise: then you're walking to the next kit anyway.
      const tickedAfter = ProgressHelpers.ticked(logged, dayId);
      const isLastSet = SessionHelpers.setKeys(exercise).every((other) => tickedAfter.has(other));
      return ProgressHelpers.startRest(logged, isLastSet ? null : { exerciseName: exercise.name, endsAt: now.getTime() + exercise.restSeconds * 1000 });
    });
  };

  return {
    day,
    progress,
    ticked,
    toggleWarmup: (stepId) => update((current) => ProgressHelpers.toggle(current, dayId, ProgressHelpers.warmupKey(stepId), new Date())),
    typeSet: (exercise, setIndex, entry) => update((current) => ProgressHelpers.draftSet(current, { dayId, exerciseId: exercise.id, setIndex }, entry, new Date())),
    toggleSet,
    chooseEffort: (exercise, effort) => update((current) => ProgressHelpers.setEffort(current, dayId, exercise.id, effort, new Date())),
    extendRest: (seconds) =>
      update((current) => {
        const rest = current.session?.rest;
        return rest ? ProgressHelpers.startRest(current, { ...rest, endsAt: rest.endsAt + seconds * 1000 }) : current;
      }),
    dismissRest: () => update((current) => ProgressHelpers.startRest(current, null)),
    finish: () => {
      update((current) => ProgressHelpers.finish(current, dayId, new Date()));
      router.push('/');
    },
    isExerciseDone,
    nextUnfinished,
  };
}
