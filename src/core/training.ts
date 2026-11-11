// Pure training math: e1RM, double progression, rest auto-regulation, hard sets and volume landmarks.
// References: Schoenfeld 2017 (volume dose-response), Pelland et al. (fractional set counting),
// Refalo 2023 / Robinson 2024 (proximity to failure), Schoenfeld 2016 & Grgic 2018 (rest intervals),
// Israetel/Hoffmann/Smith (MEV/MAV/MRV framework).
import type { Exercise, MuscleId, Prescription, Rir, Session, SetLog } from './types';

// ─────────────── e1RM ───────────────

/** Epley estimate using reps-to-failure (reps + RIR) so near-failure sets compare fairly. */
export function e1rm(kg: number, reps: number, rir: Rir | null = 0): number {
  if (kg <= 0 || reps <= 0) return 0;
  const rtf = reps + Math.min(rir ?? 0, 4);
  return rtf <= 1 ? kg : kg * (1 + rtf / 30);
}

export function bestE1rm(sets: SetLog[]): number {
  return sets.reduce((best, s) => (s.done && s.kg && s.reps ? Math.max(best, e1rm(s.kg, s.reps, s.rir)) : best), 0);
}

// ─────────────── Double progression ───────────────

export const workingSets = (sets: SetLog[]): SetLog[] => sets.filter((s) => s.done && s.kg != null && s.reps != null);

/** A set "meets the target" when it hits the top of the rep range with RIR ≤ 2. */
export function targetMet(set: SetLog, repMax: number): boolean {
  return set.done && set.reps != null && set.reps >= repMax && set.rir != null && set.rir <= 2;
}

export function loadIncrement(kg: number, eq: string): number {
  if (eq === 'barbell' || eq === 'machine') return kg >= 60 ? 2.5 : 2;
  if (eq === 'dumbbell' || eq === 'kettlebells') return 2;
  if (eq === 'cable') return kg >= 30 ? 2.5 : 1.25;
  return kg >= 40 ? 2.5 : 1;
}

export type Recommendation =
  | { kind: 'increase'; kg: number; reps: number }
  | { kind: 'reps'; kg: number; reps: number }
  | { kind: 'hold'; kg: number; reps: number }
  | { kind: 'none' };

/**
 * Next-session recommendation from last session's working sets.
 * - All working sets at top of range with RIR ≤ 2 → add load, restart at the bottom of the range.
 * - Otherwise keep the load and add one rep to the weakest set.
 * - A set below the range taken to failure → hold (recover / consolidate).
 */
export function recommend(prev: SetLog[], rx: Pick<Prescription, 'repMin' | 'repMax'>, eq: string): Recommendation {
  const ws = workingSets(prev);
  if (!ws.length) return { kind: 'none' };
  const kg = Math.max(...ws.map((s) => s.kg ?? 0));
  const top = ws.filter((s) => s.kg === kg);
  if (top.length && top.every((s) => targetMet(s, rx.repMax))) {
    return { kind: 'increase', kg: round(kg + loadIncrement(kg, eq), 0.25), reps: rx.repMin };
  }
  const minReps = Math.min(...top.map((s) => s.reps ?? 0));
  if (minReps < rx.repMin && top.some((s) => (s.rir ?? 4) === 0)) return { kind: 'hold', kg, reps: rx.repMin };
  return { kind: 'reps', kg, reps: Math.min(rx.repMax, minReps + 1) };
}

export const round = (v: number, step: number): number => Math.round(v / step) * step;

// ─────────────── Rest auto-regulation ───────────────

/** Heavy multi-joint lifts 150–180 s; other compounds 120 s; isolation/machines 60–90 s. */
export function restFor(ex: Pick<Exercise, 'mech' | 'cns' | 'eq'>): number {
  if (ex.mech === 'c') return ex.cns === 3 ? 180 : ex.cns === 2 ? 150 : 120;
  return ex.eq === 'machine' || ex.eq === 'cable' ? 75 : 90;
}

// ─────────────── Hard sets and volume landmarks ───────────────

/** Only sets at 0–3 RIR count as stimulating ("hard") sets; 4+ RIR is warm-up / junk volume. */
export const isHardSet = (s: SetLog): boolean => s.done && s.rir != null && s.rir <= 3;

export type VolumeGroup =
  | 'chest' | 'back' | 'shoulders' | 'traps' | 'biceps' | 'triceps' | 'forearms'
  | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'abdominals';

export const VOLUME_GROUPS: VolumeGroup[] = [
  'chest', 'back', 'shoulders', 'traps', 'biceps', 'triceps', 'forearms',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals',
];

