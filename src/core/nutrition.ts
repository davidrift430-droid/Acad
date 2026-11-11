// Energy and macro targets (Mifflin-St Jeor 1990) and an automatic meal-plan builder.
// Protein ranges follow Morton et al. 2018 (≥1.6 g/kg) and Helms et al. 2014 (higher in a deficit).
import type { DietPlan, Food, Goal, Macros, Meal, MealItem, Sex } from './types';

export function bmr(sex: Sex, kg: number, cm: number, age: number): number {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161);
}

export interface TargetInput {
  sex: Sex; kg: number; cm: number; age: number; activity: number; goal: Goal; level: 1 | 2 | 3;
}

/** Bulk: +15 % (novice/intermediate) or +10 % (advanced); cut: −20 %. */
export function macroTargets(i: TargetInput): Macros & { tdee: number; bmr: number } {
  const b = bmr(i.sex, i.kg, i.cm, i.age);
  const tdee = b * i.activity;
  const factor = i.goal === 'bulk' ? (i.level === 3 ? 1.1 : 1.15) : i.goal === 'cut' ? 0.8 : 1;
  const kcal = Math.round((tdee * factor) / 10) * 10;
  const p = Math.round(i.kg * (i.goal === 'cut' ? 2.3 : 2.0));
  const f = Math.round(Math.max(i.kg * 0.7, (kcal * 0.25) / 9));
  const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  return { kcal, p, c, f, tdee: Math.round(tdee), bmr: Math.round(b) };
}

export function itemMacros(food: Food, g: number): Macros {
  const k = g / 100;
  return { kcal: food.kcal * k, p: food.p * k, c: food.c * k, f: food.f * k };
}

export function sumMacros(items: MealItem[], byId: Record<string, Food | undefined>): Macros {
  return items.reduce<Macros>((acc, it) => {
    const food = byId[it.foodId];
    if (!food) return acc;
    const m = itemMacros(food, it.g);
    return { kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f };
  }, { kcal: 0, p: 0, c: 0, f: 0 });
}

/**
 * Solves gram amounts so a protein food, a carb food and a fat food hit a meal's macro target.
 * Fixed items (fruit, veg) are counted first. Uses a few Gauss-Seidel passes and rounds to 5 g.
 */
export function solveMeal(
  target: Macros,
  pFood: Food | undefined, cFood: Food | undefined, fFood: Food | undefined,
  fixed: MealItem[], byId: Record<string, Food | undefined>,
): MealItem[] {
  const base = sumMacros(fixed, byId);
  let gp = 0; let gc = 0; let gf = 0;
  for (let i = 0; i < 6; i++) {
    if (cFood && cFood.c > 0) {
      const other = base.c + (pFood ? pFood.c * gp / 100 : 0) + (fFood ? fFood.c * gf / 100 : 0);
      gc = Math.max(0, (target.c - other) / cFood.c * 100);
    }
    if (pFood && pFood.p > 0) {
      const other = base.p + (cFood ? cFood.p * gc / 100 : 0) + (fFood ? fFood.p * gf / 100 : 0);
      gp = Math.max(0, (target.p - other) / pFood.p * 100);
    }
    if (fFood && fFood.f > 0) {
      const other = base.f + (pFood ? pFood.f * gp / 100 : 0) + (cFood ? cFood.f * gc / 100 : 0);
      gf = Math.max(0, (target.f - other) / fFood.f * 100);
    }
  }
  const r5 = (g: number) => Math.round(g / 5) * 5;
  const out: MealItem[] = [];
  if (pFood && r5(gp) > 0) out.push({ foodId: pFood.id, g: Math.min(r5(gp), 600) });
  if (cFood && r5(gc) > 0) out.push({ foodId: cFood.id, g: Math.min(r5(gc), 700) });
  out.push(...fixed);
  if (fFood && r5(gf) > 0) out.push({ foodId: fFood.id, g: Math.min(r5(gf), 60) });
  return out;
}

export interface MealTemplate { name: string; p: string; c: string; f?: string; fixed: MealItem[]; share: number }

/** Default Brazilian-style day; meal names are i18n keys. Shares weight carbs around training. */
export function defaultTemplates(meals: number): MealTemplate[] {
  const all: MealTemplate[] = [
    { name: 'meal.breakfast', p: 'egg', c: 'oats', fixed: [{ foodId: 'banana', g: 70 }], share: 1 },
    { name: 'meal.lunch', p: 'chicken', c: 'rice_white', f: 'olive_oil', fixed: [{ foodId: 'beans', g: 86 }, { foodId: 'salad', g: 80 }], share: 1.2 },
    { name: 'meal.preworkout', p: 'whey', c: 'bread', f: 'peanut_butter', fixed: [], share: 0.8 },
    { name: 'meal.dinner', p: 'beef_lean', c: 'sweet_potato', f: 'olive_oil', fixed: [{ foodId: 'broccoli', g: 100 }], share: 1.1 },
    { name: 'meal.snack', p: 'greek_yogurt', c: 'granola', f: 'nuts', fixed: [{ foodId: 'strawberry', g: 100 }], share: 0.7 },
    { name: 'meal.supper', p: 'cottage', c: 'rice_cake', f: 'almonds', fixed: [], share: 0.5 },
  ];
  const pick: Record<number, number[]> = { 3: [0, 1, 3], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4], 6: [0, 4, 1, 2, 3, 5] };
  return (pick[meals] ?? pick[4]!).map((i) => all[i]!);
}

export function buildPlan(target: Macros, templates: MealTemplate[], byId: Record<string, Food | undefined>, uid: () => string): DietPlan {
  const total = templates.reduce((a, t) => a + t.share, 0);
  const meals: Meal[] = templates.map((t) => {
    const k = t.share / total;
    const mt: Macros = { kcal: target.kcal * k, p: target.p * k, c: target.c * k, f: target.f * k };
    return { id: uid(), name: t.name, items: solveMeal(mt, byId[t.p], byId[t.c], t.f ? byId[t.f] : undefined, t.fixed, byId) };
  });
  return { target, meals, updatedAt: Date.now() };
}
