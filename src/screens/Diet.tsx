// Diet builder: energy/macro targets from profile + 7-day average weight, automatic meal plan, food swaps.
import { useMemo, useState } from 'react';
import { setState, uid, useStore } from '../db/store';
import { FOODS, FOOD_BY_ID } from '../data/foods';
import { buildPlan, defaultTemplates, itemMacros, macroTargets, sumMacros } from '../core/nutrition';
import { movingAverage } from '../core/body';
import type { Food, Goal, Lang } from '../core/types';
import { useLang, useT } from '../i18n';
import { Icon, Sheet, fmt, toast } from '../ui/kit';

const foodName = (f: Food | undefined, lang: Lang) => (!f ? '—' : f[lang]);

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target ? Math.min(130, (value / target) * 100) : 0;
  const off = Math.abs(value - target) / (target || 1) > 0.1;
  return (
    <div className="col gap-4">
      <div className="row between small"><b>{label}</b><span className="mono"><b style={{ color: off ? 'var(--warn)' : 'var(--text)' }}>{fmt(value, 0)}</b><span className="muted"> / {fmt(target, 0)}</span></span></div>
      <div className="vol-track" style={{ height: 8 }}><div className="fill" style={{ top: 0, bottom: 0, width: `${Math.min(100, pct)}%`, background: color }} /></div>
    </div>
  );
}