export const GROUP_OF: Record<MuscleId, VolumeGroup | null> = {
  chest: 'chest', lats: 'back', 'middle back': 'back', 'lower back': null, traps: 'traps',
  shoulders: 'shoulders', biceps: 'biceps', triceps: 'triceps', forearms: 'forearms',
  quadriceps: 'quadriceps', hamstrings: 'hamstrings', glutes: 'glutes', calves: 'calves',
  abdominals: 'abdominals', adductors: null, abductors: null, neck: null,
};

export interface Landmarks { mev: number; mavLow: number; mavHigh: number; mrv: number }

/** Weekly hard-set landmarks per muscle (typical starting values; individual responses vary). */
export const LANDMARKS: Record<VolumeGroup, Landmarks> = {
  chest:      { mev: 8, mavLow: 12, mavHigh: 20, mrv: 22 },
  back:       { mev: 10, mavLow: 14, mavHigh: 22, mrv: 25 },
  shoulders:  { mev: 8, mavLow: 16, mavHigh: 22, mrv: 26 },
  traps:      { mev: 4, mavLow: 12, mavHigh: 20, mrv: 26 },
  biceps:     { mev: 8, mavLow: 14, mavHigh: 20, mrv: 26 },
  triceps:    { mev: 6, mavLow: 10, mavHigh: 14, mrv: 18 },
  forearms:   { mev: 2, mavLow: 8, mavHigh: 16, mrv: 22 },
  quadriceps: { mev: 8, mavLow: 12, mavHigh: 18, mrv: 20 },
  hamstrings: { mev: 6, mavLow: 10, mavHigh: 16, mrv: 20 },
  glutes:     { mev: 4, mavLow: 8, mavHigh: 12, mrv: 16 },
  calves:     { mev: 8, mavLow: 12, mavHigh: 16, mrv: 20 },
  abdominals: { mev: 4, mavLow: 16, mavHigh: 20, mrv: 25 },
};

export type Zone = 'below' | 'mev' | 'mav' | 'high' | 'over';

export function zoneOf(sets: number, lm: Landmarks): Zone {
  if (sets < lm.mev) return 'below';
  if (sets < lm.mavLow) return 'mev';
  if (sets <= lm.mavHigh) return 'mav';
  if (sets <= lm.mrv) return 'high';
  return 'over';
}

/**
 * Fractional hard sets per muscle group: primary mover = 1, secondary = 0.5
 * (counting that best predicted hypertrophy in the Pelland et al. meta-regressions).
 */
export function hardSetsByGroup(
  sessions: Session[],
  exById: Record<string, Exercise | undefined>,
  from: number,
  to: number,
): Record<VolumeGroup, number> {
  const out = Object.fromEntries(VOLUME_GROUPS.map((g) => [g, 0])) as Record<VolumeGroup, number>;
  for (const s of sessions) {
    const t = s.endedAt ?? s.startedAt;
    if (t < from || t >= to) continue;
    for (const it of s.items) {
      const ex = exById[it.exId];
      if (!ex) continue;
      const hard = it.sets.filter(isHardSet).length;
      if (!hard) continue;
      const credit = new Map<VolumeGroup, number>();
      for (const m of ex.pm) { const g = GROUP_OF[m]; if (g) credit.set(g, 1); }
      for (const m of ex.sm) { const g = GROUP_OF[m]; if (g && !credit.has(g)) credit.set(g, 0.5); }
      credit.forEach((w, g) => { out[g] += hard * w; });
    }
  }
  return out;
}

/** Hard sets per muscle (raw MuscleId) for the body heat map. */
export function hardSetsByMuscle(sessions: Session[], exById: Record<string, Exercise | undefined>, from: number, to: number): Partial<Record<MuscleId, number>> {
  const out: Partial<Record<MuscleId, number>> = {};
  for (const s of sessions) {
    const t = s.endedAt ?? s.startedAt;
    if (t < from || t >= to) continue;
    for (const it of s.items) {
      const ex = exById[it.exId];
      if (!ex) continue;
      const hard = it.sets.filter(isHardSet).length;
      ex.pm.forEach((m) => { out[m] = (out[m] ?? 0) + hard; });
      ex.sm.forEach((m) => { if (!ex.pm.includes(m)) out[m] = (out[m] ?? 0) + hard * 0.5; });
    }
  }
  return out;
}

// ─────────────── Mesocycle ───────────────

/** RIR target per week: 3 → 2 → 1 → 0-1, then a deload (half sets, RIR 4). */
export function mesoWeek(start: number, weeks: number, now = Date.now()): { week: number; rir: number; deload: boolean } {
  const w = Math.floor(Math.max(0, now - start) / (7 * 86400000)) % weeks;
  const week = w + 1;
  if (week === weeks) return { week, rir: 4, deload: true };
  return { week, rir: Math.max(0, 3 - w), deload: false };
}

export function weekStart(ts = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}
