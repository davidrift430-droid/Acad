// Workout logger — "one-tap workout floor".
// Each set is prefilled from the double-progression engine; tapping ✓ commits it, starts the auto-regulated rest
// timer and flags "PR target met" when the top of the rep range is hit at RIR ≤ 2.
import { useEffect, useRef, useState } from 'react';
import { getState, lastSets, setState, uid, useStore } from '../db/store';
import { EX_BY_ID, exImg, exName } from '../data';
import { bestE1rm, isHardSet, loadIncrement, mesoWeek, recommend, restFor, targetMet, hardSetsByGroup, VOLUME_GROUPS } from '../core/training';
import type { Program, ProgramDay, Rir, Session, SessionItem, SetLog } from '../core/types';
import { useLang, useT } from '../i18n';
import { Icon, Sheet, fmt, fmtTime, fromDisplay, go, haptic, toDisplay, toast, useTick } from '../ui/kit';
import { ExerciseSheet, Picker } from './Library';

// ───────── Session lifecycle ─────────

function buildItem(exId: string, rx: { sets: number; repMin: number; repMax: number; restSec?: number }, rir: number, deload: boolean): SessionItem {
  const ex = EX_BY_ID[exId];
  const last = lastSets(exId);
  const rec = last ? recommend(last.sets, rx, ex?.eq ?? 'other') : { kind: 'none' as const };
  const n = deload ? Math.max(1, Math.ceil(rx.sets / 2)) : rx.sets;
  const kg = rec.kind === 'none' ? null : deload ? Math.round(rec.kg * 0.9 * 4) / 4 : rec.kg;
  return {
    exId,
    repMin: rx.repMin,
    repMax: rx.repMax,
    restSec: rx.restSec ?? (ex ? restFor(ex) : 90),
    rirTarget: rir,
    sets: Array.from({ length: n }, () => ({ kg, reps: null, rir: null, done: false })),
  };
}

export function startSession(program: Program | null, day: ProgramDay | null, label?: string): void {
  const meso = program ? mesoWeek(program.mesoStart, program.mesoWeeks) : { week: 1, rir: 2, deload: false };
  const session: Session = {
    id: uid(),
    programId: program?.id ?? null,
    dayId: day?.id ?? null,
    name: label ?? day?.name ?? 'Free session',
    week: meso.week,
    deload: meso.deload,
    startedAt: Date.now(),
    items: (day?.items ?? []).map((rx) => buildItem(rx.exId, rx, meso.rir, meso.deload)),
  };
  setState((s) => { s.active = session; s.rest = null; });
}

function finishSession(): string | null {
  const a = getState().active;
  if (!a) return null;
  const done: Session = {
    ...a,
    endedAt: Date.now(),
    items: a.items.map((it) => ({ ...it, sets: it.sets.filter((s) => s.done) })).filter((it) => it.sets.length),
  };
  setState((s) => { s.sessions.unshift(done); s.active = null; s.rest = null; });
  return done.id;
}

// ───────── Numeric input that keeps partial typing ("102.") ─────────

function NumInput({ value, onCommit, placeholder, decimal }: { value: number | null; onCommit: (v: number | null) => void; placeholder: string; decimal?: boolean }) {
  const [text, setText] = useState(value == null ? '' : String(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(value == null ? '' : String(value)); }, [value]);
  return (
    <input
      className="set-in"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={text}
      placeholder={placeholder}
      onFocus={(e) => { focused.current = true; e.target.select(); }}
      onBlur={() => { focused.current = false; setText(value == null ? '' : String(value)); }}
      onChange={(e) => {
        const v = e.target.value.replace(',', '.').replace(decimal ? /[^\d.]/g : /\D/g, '');
        setText(v);
        const n = parseFloat(v);
        onCommit(Number.isFinite(n) ? n : null);
      }}
    />
  );
}

const RIR_LABEL = (r: Rir | null) => (r == null ? '—' : r === 4 ? '4+' : String(r));

// ───────── Exercise card ─────────

