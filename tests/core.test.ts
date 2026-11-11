import { describe, expect, it } from 'vitest';
import raw from '../src/data/exercises.json';
import type { Exercise, Session, WeighIn } from '../src/core/types';
import { e1rm, hardSetsByGroup, isHardSet, mesoWeek, recommend, restFor, targetMet, zoneOf, LANDMARKS } from '../src/core/training';
import { leanBulkReport, movingAverage, stagnationAlarm, weeklyRatePct } from '../src/core/body';
import { buildPlan, defaultTemplates, macroTargets, sumMacros } from '../src/core/nutrition';
import { generateProgram, projectedVolume } from '../src/core/generator';
import { FOOD_BY_ID } from '../src/data/foods';

const EXS = raw as unknown as Exercise[];
const BY_ID = Object.fromEntries(EXS.map((e) => [e.id, e])) as Record<string, Exercise | undefined>;
let n = 0;
const uid = () => `id${n++}`;
const DAY = 86400000;

describe('double progression', () => {
  const rx = { repMin: 6, repMax: 8 };
  it('flags target met only at top of range with RIR ≤ 2', () => {
    expect(targetMet({ kg: 100, reps: 8, rir: 1, done: true }, 8)).toBe(true);
    expect(targetMet({ kg: 100, reps: 8, rir: 3, done: true }, 8)).toBe(false);
    expect(targetMet({ kg: 100, reps: 7, rir: 0, done: true }, 8)).toBe(false);
  });
  it('adds load when every top set meets the target', () => {
    const r = recommend([{ kg: 100, reps: 8, rir: 1, done: true }, { kg: 100, reps: 8, rir: 2, done: true }], rx, 'barbell');
    expect(r).toEqual({ kind: 'increase', kg: 102.5, reps: 6 });
  });
  it('adds a rep otherwise', () => {
    const r = recommend([{ kg: 100, reps: 8, rir: 1, done: true }, { kg: 100, reps: 6, rir: 1, done: true }], rx, 'barbell');
    expect(r).toEqual({ kind: 'reps', kg: 100, reps: 7 });
  });
  it('holds after failing below the range', () => {
    expect(recommend([{ kg: 100, reps: 5, rir: 0, done: true }], rx, 'barbell').kind).toBe('hold');
  });
  it('e1RM accounts for reps in reserve', () => {
    expect(e1rm(100, 8, 2)).toBeCloseTo(133.33, 1);
    expect(e1rm(100, 1, 0)).toBe(100);
  });
});

describe('volume engine', () => {
  it('only counts 0–3 RIR as hard sets', () => {
    expect(isHardSet({ kg: 50, reps: 10, rir: 3, done: true })).toBe(true);
    expect(isHardSet({ kg: 50, reps: 10, rir: 4, done: true })).toBe(false);
    expect(isHardSet({ kg: 50, reps: 10, rir: 1, done: false })).toBe(false);
  });
  it('counts primary 1 and secondary 0.5 (fractional)', () => {
    const s: Session = {
      id: 's', programId: null, dayId: null, name: 'x', week: 1, deload: false, startedAt: 1000, endedAt: 2000,
      items: [{ exId: 'Barbell_Bench_Press_-_Medium_Grip', repMin: 6, repMax: 8, restSec: 180, rirTarget: 2,
        sets: [1, 2, 4].map((rir) => ({ kg: 100, reps: 8, rir: rir as 1 | 2 | 4, done: true })) }],
    };
    const v = hardSetsByGroup([s], BY_ID, 0, 5000);
    expect(v.chest).toBe(2);
    expect(v.triceps).toBe(1);
  });
  it('maps volume to zones', () => {
    expect(zoneOf(4, LANDMARKS.chest)).toBe('below');
    expect(zoneOf(15, LANDMARKS.chest)).toBe('mav');
    expect(zoneOf(30, LANDMARKS.chest)).toBe('over');
  });
  it('auto-regulates rest by complexity', () => {
    expect(restFor(BY_ID.Barbell_Squat!)).toBe(180);
    expect(restFor(BY_ID.Leg_Extensions!)).toBeLessThanOrEqual(90);
  });
  it('runs a mesocycle with a deload', () => {
    expect(mesoWeek(0, 5, 0).rir).toBe(3);
    expect(mesoWeek(0, 5, 3 * 7 * DAY).rir).toBe(0);
    expect(mesoWeek(0, 5, 4 * 7 * DAY).deload).toBe(true);
  });
});

