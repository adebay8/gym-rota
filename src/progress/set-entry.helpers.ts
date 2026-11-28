import { MAX_REPS, MAX_WEIGHT_KG, WEIGHT_STEP_KG } from './progress.constants.ts';
import type { SetEntry } from './progress.types.ts';

const NUMBER_FORMAT = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

/** Reading what's typed into a set's fields, and writing sets back out as short text. */
export class SetEntryHelpers {
  /** "22,5" and "22.5" both mean 22.5 kg. Empty or nonsense is null. */
  static parseWeight(text: string): number | null {
    const value = Number(text.trim().replace(',', '.'));
    if (text.trim() === '' || !Number.isFinite(value) || value < 0 || value > MAX_WEIGHT_KG) return null;
    return Math.round(value / WEIGHT_STEP_KG) * WEIGHT_STEP_KG;
  }

  static parseReps(text: string): number | null {
    const value = Number(text.trim());
    if (text.trim() === '' || !Number.isInteger(value) || value < 0 || value > MAX_REPS) return null;
    return value;
  }

  static isEmpty(entry: SetEntry): boolean {
    return entry.weightKg === null && entry.reps === null;
  }

  /** What a tick records: what you typed, with any empty field taken from the suggestion. */
  static merge(typed: SetEntry | undefined, suggestion: SetEntry | undefined): SetEntry {
    return { weightKg: typed?.weightKg ?? suggestion?.weightKg ?? null, reps: typed?.reps ?? suggestion?.reps ?? null };
  }

  static formatWeight(weightKg: number | null): string {
    return weightKg === null ? '' : NUMBER_FORMAT.format(weightKg);
  }

  /** "22.5 kg × 10, 10, 9" when the weight held; "22.5 × 10, 25 × 8" when it changed; "bodyweight × 8, 7" without weight. */
  static formatSets(sets: readonly (SetEntry | null)[]): string {
    const done = sets.filter((set): set is SetEntry => set !== null);
    if (done.length === 0) return '';
    const reps = (set: SetEntry): string => (set.reps === null ? '?' : String(set.reps));
    const weights = new Set(done.map((set) => set.weightKg));
    if (weights.size === 1) {
      const weight = done[0]?.weightKg ?? null;
      return `${weight === null || weight === 0 ? 'bodyweight' : `${NUMBER_FORMAT.format(weight)} kg`} × ${done.map(reps).join(', ')}`;
    }
    return done.map((set) => `${set.weightKg === null ? 'bw' : NUMBER_FORMAT.format(set.weightKg)} × ${reps(set)}`).join(', ');
  }
}
