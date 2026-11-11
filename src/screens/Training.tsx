// Today (opens straight into the scheduled session), programs list and program editor.
import { useMemo, useState } from 'react';
import { activeProgram, nextDay, setState, uid, useStore } from '../db/store';
import { EX_BY_ID, exImg, exName } from '../data';
import { generateProgram, projectedVolume } from '../core/generator';
import { LANDMARKS, hardSetsByGroup, mesoWeek, weekStart, zoneOf, type VolumeGroup, VOLUME_GROUPS } from '../core/training';
import { leanBulkReport } from '../core/body';
import type { Program } from '../core/types';
import { useLang, useT, type T } from '../i18n';
import { VolumeTracks } from '../ui/charts';
import { Icon, Sheet, fmt, go, toast } from '../ui/kit';
import { Logger, startSession } from './Logger';
import { ExerciseSheet, Picker } from './Library';

export const programName = (p: Program, t: T) => (p.name.startsWith('split.') ? t(p.name) : p.name);
const dayFocus = (focus: string | undefined, t: T) => (focus?.startsWith('day.') ? t(focus) : focus ?? '');
export const dayLabel = (d: { name: string; focus?: string }, t: T) => (d.focus ? `${d.name} · ${dayFocus(d.focus, t)}` : d.name);

export function TodayScreen() {
  const active = useStore((s) => s.active);
  if (active) return <Logger />;
  return <Today />;
}

function Today() {
  const t = useT();
  const lang = useLang();
  const state = useStore((s) => s);
  const program = activeProgram(state);
  const day = nextDay(state);
  const meso = program ? mesoWeek(program.mesoStart, program.mesoWeeks) : null;
  const ws = weekStart();
  const week = useMemo(() => hardSetsByGroup(state.sessions, EX_BY_ID, ws, ws + 7 * 86400000), [state.sessions, ws]);
  const over = VOLUME_GROUPS.filter((g) => zoneOf(week[g], LANDMARKS[g]) === 'over');
  const bulk = leanBulkReport(state.weighIns, state.profile?.level ?? 2);
  const sessionsThisWeek = state.sessions.filter((s) => (s.endedAt ?? 0) >= ws).length;

  return (
    <div className="screen">
      <div className="row between">
        <span className="wordmark">BLACK <b>IRON</b></span>
        <button className="icon-btn" onClick={() => go('more')} aria-label={t('tab.more')}><Icon name="gear" size={20} /></button>
      </div>

      {day && program ? (
        <div className="hero">
          <div className="grid-bg" />
          <div className="row between">
            <span className="pill accent">{meso?.deload ? t('log.deloadWeek') : t('log.week', { w: meso?.week ?? 1 })} / {program.mesoWeeks}</span>
            <span className="pill">RIR {meso?.deload ? '4+' : meso?.rir}</span>
          </div>
          <div className="col gap-4">
            <span className="eyebrow">{t('today.next')}</span>
            <h1 style={{ fontSize: 32 }}>{dayLabel(day, t)}</h1>
            <span className="muted small">{day.items.length} {t('common.exercises')} · {day.items.reduce((a, i) => a + i.sets, 0)} {t('common.sets')}</span>
          </div>
          <div className="col gap-4">
            {day.items.slice(0, 8).map((it, i) => (
              <div key={i} className="row small">
                <span className="index">{i + 1}</span>
                <span className="grow ellipsis">{exName(EX_BY_ID[it.exId], lang)}</span>
                <span className="mono muted">{it.sets}×{it.repMin}-{it.repMax}</span>
              </div>
            ))}
          </div>
          <button className="btn primary lg block" onClick={() => { startSession(program, day, dayLabel(day, t)); }}>
            <Icon name="play" size={18} /> {t('today.start')}
          </button>
        </div>
      ) : (
        <div className="hero">
          <div className="grid-bg" />
          <h2>{t('today.noProgram')}</h2>
          <button className="btn primary block" onClick={() => go('programs')}>{t('today.create')}</button>
        </div>
      )}

      {over.length > 0 && (
        <div className="card alert-danger">
          <h3 className="danger"><Icon name="alert" size={18} /> {t('lab.mrvAlert')}</h3>
          <p className="small muted">{t('lab.mrvAlertD', { groups: over.map((g) => t(`group.${g}`)).join(', ') })}</p>
        </div>
      )}

      <div className="grid-2">
        <button className="card tight click" style={{ textAlign: 'left' }} onClick={() => go('lab')}>
          <span className="eyebrow">{t('today.thisWeek')}</span>
          <span className="big-num" style={{ fontSize: 30 }}>{sessionsThisWeek}<span className="muted" style={{ fontSize: 16 }}>/{state.profile?.daysPerWeek ?? 4}</span></span>
          <span className="tiny muted">{t('today.sessions')}</span>
        </button>
        <button className="card tight click" style={{ textAlign: 'left' }} onClick={() => go('lab/body')}>
          <span className="eyebrow">{t('lab.rate')}</span>
          <span className={`big-num ${bulk.status === 'on_target' ? 'accent' : bulk.status === 'fast' ? 'warn' : ''}`} style={{ fontSize: 30 }}>{bulk.ratePct == null ? '—' : `${bulk.ratePct > 0 ? '+' : ''}${fmt(bulk.ratePct, 2)}%`}</span>
          <span className="tiny muted">{t(`bulk.${bulk.status}`)}</span>
        </button>
      </div>

      <div className="grid-2">
        <button className="btn secondary" onClick={() => go('programs')}><Icon name="grid" size={18} />{t('nav.programs')}</button>
        <button className="btn secondary" onClick={() => { startSession(null, null, t('today.free')); }}><Icon name="plus" size={18} />{t('today.free')}</button>
      </div>
    </div>
  );
}