describe('biometrics', () => {
  const series = (start: number, perDay: number, days: number): WeighIn[] =>
    Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.UTC(2026, 0, 1) + i * DAY);
      return { date: d.toISOString().slice(0, 10), kg: start + perDay * i + (i % 2 ? 0.4 : -0.4) };
    });
  it('smooths daily noise with a 7-day moving average', () => {
    const ma = movingAverage(series(80, 0, 14));
    expect(Math.abs(ma[13]!.ma - 80)).toBeLessThan(0.1);
  });
  it('computes weekly rate and lean bulk status', () => {
    const s = series(80, 0.04, 28); // ~0.28 kg/week ≈ 0.35 %
    const rate = weeklyRatePct(movingAverage(s))!;
    expect(rate).toBeGreaterThan(0.25);
    expect(rate).toBeLessThan(0.5);
    expect(leanBulkReport(s, 2).status).toBe('on_target');
    expect(leanBulkReport(series(80, 0.15, 28), 2).status).toBe('fast');
    expect(leanBulkReport(series(80, 0.15, 28), 2).kcalAdjust).toBeLessThan(0);
  });
  it('fires the stagnation alarm when weight rises but strength does not', () => {
    const now = Date.UTC(2026, 2, 1);
    const weekly = [80, 80.5, 81, 81.6].map((kg, i) => ({ week: i, kg }));
    const flat = [{ exId: 'sq', at: now - 30 * DAY, e1rm: 150 }, { exId: 'sq', at: now - 5 * DAY, e1rm: 150 }];
    const up = [{ exId: 'sq', at: now - 30 * DAY, e1rm: 150 }, { exId: 'sq', at: now - 5 * DAY, e1rm: 156 }];
    expect(stagnationAlarm(weekly, flat, now).fired).toBe(true);
    expect(stagnationAlarm(weekly, up, now).fired).toBe(false);
  });
});

describe('nutrition', () => {
  it('builds targets and a meal plan close to them', () => {
    const t = macroTargets({ sex: 'm', kg: 80, cm: 180, age: 28, activity: 1.55, goal: 'bulk', level: 2 });
    expect(t.p).toBe(160);
    const plan = buildPlan(t, defaultTemplates(5), FOOD_BY_ID, uid);
    const total = sumMacros(plan.meals.flatMap((m) => m.items), FOOD_BY_ID);
    expect(Math.abs(total.kcal - t.kcal) / t.kcal).toBeLessThan(0.08);
    expect(Math.abs(total.p - t.p)).toBeLessThan(15);
  });
});

describe('generator', () => {
  it('generates valid programs for every profile', () => {
    for (const daysPerWeek of [2, 3, 4, 5, 6]) for (const equipment of ['gym', 'home'] as const)
      for (const sessionMin of [45, 60, 75, 90]) for (const joints of [[], ['knee', 'lowerBack', 'shoulder', 'elbow']] as const) {
        const p = generateProgram({ daysPerWeek, sessionMin, equipment, level: 3, joints: [...joints], emphasis: ['biceps'] }, BY_ID, uid);
        expect(p.days).toHaveLength(daysPerWeek);
        for (const d of p.days) {
          expect(d.items.length).toBeGreaterThanOrEqual(4);
          expect(new Set(d.items.map((i) => i.exId)).size).toBe(d.items.length);
        }
      }
  });
  it('projects weekly volume inside sensible ranges for a 4-day upper/lower', () => {
    const p = generateProgram({ daysPerWeek: 4, sessionMin: 75, equipment: 'gym', level: 2, joints: [], emphasis: [] }, BY_ID, uid);
    const v = projectedVolume(p, BY_ID);
    expect(v.chest).toBeGreaterThanOrEqual(LANDMARKS.chest.mev);
    expect(v.quadriceps).toBeGreaterThanOrEqual(LANDMARKS.quadriceps.mev);
    expect(v.chest).toBeLessThanOrEqual(LANDMARKS.chest.mrv);
  });
});
