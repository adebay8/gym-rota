import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type React from 'react';

import { PROGRAM } from '../../../program/program.data.ts';
import { ProgramHelpers } from '../../../program/program.helpers.ts';
import { DayView } from '../../../session/day-view.tsx';

interface DayPageProps {
  readonly params: Promise<{ dayId: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { dayId: string }[] {
  return PROGRAM.map((day) => ({ dayId: String(day.id) }));
}

export async function generateMetadata({ params }: DayPageProps): Promise<Metadata> {
  const dayId = Number((await params).dayId);
  return ProgramHelpers.isDayId(dayId) ? { title: `Day ${dayId}: ${ProgramHelpers.findDay(dayId).name} · Rota` } : {};
}

export default async function DayPage({ params }: DayPageProps): Promise<React.JSX.Element> {
  const dayId = Number((await params).dayId);
  if (!ProgramHelpers.isDayId(dayId)) notFound();
  return <DayView dayId={dayId} />;
}