function ExerciseCard({ item, idx, timer, setTimer, onMenu, onHowto }: {
  item: SessionItem; idx: number; timer: { idx: number; start: number } | null;
  setTimer: (t: { idx: number; start: number } | null) => void; onMenu: (idx: number) => void; onHowto: (exId: string) => void;
}) {
  const t = useT();
  const lang = useLang();
  const unit = useStore((s) => s.settings.unit);
  const note = useStore((s) => s.notes[item.exId]);
  const ex = EX_BY_ID[item.exId];
  const last = lastSets(item.exId);
  const [rirOpen, setRirOpen] = useState<number | null>(null);
  const [glow, setGlow] = useState<number | null>(null);
  const rec = last ? recommend(last.sets, item, ex?.eq ?? 'other') : null;
  const bestPrev = last?.sets.reduce<SetLog | null>((b, s) => (!b || (s.kg ?? 0) > (b.kg ?? 0) || ((s.kg ?? 0) === (b.kg ?? 0) && (s.reps ?? 0) > (b.reps ?? 0)) ? s : b), null);
  const targetReps = rec && rec.kind !== 'none' ? rec.reps : item.repMax;
  const complete = item.sets.length > 0 && item.sets.every((s) => s.done);

  const patch = (si: number, fn: (s: SetLog) => void) => setState((st) => { const s = st.active?.items[idx]?.sets[si]; if (s) fn(s); });

  const toggle = (si: number) => {
    const s = item.sets[si]!;
    if (s.done) { patch(si, (x) => { x.done = false; }); setGlow(null); return; }
    const reps = s.reps ?? targetReps;
    const kg = s.kg ?? item.sets.slice(0, si).reverse().find((x) => x.kg != null)?.kg ?? last?.sets[si]?.kg ?? null;
    const rir = (s.rir ?? Math.min(4, item.rirTarget)) as Rir;
    const dur = timer && timer.idx === idx ? Math.round((Date.now() - timer.start) / 1000) : undefined;
    patch(si, (x) => { x.reps = reps; x.kg = kg; x.rir = rir; x.done = true; x.at = Date.now(); if (dur) x.durationSec = dur; });
    if (dur) setTimer(null);
    setRirOpen(null);
    const met = targetMet({ kg, reps, rir, done: true }, item.repMax);
    if (met) { setGlow(si); haptic('success'); } else haptic('light');
    const allDone = getState().active?.items.every((it) => it.sets.every((x) => x.done));
    if (!allDone) setState((st) => { st.rest = { until: Date.now() + item.restSec * 1000, total: item.restSec, label: exName(ex, lang) }; });
  };

  return (
    <div className={`ex-card ${complete ? 'complete' : ''}`}>
      <div className="head">
        <button className="thumb" style={{ padding: 0 }} onClick={() => onHowto(item.exId)} aria-label={t('ex.howto')}>
          <img className="thumb" src={exImg(item.exId, 1)} alt="" loading="lazy" style={{ border: 0 }} />
        </button>
        <div className="grow col gap-4">
          <span className="eyebrow">{idx + 1} · {ex ? t(`muscle.${ex.pm[0]}`) : ''}</span>
          <span className="name">{exName(ex, lang)}</span>
          <div className="row wrap gap-4">
            {ex && <span className={`pill ${ex.peak === 'L' ? 'accent' : ''}`}>{t('meta.peak')}: {t(`peak.${ex.peak}`)}</span>}
            {ex && <span className={`pill ${ex.cns === 3 ? 'warn' : ''}`}>{t('meta.cns')}: {t(`cns.${ex.cns}`)}</span>}
            {ex?.star ? <span className="pill solid">★ {t('meta.stretch')}</span> : null}
          </div>
        </div>
        <button className="icon-btn ghost" onClick={() => onMenu(idx)} aria-label={t('common.options')}><Icon name="menu" /></button>
      </div>
      {bestPrev ? (
        <div className="prev-line"><span>{t('log.previous')}</span><b>{fmt(toDisplay(bestPrev.kg, unit))}{unit} × {bestPrev.reps} @ {RIR_LABEL(bestPrev.rir)} RIR</b></div>
      ) : <div className="prev-line"><span>{t('log.firstTime')}</span><b>{item.repMin}–{item.repMax} reps</b></div>}
      {rec && rec.kind !== 'none' && (
        <div className="reco">
          {rec.kind === 'increase' ? '▲ ' + t('log.recoIncrease', { kg: fmt(toDisplay(rec.kg, unit)) + unit, reps: rec.reps })
            : rec.kind === 'reps' ? '► ' + t('log.recoReps', { kg: fmt(toDisplay(rec.kg, unit)) + unit, reps: rec.reps })
            : '■ ' + t('log.recoHold', { kg: fmt(toDisplay(rec.kg, unit)) + unit })}
          {' · '}{t('log.rirTarget', { rir: item.rirTarget === 4 ? '4+' : item.rirTarget })}
        </div>
      )}
      {note && <div className="reco" style={{ color: 'var(--muted)' }}>📝 {note}</div>}
      <div className="set-grid labels"><span>{t('log.set')}</span><span>{t('log.prev')}</span><span>{unit}</span><span>reps</span><span>RIR</span><span>✓</span></div>
      {item.sets.map((s, si) => {
        const p = last?.sets[si];
        return (
          <div key={si} className={`set-row ${s.done ? 'done' : ''} ${glow === si ? 'pr' : ''}`}>
            <div className="set-grid" style={{ padding: '4px 6px' }}>
              <span className="set-n">{s.done && s.rir != null && s.rir >= 4 ? 'W' : si + 1}</span>
              <span className="set-prev">{p ? `${fmt(toDisplay(p.kg, unit))}×${p.reps}` : '—'}</span>
              <NumInput decimal value={toDisplay(s.kg, unit)} placeholder={p?.kg != null ? String(toDisplay(p.kg, unit)) : unit}
                onCommit={(v) => patch(si, (x) => { x.kg = v == null ? null : fromDisplay(v, unit); })} />
              <NumInput value={s.reps} placeholder={String(targetReps)} onCommit={(v) => patch(si, (x) => { x.reps = v; })} />
              <button className={`rir-btn ${s.rir === 0 ? 'zero' : ''}`} onClick={() => setRirOpen(rirOpen === si ? null : si)} aria-label="RIR">
                {RIR_LABEL(s.rir ?? (Math.min(4, item.rirTarget) as Rir))}
              </button>
              <button className="check" onClick={() => toggle(si)} aria-label={t('log.complete')}><Icon name="check" size={24} stroke={3} /></button>
            </div>
            {rirOpen === si && (
              <div className="rir-picker">
                {([0, 1, 2, 3, 4] as Rir[]).map((r) => (
                  <button key={r} className={s.rir === r ? 'on' : ''} onClick={() => { patch(si, (x) => { x.rir = r; }); setRirOpen(null); }}>
                    {r === 0 ? '0 F' : r === 4 ? '4+' : r}
                  </button>
                ))}
              </div>
            )}
            {glow === si && (
              <div className="pr-banner"><Icon name="bolt" size={18} />{t('log.prMet', { inc: fmt(toDisplay(loadIncrement(s.kg ?? 0, ex?.eq ?? 'other'), unit)) + unit })}</div>
            )}
          </div>
        );
      })}
      <div className="ex-actions">
        <button className="btn secondary sm grow" onClick={() => setState((st) => { const it = st.active?.items[idx]; if (it) { const l = it.sets.at(-1); it.sets.push({ kg: l?.kg ?? null, reps: null, rir: null, done: false }); } })}>
          <Icon name="plus" size={16} /> {t('log.addSet')}
        </button>
        {item.sets.length > 1 && <button className="btn secondary sm" onClick={() => setState((st) => { st.active?.items[idx]?.sets.pop(); })}><Icon name="minus" size={16} /></button>}
        <button className={`btn sm ${timer?.idx === idx ? 'danger' : 'secondary'}`} onClick={() => setTimer(timer?.idx === idx ? null : { idx, start: Date.now() })}>
          <Icon name="timer" size={16} /> {timer?.idx === idx ? t('log.stopTimer') : t('log.setTimer')}
        </button>
      </div>
    </div>
  );
}

