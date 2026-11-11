// Biometrics: 7-day moving average, weekly rate of gain, lean-bulk guardian and stagnation alarm.
// Reference: Iraki, Fitschen, Espinar & Helms (2019) — target ~0.25–0.5 % bodyweight/week in the off-season,
// judged from average weekly changes rather than single weigh-ins.
import type { WeighIn } from './types';

const DAY = 86400000;
export const toDay = (iso: string): number => Date.parse(iso + 'T12:00:00');
export const isoDate = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface MaPoint { date: string; kg: number; ma: number }

/** Trailing 7-calendar-day average at each weigh-in (uses every entry inside the window). */
export function movingAverage(entries: WeighIn[], windowDays = 7): MaPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((e) => {
    const t = toDay(e.date);
    const win = sorted.filter((x) => { const tx = toDay(x.date); return tx <= t && tx > t - windowDays * DAY; });
    const ma = win.reduce((a, x) => a + x.kg, 0) / win.length;
    return { date: e.date, kg: e.kg, ma: Math.round(ma * 100) / 100 };
  });
}

/** Weekly % change of the moving average (latest point vs the point ~7 days earlier). */
export function weeklyRatePct(points: MaPoint[]): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1]!;
  const t = toDay(last.date);
  const prior = [...points].reverse().find((p) => toDay(p.date) <= t - 6 * DAY);
  if (!prior) return null;
  const weeks = (t - toDay(prior.date)) / (7 * DAY);
  return ((last.ma - prior.ma) / prior.ma) * 100 / weeks;
}

export type BulkStatus = 'insufficient' | 'losing' | 'slow' | 'on_target' | 'fast';

export interface BulkReport {
  status: BulkStatus;
  ratePct: number | null;
  kgPerWeek: number | null;
  targetLow: number;
  targetHigh: number;
  /** Suggested daily calorie change (rounded to 50 kcal). */
  kcalAdjust: number;
}

/** Lean-bulk guardian. Advanced lifters get a more conservative ceiling. */
export function leanBulkReport(entries: WeighIn[], level: 1 | 2 | 3 = 2): BulkReport {
  const targetLow = 0.25;
  const targetHigh = level === 3 ? 0.35 : 0.5;
  const pts = movingAverage(entries);
  const span = pts.length ? (toDay(pts[pts.length - 1]!.date) - toDay(pts[0]!.date)) / DAY : 0;
  const rate = span >= 10 ? weeklyRatePct(pts) : null;
  const bw = pts.length ? pts[pts.length - 1]!.ma : 0;
  if (rate == null) return { status: 'insufficient', ratePct: null, kgPerWeek: null, targetLow, targetHigh, kcalAdjust: 0 };
  const mid = (targetLow + targetHigh) / 2;
  // 1 kg of tissue ≈ 7700 kcal → kcal/day = %/100 · bw · 7700 / 7
  const raw = ((mid - rate) / 100) * bw * 1100;
  const kcalAdjust = Math.max(-300, Math.min(300, Math.round(raw / 50) * 50));
  const status: BulkStatus = rate < 0 ? 'losing' : rate < targetLow ? 'slow' : rate > targetHigh ? 'fast' : 'on_target';
  return { status, ratePct: rate, kgPerWeek: (rate / 100) * bw, targetLow, targetHigh, kcalAdjust: status === 'on_target' ? 0 : kcalAdjust };
}

/** Average weight per ISO week (Monday start), oldest first. */
export function weeklyAverages(entries: WeighIn[], weekStartOf: (t: number) => number): { week: number; kg: number }[] {
  const map = new Map<number, number[]>();
  for (const e of entries) {
    const w = weekStartOf(toDay(e.date));
    map.set(w, [...(map.get(w) ?? []), e.kg]);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([week, kgs]) => ({ week, kg: kgs.reduce((a, b) => a + b, 0) / kgs.length }));
}

/**
 * Stagnation vs adipogenesis alarm.
 * Fires when weekly average bodyweight rose for 3 consecutive weeks while none of the main compound
 * lifts improved their best e1RM by more than 1 % versus the previous 3 weeks.
 */
export function stagnationAlarm(
  weekly: { week: number; kg: number }[],
  compoundE1rm: { exId: string; at: number; e1rm: number }[],
  now = Date.now(),
): { fired: boolean; reason: 'insufficient' | 'progressing' | 'not_gaining' | 'stagnant' } {
  if (weekly.length < 4) return { fired: false, reason: 'insufficient' };
  const last4 = weekly.slice(-4);
  const rising = last4.every((w, i) => i === 0 || w.kg > last4[i - 1]!.kg);
  if (!rising) return { fired: false, reason: 'not_gaining' };
  const recentFrom = now - 21 * DAY;
  const prevFrom = now - 42 * DAY;
  const best = (from: number, to: number) => {
    const m = new Map<string, number>();
    compoundE1rm.filter((x) => x.at >= from && x.at < to).forEach((x) => m.set(x.exId, Math.max(m.get(x.exId) ?? 0, x.e1rm)));
    return m;
  };
  const recent = best(recentFrom, now + 1);
  const prev = best(prevFrom, recentFrom);
  const shared = [...recent.keys()].filter((k) => prev.has(k));
  if (!shared.length) return { fired: false, reason: 'insufficient' };
  const improved = shared.some((k) => recent.get(k)! > prev.get(k)! * 1.01);
  return improved ? { fired: false, reason: 'progressing' } : { fired: true, reason: 'stagnant' };
}
