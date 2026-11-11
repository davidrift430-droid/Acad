// Onboarding: language, athlete profile, training constraints → generates the first mesocycle.
import { useState } from 'react';
import { getState, setState, uid } from '../db/store';
import { EX_BY_ID } from '../data';
import { generateProgram } from '../core/generator';
import { isoDate } from '../core/body';
import type { Equipment, Goal, Joint, Lang, MuscleId, Profile } from '../core/types';
import { useT } from '../i18n';
import { Icon, go } from '../ui/kit';

const EMPH: MuscleId[] = ['chest', 'lats', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals'];

export function OnboardingScreen() {
  const t = useT();
  const prev = getState().profile;
  const [step, setStep] = useState(prev ? 1 : 0);
  const [p, setP] = useState<Profile>(prev ?? {
    name: '', sex: 'm', age: 25, heightCm: 175, level: 2, daysPerWeek: 4, sessionMin: 75, equipment: 'gym',
    goal: 'bulk', joints: [], emphasis: [], activity: 1.55, createdAt: Date.now(),
  });
  const [kg, setKg] = useState(String(getState().weighIns.at(-1)?.kg ?? ''));
  const up = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const TOTAL = 4;

  const finish = () => {
    const program = generateProgram(p, EX_BY_ID, uid);
    const w = parseFloat(kg.replace(',', '.'));
    setState((s) => {
      s.profile = { ...p, name: p.name.trim() || 'Athlete' };
      s.programs.unshift(program);
      s.activeProgramId = program.id;
      if (w > 25 && w < 400 && !s.weighIns.some((x) => x.date === isoDate(Date.now()))) s.weighIns.push({ date: isoDate(Date.now()), kg: w });
    });
    go('');
  };

  const Opt = ({ on, onClick, title, desc }: { on: boolean; onClick: () => void; title: string; desc?: string }) => (
    <button className={`opt ${on ? 'on' : ''}`} onClick={onClick}>
      <div className="grow col gap-0"><span className="t">{title}</span>{desc && <span className="d">{desc}</span>}</div>
      {on && <Icon name="check" size={20} stroke={3} />}
    </button>
  );
  const Num = ({ label, value, onChange, suffix }: { label: string; value: string | number; onChange: (v: string) => void; suffix?: string }) => (
    <label className="field"><span>{label}{suffix ? ` (${suffix})` : ''}</span>
      <input className="input mono" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} /></label>
  );

  return (
    <div className="screen full">
      {step > 0 && (
        <div className="row">
          <button className="icon-btn ghost" onClick={() => setStep(step - 1)} aria-label="back"><Icon name="back" /></button>
          <div className="steps-dots grow">{Array.from({ length: TOTAL }, (_, i) => <i key={i} className={i < step ? 'on' : ''} />)}</div>
        </div>
      )}

      {step === 0 && (
        <div className="hero" style={{ minHeight: '70dvh', justifyContent: 'flex-end' }}>
          <div className="grid-bg" />
          <span className="wordmark">DYMO <b>TRAINING</b></span>
          <h1 style={{ fontSize: 44, lineHeight: 1 }}>OPTIMIZED<br />HYPERTROPHY<br /><span className="accent">OS.</span></h1>
          <p className="muted">{t('onb.tagline')}</p>
          <div className="seg">{(['pt', 'en', 'es'] as Lang[]).map((l) => (
            <button key={l} className={getState().settings.lang === l ? 'on' : ''} onClick={() => setState((s) => { s.settings.lang = l; })}>{l.toUpperCase()}</button>
          ))}</div>
          <button className="btn primary lg block" onClick={() => setStep(1)}>{t('onb.start')} <Icon name="chevron" size={18} /></button>
        </div>
      )}

      {step === 1 && (
        <div className="col gap-16">
          <h1>{t('onb.athlete')}</h1>
          <label className="field"><span>{t('onb.name')}</span><input className="input" value={p.name} onChange={(e) => up({ name: e.target.value.slice(0, 30) })} /></label>
          <div className="seg">{(['m', 'f'] as const).map((s) => <button key={s} className={p.sex === s ? 'on' : ''} onClick={() => up({ sex: s })}>{t(`sex.${s}`)}</button>)}</div>
          <div className="grid-3">
            <Num label={t('onb.age')} value={p.age} onChange={(v) => up({ age: parseInt(v) || 0 })} />
            <Num label={t('onb.height')} suffix="cm" value={p.heightCm} onChange={(v) => up({ heightCm: parseInt(v) || 0 })} />
            <Num label={t('onb.weight')} suffix="kg" value={kg} onChange={setKg} />
          </div>
          <span className="eyebrow">{t('onb.level')}</span>
          <div className="opt-list">
            {([1, 2, 3] as const).map((l) => <Opt key={l} on={p.level === l} onClick={() => up({ level: l })} title={t(`level.${l}`)} desc={t(`onb.level${l}`)} />)}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="col gap-16">
          <h1>{t('onb.schedule')}</h1>
          <span className="eyebrow">{t('onb.days')}</span>
          <div className="seg">{[2, 3, 4, 5, 6].map((d) => <button key={d} className={p.daysPerWeek === d ? 'on' : ''} onClick={() => up({ daysPerWeek: d })}>{d}</button>)}</div>
          <p className="tiny muted">{t(`onb.split${Math.min(6, Math.max(2, p.daysPerWeek))}`)}</p>
          <span className="eyebrow">{t('onb.duration')}</span>
          <div className="seg">{[45, 60, 75, 90].map((d) => <button key={d} className={p.sessionMin === d ? 'on' : ''} onClick={() => up({ sessionMin: d })}>{d}′</button>)}</div>
          <span className="eyebrow">{t('onb.equipment')}</span>
          <div className="opt-list">
            {(['gym', 'home'] as Equipment[]).map((e) => <Opt key={e} on={p.equipment === e} onClick={() => up({ equipment: e })} title={t(`equip.${e}`)} />)}
          </div>
          <span className="eyebrow">{t('onb.goal')}</span>
          <div className="seg">{(['bulk', 'maintain', 'cut'] as Goal[]).map((g) => <button key={g} className={p.goal === g ? 'on' : ''} onClick={() => up({ goal: g })}>{t(`goal.${g}`)}</button>)}</div>
          <label className="field"><span>{t('onb.activity')}</span>
            <select className="input" value={p.activity} onChange={(e) => up({ activity: Number(e.target.value) })}>
              {[1.375, 1.55, 1.725, 1.9].map((a) => <option key={a} value={a}>{t(`act.${a}`)}</option>)}
            </select></label>
        </div>
      )}

      {step === 3 && (
        <div className="col gap-16">
          <h1>{t('onb.emphasis')}</h1>
          <p className="small muted">{t('onb.emphasisD')}</p>
          <div className="chips" style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>
            {EMPH.map((m) => <button key={m} className={`chip ${p.emphasis.includes(m) ? 'on' : ''}`}
              onClick={() => up({ emphasis: p.emphasis.includes(m) ? p.emphasis.filter((x) => x !== m) : [...p.emphasis, m].slice(-2) })}>{t(`muscle.${m}`)}</button>)}
          </div>
          <h2>{t('onb.joints')}</h2>
          <div className="chips" style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>
            {(['knee', 'lowerBack', 'shoulder', 'elbow'] as Joint[]).map((j) => <button key={j} className={`chip ${p.joints.includes(j) ? 'on' : ''}`}
              onClick={() => up({ joints: p.joints.includes(j) ? p.joints.filter((x) => x !== j) : [...p.joints, j] })}>{t(`joint.${j}`)}</button>)}
          </div>
          <p className="tiny muted">{t('onb.jointsD')}</p>
        </div>
      )}

      {step === 4 && (
        <div className="hero">
          <div className="grid-bg" />
          <span className="eyebrow">{t('onb.ready')}</span>
          <h1>{t('onb.readyTitle')}</h1>
          <ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
            <li>{t(`gen.split.${p.daysPerWeek <= 3 ? 'full' : p.daysPerWeek === 4 ? 'ul' : p.daysPerWeek === 5 ? 'ulppl' : 'ppl'}`)}</li>
            <li>{t('gen.stretch')}</li>
            <li>{t('gen.rir')}</li>
            <li>{t('gen.deload')}</li>
          </ul>
        </div>
      )}

      {step > 0 && (
        <div className="bottom-cta">
          <button className="btn primary lg block" disabled={step === 1 && !p.name.trim()} onClick={() => (step < TOTAL ? setStep(step + 1) : finish())}>
            {step < TOTAL ? t('common.next') : t('onb.generate')} <Icon name="chevron" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