// ───────── Logger screen ─────────

export function Logger() {
  const t = useT();
  const lang = useLang();
  const active = useStore((s) => s.active);
  const [timer, setTimer] = useState<{ idx: number; start: number } | null>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const [howto, setHowto] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ mode: 'add' | 'swap'; idx?: number } | null>(null);
  const [confirm, setConfirm] = useState<'finish' | 'discard' | null>(null);
  const [noteText, setNoteText] = useState('');
  useTick(1000);

  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => undefined);
    return () => { void lock?.release().catch(() => undefined); };
  }, []);

  if (!active) return null;
  const all = active.items.reduce((a, it) => a + it.sets.length, 0);
  const done = active.items.reduce((a, it) => a + it.sets.filter((s) => s.done).length, 0);
  const menuItem = menu != null ? active.items[menu] : null;

  const doFinish = () => { const id = finishSession(); setConfirm(null); if (id) go(`summary/${id}`); };

  return (
    <div className="screen full">
      <div className="session-head">
        <div className="row">
          <button className="icon-btn ghost" onClick={() => go('lab')} aria-label={t('common.minimize')}><Icon name="down" /></button>
          <div className="grow col gap-0">
            <span className="eyebrow">{active.deload ? t('log.deloadWeek') : t('log.week', { w: active.week })} · {t('log.rirTarget', { rir: active.items[0]?.rirTarget === 4 ? '4+' : active.items[0]?.rirTarget ?? 2 })}</span>
            <h2 className="ellipsis">{active.name}</h2>
          </div>
          <div className="col gap-0" style={{ alignItems: 'flex-end' }}>
            <span className="mono bold" style={{ fontSize: 20 }}>{fmtTime((Date.now() - active.startedAt) / 1000)}</span>
            <span className="tiny muted mono">{done}/{all}</span>
          </div>
        </div>
        <div className="progress"><i style={{ width: `${all ? (done / all) * 100 : 0}%` }} /></div>
      </div>

      {timer && (
        <div className="set-timer" role="timer"><Icon name="timer" size={18} />{fmtTime((Date.now() - timer.start) / 1000)}
          <button className="btn sm" style={{ background: 'rgba(0,0,0,.25)', color: '#fff', minHeight: 30 }} onClick={() => setTimer(null)}>{t('log.stopTimer')}</button>
        </div>
      )}

      {!active.items.length && <div className="card center"><p className="muted">{t('log.empty')}</p></div>}
      {active.items.map((it, i) => (
        <ExerciseCard key={`${it.exId}-${i}`} item={it} idx={i} timer={timer} setTimer={setTimer} onHowto={setHowto} onMenu={(n) => { setMenu(n); setNoteText(getState().notes[it.exId] ?? ''); }} />
      ))}

      <button className="btn outline block" onClick={() => setPicker({ mode: 'add' })}><Icon name="plus" size={18} />{t('log.addExercise')}</button>
      <div className="row">
        <button className="btn ghost grow" onClick={() => setConfirm('discard')} style={{ color: 'var(--danger)' }}>{t('log.discard')}</button>
        <button className="btn primary grow" onClick={() => (done ? (done < all ? setConfirm('finish') : doFinish()) : toast(t('log.needOneSet')))}>
          <Icon name="check" size={18} stroke={3} />{t('log.finish')}
        </button>
      </div>

      <Sheet open={!!menuItem} onClose={() => setMenu(null)}>
        {menuItem && menu != null && (
          <>
            <h2>{exName(EX_BY_ID[menuItem.exId], lang)}</h2>
            <label className="field"><span>{t('log.note')}</span>
              <input className="input" value={noteText} placeholder={t('log.notePh')} onChange={(e) => setNoteText(e.target.value)}
                onBlur={() => setState((s) => { s.notes[menuItem.exId] = noteText.slice(0, 120); })} /></label>
            <div className="grid-2">
              <button className="btn secondary" onClick={() => { setHowto(menuItem.exId); setMenu(null); }}><Icon name="info" size={18} />{t('ex.howto')}</button>
              <button className="btn secondary" onClick={() => { setPicker({ mode: 'swap', idx: menu }); setMenu(null); }}><Icon name="swap" size={18} />{t('log.swap')}</button>
              <button className="btn secondary" disabled={menu === 0} onClick={() => { setState((s) => { const a = s.active!.items; [a[menu - 1], a[menu]] = [a[menu]!, a[menu - 1]!]; }); setMenu(null); }}><Icon name="up" size={18} />{t('common.up')}</button>
              <button className="btn secondary" disabled={menu === active.items.length - 1} onClick={() => { setState((s) => { const a = s.active!.items; [a[menu + 1], a[menu]] = [a[menu]!, a[menu + 1]!]; }); setMenu(null); }}><Icon name="down" size={18} />{t('common.down')}</button>
            </div>
            <button className="btn ghost block" style={{ color: 'var(--danger)' }} onClick={() => { setState((s) => { s.active!.items.splice(menu, 1); }); setMenu(null); }}><Icon name="trash" size={18} />{t('log.remove')}</button>
          </>
        )}
      </Sheet>

      <ExerciseSheet exId={howto} onClose={() => setHowto(null)} />

      <Picker
        open={!!picker}
        title={picker?.mode === 'swap' ? t('log.swap') : t('log.addExercise')}
        muscle={picker?.mode === 'swap' && picker.idx != null ? EX_BY_ID[active.items[picker.idx]?.exId ?? '']?.pm[0] : undefined}
        exclude={active.items.map((i) => i.exId)}
        onClose={() => setPicker(null)}
        onPick={(id) => {
          const ex = EX_BY_ID[id];
          const mech = ex?.mech === 'c';
          const rx = { sets: 3, repMin: mech ? 8 : 10, repMax: mech ? 12 : 15 };
          const rir = active.items[0]?.rirTarget ?? 2;
          setState((s) => {
            const a = s.active!;
            if (picker?.mode === 'swap' && picker.idx != null) { const old = a.items[picker.idx]!; a.items[picker.idx] = buildItem(id, { sets: old.sets.length, repMin: old.repMin, repMax: old.repMax }, old.rirTarget, a.deload); }
            else a.items.push(buildItem(id, rx, rir, a.deload));
          });
          setPicker(null);
        }}
      />

      <Sheet open={!!confirm} onClose={() => setConfirm(null)}>
        <h2>{confirm === 'discard' ? t('log.discardQ') : t('log.finishQ')}</h2>
        <p className="muted">{confirm === 'discard' ? t('log.discardD') : t('log.finishD', { done, all })}</p>
        <div className="row">
          <button className="btn secondary grow" onClick={() => setConfirm(null)}>{t('common.cancel')}</button>
          {confirm === 'discard'
            ? <button className="btn danger grow" onClick={() => { setState((s) => { s.active = null; s.rest = null; }); setConfirm(null); go(''); }}>{t('log.discard')}</button>
            : <button className="btn primary grow" onClick={doFinish}>{t('log.finish')}</button>}
        </div>
      </Sheet>
    </div>
  );
}