export function DietScreen() {
  const t = useT();
  const lang = useLang();
  const profile = useStore((s) => s.profile);
  const weighIns = useStore((s) => s.weighIns);
  const diet = useStore((s) => s.diet);
  const meals = useStore((s) => s.dietMeals);
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'bulk');
  const [swap, setSwap] = useState<{ meal: number; item: number } | null>(null);
  const kg = movingAverage(weighIns).at(-1)?.ma ?? 75;

  const target = useMemo(() => profile
    ? macroTargets({ sex: profile.sex, kg, cm: profile.heightCm, age: profile.age, activity: profile.activity, goal, level: profile.level })
    : null, [profile, kg, goal]);
  if (!profile || !target) return <div className="screen"><p className="muted">{t('diet.needProfile')}</p></div>;

  const generate = (n = meals) => {
    const plan = buildPlan(target, defaultTemplates(n), FOOD_BY_ID, uid);
    setState((s) => { s.diet = plan; s.dietMeals = n; });
    toast(t('diet.generated'));
  };
  const totals = diet ? sumMacros(diet.meals.flatMap((m) => m.items), FOOD_BY_ID) : null;
  const swapping = swap && diet ? diet.meals[swap.meal]?.items[swap.item] : null;
  const swapCat = swapping ? FOOD_BY_ID[swapping.foodId]?.cat : undefined;

  return (
    <div className="screen">
      <div className="topbar"><h1>{t('tab.diet')}</h1></div>
      <div className="seg">
        {(['cut', 'maintain', 'bulk'] as Goal[]).map((g) => <button key={g} className={goal === g ? 'on' : ''} onClick={() => setGoal(g)}>{t(`goal.${g}`)}</button>)}
      </div>
      <div className="hero">
        <div className="grid-bg" />
        <div className="row between"><span className="eyebrow">{t('diet.target')}</span><span className="pill">{fmt(kg, 1)} kg · {t('body.ma7')}</span></div>
        <div className="big-num accent">{fmt(target.kcal, 0)} <span className="muted" style={{ fontSize: 16 }}>kcal</span></div>
        <div className="grid-3">
          <div><div className="mono bold" style={{ fontSize: 22 }}>{target.p}g</div><span className="eyebrow">{t('diet.protein')}</span></div>
          <div><div className="mono bold" style={{ fontSize: 22 }}>{target.c}g</div><span className="eyebrow">{t('diet.carbs')}</span></div>
          <div><div className="mono bold" style={{ fontSize: 22 }}>{target.f}g</div><span className="eyebrow">{t('diet.fat')}</span></div>
        </div>
        <span className="tiny muted">BMR {target.bmr} · TDEE {target.tdee} kcal · {t(`diet.goalNote.${goal}`)} · 💧 {fmt(kg * 0.035, 1)} L</span>
      </div>

      <div className="card">
        <span className="eyebrow">{t('diet.meals')}</span>
        <div className="seg">{[3, 4, 5, 6].map((n) => <button key={n} className={meals === n ? 'on' : ''} onClick={() => { setState((s) => { s.dietMeals = n; }); if (diet) generate(n); }}>{n}</button>)}</div>
        <button className="btn primary block" onClick={() => generate()}><Icon name="bolt" size={18} />{diet ? t('diet.regenerate') : t('diet.generate')}</button>
      </div>

      {diet && totals && (
        <>
          <div className="card">
            <span className="eyebrow">{t('diet.totals')}</span>
            <MacroBar label="kcal" value={totals.kcal} target={target.kcal} color="var(--accent)" />
            <MacroBar label={t('diet.protein')} value={totals.p} target={target.p} color="var(--danger)" />
            <MacroBar label={t('diet.carbs')} value={totals.c} target={target.c} color="var(--info)" />
            <MacroBar label={t('diet.fat')} value={totals.f} target={target.f} color="var(--warn)" />
          </div>
          {diet.meals.map((m, mi) => {
            const mm = sumMacros(m.items, FOOD_BY_ID);
            return (
              <div key={m.id} className="card">
                <div className="row between"><h3>{t(m.name)}</h3><span className="mono small muted">{fmt(mm.kcal, 0)} kcal · P{fmt(mm.p, 0)} C{fmt(mm.c, 0)} G{fmt(mm.f, 0)}</span></div>
                {m.items.map((it, ii) => {
                  const f = FOOD_BY_ID[it.foodId];
                  const units = f?.unit ? it.g / f.unit.g : null;
                  return (
                    <div key={ii} className="row" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                      <div className="grow col gap-0">
                        <span className="small bold">{foodName(f, lang)}</span>
                        <span className="tiny muted">{f ? `${fmt(itemMacros(f, it.g).kcal, 0)} kcal · P${fmt(itemMacros(f, it.g).p, 0)}` : ''}{units && f?.unit ? ` · ≈ ${fmt(units, 1)} ${f.unit[lang]}` : ''}</span>
                      </div>
                      <button className="icon-btn ghost" style={{ width: 36 }} onClick={() => setState((s) => { const x = s.diet!.meals[mi]!.items[ii]!; x.g = Math.max(5, x.g - 10); })} aria-label="-10g"><Icon name="minus" size={16} /></button>
                      <span className="mono bold" style={{ minWidth: 48, textAlign: 'center' }}>{it.g}g</span>
                      <button className="icon-btn ghost" style={{ width: 36 }} onClick={() => setState((s) => { s.diet!.meals[mi]!.items[ii]!.g += 10; })} aria-label="+10g"><Icon name="plus" size={16} /></button>
                      <button className="icon-btn ghost" style={{ width: 36 }} onClick={() => setSwap({ meal: mi, item: ii })} aria-label={t('diet.swap')}><Icon name="swap" size={16} /></button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}
      <p className="tiny faint">{t('diet.disclaimer')}</p>

      <Sheet open={!!swapping} onClose={() => setSwap(null)}>
        <h2>{t('diet.swap')}</h2>
        <p className="small muted">{t('diet.swapD')}</p>
        {FOODS.filter((f) => f.cat === swapCat || (swapCat === 'dairy' && f.cat === 'protein') || (swapCat === 'protein' && f.cat === 'dairy')).map((f) => (
          <div key={f.id} className="list-row" role="button" onClick={() => {
            if (!swap || !swapping) return;
            const old = FOOD_BY_ID[swapping.foodId];
            // Keep the same amount of the food's main macro.
            const key = old?.cat === 'fat' ? 'f' : old?.cat === 'protein' || old?.cat === 'dairy' ? 'p' : 'c';
            const oldAmount = old ? (old[key] * swapping.g) / 100 : 0;
            const g = f[key] > 0 ? Math.round(((oldAmount / f[key]) * 100) / 5) * 5 : swapping.g;
            setState((s) => { s.diet!.meals[swap.meal]!.items[swap.item] = { foodId: f.id, g: Math.max(5, Math.min(g, 800)) }; });
            setSwap(null);
          }}>
            <div className="grow col gap-0"><b className="small">{foodName(f, lang)}</b><span className="tiny muted mono">100g: {f.kcal} kcal · P{f.p} C{f.c} G{f.f}</span></div>
          </div>
        ))}
      </Sheet>
    </div>
  );
}
