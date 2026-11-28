import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type React from 'react';

import { PROGRAM } from '../../../../program/program.data.ts';
import { ProgramHelpers } from '../../../../program/program.helpers.ts';
import { ExerciseView } from '../../../../session/exercise-view.tsx';

interface ExercisePageProps {
  readonly params: Promise<{ dayId: string; exerciseId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { dayId: string; exerciseId: string }[] {
  return PROGRAM.flatMap((day) => day.exercises.map((exercise) => ({ dayId: String(day.id), exerciseId: exercise.id })));
}

async function resolve(params: ExercisePageProps['params']) {
  const { dayId: rawDayId, exerciseId } = await params;
  const dayId = Number(rawDayId);
  if (!ProgramHelpers.isDayId(dayId)) return null;
  const exercise = ProgramHelpers.findDay(dayId).exercises.find((candidate) => candidate.id === exerciseId);
  return exercise ? { dayId, exercise } : null;
}

export async function generateMetadata({ params }: ExercisePageProps): Promise<Metadata> {
  const found = await resolve(params);
  return found ? { title: `${found.exercise.name} · Day ${found.dayId} · Rota` } : {};
}

export default async function ExercisePage({ params }: ExercisePageProps): Promise<React.JSX.Element> {
  const found = await resolve(params);
  if (!found) notFound();
  return <ExerciseView dayId={found.dayId} exerciseId={found.exercise.id} />;
}