// ───────── Programs ─────────

export function ProgramsScreen() {
  const t = useT();
  const lang = useLang();
  const programs = useStore((s) => s.programs);
  const activeId = useStore((s) => activeProgram(s)?.id);
  const profile = useStore((s) => s.profile);
  const [why, setWhy] = useState<Program | null>(null);

  const regenerate = () => {
    if (!profile) return;
    const p = generateProgram(profile, EX_BY_ID, uid);
    setState((s) => { s.programs.unshift(p); s.activeProgramId = p.id; });
    toast(t('prog.generated'));
  };
  const create = () => {
    const p: Program = { id: uid(), name: t('prog.myProgram'), createdAt: Date.now(), generated: false, days: [{ id: uid(), name: 'A', items: [] }], mesoWeeks: 5, mesoStart: Date.now() };
    setState((s) => { s.programs.unshift(p); });
    go(`program/${p.id}`);
  };

  return (
    <div className="screen">
      <div className="topbar"><button className="icon-btn" onClick={() => go('')} aria-label="back"><Icon name="back" /></button><h1>{t('nav.programs')}</h1></div>
      <div className="grid-2">
        <button className="btn primary" onClick={regenerate}><Icon name="bolt" size={18} />{t('prog.generate')}</button>
        <button className="btn secondary" onClick={create}><Icon name="plus" size={18} />{t('prog.create')}</button>
      </div>
      {programs.map((p) => (
        <div key={p.id} className={`card ${p.id === activeId ? 'alert-ok' : ''}`}>
          <div className="row between">
            <div className="col gap-4 grow">
              {p.id === activeId && <span className="eyebrow accent">{t('prog.active')}</span>}
              <h3>{programName(p, t)}</h3>
              <span className="tiny muted">{p.days.length} {t('prog.days')} · {t('prog.meso', { w: p.mesoWeeks })}</span>
            </div>
            {p.rationale && <button className="icon-btn ghost" onClick={() => setWhy(p)} aria-label="why"><Icon name="info" /></button>}
            <button className="icon-btn ghost" onClick={() => go(`program/${p.id}`)} aria-label="edit"><Icon name="edit" /></button>
          </div>
          {p.days.map((d) => (
            <div key={d.id} className="kv small"><b>{dayLabel(d, t)}</b><span className="muted ellipsis" style={{ maxWidth: '65%' }}>{d.items.map((i) => exName(EX_BY_ID[i.exId], lang)).join(' · ')}</span></div>
          ))}
          <div className="row">
            {p.id !== activeId && <button className="btn secondary sm grow" onClick={() => setState((s) => { s.activeProgramId = p.id; })}>{t('prog.activate')}</button>}
            {p.id !== activeId && <button className="btn ghost sm" onClick={() => setState((s) => { s.programs = s.programs.filter((x) => x.id !== p.id); })}><Icon name="trash" size={16} /></button>}
            {p.id === activeId && <button className="btn secondary sm grow" onClick={() => { setState((s) => { const x = s.programs.find((y) => y.id === p.id); if (x) x.mesoStart = Date.now(); }); toast(t('prog.mesoRestarted')); }}>{t('prog.restartMeso')}</button>}
          </div>
        </div>
      ))}
      <Sheet open={!!why} onClose={() => setWhy(null)}>
        <h2>{t('prog.why')}</h2>
        {why?.rationale?.map((k) => <p key={k} className="small">{t(k)}</p>)}
      </Sheet>
    </div>
  );
}