// ───────── Floating rest timer (global) ─────────

export function RestBar() {
  const t = useT();
  const rest = useStore((s) => s.rest);
  const fired = useRef(0);
  useTick(250);
  const left = rest ? (rest.until - Date.now()) / 1000 : 0;
  useEffect(() => {
    if (rest && left <= 0 && fired.current !== rest.until) {
      fired.current = rest.until;
      haptic('warning');
      import('../ui/kit').then((k) => k.beep());
      toast(t('rest.done'));
      setState((s) => { s.rest = null; });
    }
  });
  return (
    <div className={`rest ${rest && left > 0 ? 'show' : ''}`} role="timer">
      <div className="col gap-0">
        <span className="eyebrow">{t('rest.title')}</span>
        <span className="t">{fmtTime(Math.max(0, left))}</span>
      </div>
      <div className="ctrl">
        <button onClick={() => setState((s) => { if (s.rest) { s.rest.until -= 30000; } })}>−30</button>
        <button onClick={() => setState((s) => { if (s.rest) { s.rest.until += 30000; s.rest.total += 30; } })}>+30</button>
        <button onClick={() => setState((s) => { s.rest = null; })} aria-label={t('rest.skip')}><Icon name="x" size={18} /></button>
      </div>
      <div className="bar"><i style={{ width: `${rest ? Math.max(0, Math.min(100, (left / rest.total) * 100)) : 0}%` }} /></div>
    </div>
  );
}