export function ProgramEditor({ id }: { id: string }) {
  const t = useT();
  const lang = useLang();
  const program = useStore((s) => s.programs.find((p) => p.id === id));
  const [dayIdx, setDayIdx] = useState(0);
  const [picker, setPicker] = useState(false);
  const [howto, setHowto] = useState<string | null>(null);
  const vol = useMemo(() => (program ? projectedVolume(program, EX_BY_ID) : null), [program]);
  if (!program) return <div className="screen"><p className="muted">—</p></div>;
  const day = program.days[dayIdx] ?? program.days[0];
  const edit = (fn: (p: Program) => void) => setState((s) => { const p = s.programs.find((x) => x.id === id); if (p) fn(p); });
  const labels = Object.fromEntries(VOLUME_GROUPS.map((g) => [g, t(`group.${g}`)])) as Record<VolumeGroup, string>;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => go('programs')} aria-label="back"><Icon name="back" /></button>
        <h2>{t('prog.edit')}</h2>
      </div>
      <label className="field"><span>{t('prog.name')}</span>
        <input className="input" value={programName(program, t)} onChange={(e) => edit((p) => { p.name = e.target.value; })} /></label>
      <div className="chips">
        {program.days.map((d, i) => <button key={d.id} className={`chip ${i === dayIdx ? 'on' : ''}`} onClick={() => setDayIdx(i)}>{dayLabel(d, t)}</button>)}
        <button className="chip" onClick={() => { edit((p) => { p.days.push({ id: uid(), name: String.fromCharCode(65 + p.days.length), items: [] }); }); setDayIdx(program.days.length); }}><Icon name="plus" size={14} /></button>
      </div>
      {day && (
        <>
          <div className="row">
            <input className="input grow" value={day.name} onChange={(e) => edit((p) => { p.days[dayIdx]!.name = e.target.value; })} />
            {program.days.length > 1 && <button className="icon-btn" onClick={() => { edit((p) => { p.days.splice(dayIdx, 1); }); setDayIdx(0); }} aria-label="delete day"><Icon name="trash" size={18} /></button>}
          </div>
          {day.items.map((it, i) => {
            const ex = EX_BY_ID[it.exId];
            const set = (k: 'sets' | 'repMin' | 'repMax' | 'restSec', v: string) => edit((p) => { const x = p.days[dayIdx]!.items[i]!; x[k] = Math.max(k === 'restSec' ? 0 : 1, parseInt(v) || 0); });
            return (
              <div key={`${it.exId}${i}`} className="card tight">
                <div className="row">
                  <img className="thumb" src={exImg(it.exId, 1)} alt="" onClick={() => setHowto(it.exId)} />
                  <div className="grow col gap-4"><b className="small">{ex?.star ? '★ ' : ''}{exName(ex, lang)}</b>
                    <span className="tiny muted">{t('meta.peak')} {ex ? t(`peak.${ex.peak}`) : ''} · {t('meta.cns')} {ex ? t(`cns.${ex.cns}`) : ''}</span></div>
                  <div className="col gap-4">
                    <button className="icon-btn ghost" style={{ width: 36, height: 32 }} disabled={i === 0} onClick={() => edit((p) => { const a = p.days[dayIdx]!.items; [a[i - 1], a[i]] = [a[i]!, a[i - 1]!]; })} aria-label="up"><Icon name="up" size={16} /></button>
                    <button className="icon-btn ghost" style={{ width: 36, height: 32 }} onClick={() => edit((p) => { p.days[dayIdx]!.items.splice(i, 1); })} aria-label="remove"><Icon name="trash" size={16} /></button>
                  </div>
                </div>
                <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {(['sets', 'repMin', 'repMax', 'restSec'] as const).map((k) => (
                    <label key={k} className="field"><span style={{ fontSize: 10 }}>{t(`prog.${k}`)}</span>
                      <input className="input mono center" style={{ minHeight: 40, padding: 0 }} inputMode="numeric" value={it[k]} onChange={(e) => set(k, e.target.value)} /></label>
                  ))}
                </div>
              </div>
            );
          })}
          <button className="btn outline block" onClick={() => setPicker(true)}><Icon name="plus" size={18} />{t('log.addExercise')}</button>
        </>
      )}
      {vol && (
        <div className="card">
          <span className="eyebrow">{t('prog.projected')}</span>
          <p className="tiny muted">{t('prog.projectedD')}</p>
          <VolumeTracks sets={vol} labels={labels} />
        </div>
      )}
      <Picker open={picker} title={t('log.addExercise')} exclude={day?.items.map((i) => i.exId) ?? []} onClose={() => setPicker(false)}
        onPick={(exId) => {
          const ex = EX_BY_ID[exId];
          const c = ex?.mech === 'c';
          edit((p) => { p.days[dayIdx]!.items.push({ exId, sets: 3, repMin: c ? 8 : 10, repMax: c ? 12 : 15, restSec: c ? (ex?.cns === 3 ? 180 : 150) : 75 }); });
          setPicker(false);
        }} />
      <ExerciseSheet exId={howto} onClose={() => setHowto(null)} />
    </div>
  );
}