// ───────── Session summary ─────────

export function Summary({ id }: { id: string }) {
  const t = useT();
  const lang = useLang();
  const unit = useStore((s) => s.settings.unit);
  const sessions = useStore((s) => s.sessions);
  const s = sessions.find((x) => x.id === id);
  if (!s) return <div className="screen"><p className="muted">—</p></div>;
  const older = sessions.filter((x) => (x.endedAt ?? 0) < (s.endedAt ?? 0));
  const prs = s.items.filter((it) => {
    const now = bestE1rm(it.sets);
    const prev = Math.max(0, ...older.flatMap((o) => o.items.filter((i) => i.exId === it.exId).map((i) => bestE1rm(i.sets))));
    return now > 0 && now > prev;
  });
  const hard = s.items.reduce((a, it) => a + it.sets.filter(isHardSet).length, 0);
  const tonnage = s.items.reduce((a, it) => a + it.sets.reduce((b, x) => b + (x.kg ?? 0) * (x.reps ?? 0), 0), 0);
  const groups = hardSetsByGroup([s], EX_BY_ID, 0, Infinity);
  const met = s.items.reduce((a, it) => a + it.sets.filter((x) => targetMet(x, it.repMax)).length, 0);
  return (
    <div className="screen full">
      <div className="hero">
        <div className="grid-bg" />
        <span className="eyebrow">{t('sum.complete')}</span>
        <h1>{s.name}</h1>
        <div className="grid-3">
          <div><div className="big-num" style={{ fontSize: 30 }}>{Math.round(((s.endedAt ?? 0) - s.startedAt) / 60000)}</div><span className="eyebrow">min</span></div>
          <div><div className="big-num accent" style={{ fontSize: 30 }}>{hard}</div><span className="eyebrow">{t('sum.hardSets')}</span></div>
          <div><div className="big-num" style={{ fontSize: 30 }}>{fmt((toDisplay(tonnage, unit) ?? 0) / 1000, 1)}t</div><span className="eyebrow">{t('sum.tonnage')}</span></div>
        </div>
      </div>
      {(prs.length > 0 || met > 0) && (
        <div className="card alert-ok">
          <h3 className="accent">⚡ {t('sum.prs', { n: prs.length })} · {t('sum.targets', { n: met })}</h3>
          {prs.map((it) => <div className="kv" key={it.exId}><span>{exName(EX_BY_ID[it.exId], lang)}</span><b className="mono">e1RM {fmt(toDisplay(bestE1rm(it.sets), unit))}{unit}</b></div>)}
        </div>
      )}
      <div className="card">
        <span className="eyebrow">{t('sum.byMuscle')}</span>
        {VOLUME_GROUPS.filter((g) => groups[g] > 0).map((g) => <div className="kv" key={g}><span>{t(`group.${g}`)}</span><b className="mono">{fmt(groups[g], 1)}</b></div>)}
      </div>
      <div className="card">
        {s.items.map((it) => (
          <div className="kv" key={it.exId}><span className="grow ellipsis">{exName(EX_BY_ID[it.exId], lang)}</span>
            <span className="mono small muted">{it.sets.map((x) => `${fmt(toDisplay(x.kg, unit))}×${x.reps}@${RIR_LABEL(x.rir)}`).join(' ')}</span></div>
        ))}
      </div>
      <div className="bottom-cta"><button className="btn primary lg block" onClick={() => go('')}>{t('common.done')}</button></div>
    </div>
  );
}
