// Hypertrophy Lab: weekly hard-set volume vs MEV/MAV/MRV, body heat map, bodyweight moving average,
// lean-bulk guardian, stagnation alarm, strength (e1RM) and session history.
import { useMemo, useState } from 'react';
import { setState, useStore } from '../db/store';
import { EX_BY_ID, exName } from '../data';
import { GROUP_OF, LANDMARKS, VOLUME_GROUPS, bestE1rm, hardSetsByGroup, isHardSet, weekStart, zoneOf, type VolumeGroup } from '../core/training';
import { isoDate, leanBulkReport, movingAverage, stagnationAlarm, weeklyAverages } from '../core/body';
import type { MuscleId } from '../core/types';
import { useLang, useT } from '../i18n';
import { BodyMap } from '../ui/BodyMap';
import { BarChart, LineChart, VolumeLegend, VolumeTracks } from '../ui/charts';
import { Icon, fmt, fmtDate, fromDisplay, go, toDisplay, toast } from '../ui/kit';

const DAY = 86400000;
const ZONE_FILL = { below: 'var(--faint)', mev: 'var(--info)', mav: 'var(--accent)', high: 'var(--warn)', over: 'var(--danger)' } as const;

export function LabScreen({ tab: initial }: { tab?: string }) {
  const t = useT();
  const [tab, setTab] = useState(initial ?? 'volume');
  return (
    <div className="screen">
      <div className="topbar"><h1>{t('tab.lab')}</h1></div>
      <div className="seg">
        {(['volume', 'body', 'strength', 'history'] as const).map((k) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t(`lab.tab.${k}`)}</button>
        ))}
      </div>
      {tab === 'volume' && <Volume />}
      {tab === 'body' && <Body />}
      {tab === 'strength' && <Strength />}
      {tab === 'history' && <History />}
    </div>
  );
}

function Volume() {
  const t = useT();
  const sessions = useStore((s) => s.sessions);
  const [offset, setOffset] = useState(0);
  const from = weekStart() - offset * 7 * DAY;
  const sets = useMemo(() => hardSetsByGroup(sessions, EX_BY_ID, from, from + 7 * DAY), [sessions, from]);
  const labels = Object.fromEntries(VOLUME_GROUPS.map((g) => [g, t(`group.${g}`)])) as Record<VolumeGroup, string>;
  const colors: Partial<Record<MuscleId, string>> = {};
  (Object.keys(GROUP_OF) as MuscleId[]).forEach((m) => {
    const g = GROUP_OF[m];
    if (g && sets[g] > 0) colors[m] = ZONE_FILL[zoneOf(sets[g], LANDMARKS[g])];
  });
  const over = VOLUME_GROUPS.filter((g) => zoneOf(sets[g], LANDMARKS[g]) === 'over');
  const below = VOLUME_GROUPS.filter((g) => g !== 'forearms' && g !== 'traps' && g !== 'abdominals' && zoneOf(sets[g], LANDMARKS[g]) === 'below');
  const total = VOLUME_GROUPS.reduce((a, g) => a + sets[g], 0);
  const junk = sessions.filter((s) => (s.endedAt ?? 0) >= from && (s.endedAt ?? 0) < from + 7 * DAY)
    .reduce((a, s) => a + s.items.reduce((b, it) => b + it.sets.filter((x) => x.done && !isHardSet(x)).length, 0), 0);

  return (
    <>
      <div className="row between">
        <button className="icon-btn" onClick={() => setOffset(offset + 1)} aria-label="previous week"><Icon name="back" size={18} /></button>
        <div className="col gap-0 center"><span className="eyebrow">{offset === 0 ? t('lab.thisWeek') : t('lab.weeksAgo', { n: offset })}</span>
          <span className="big-num" style={{ fontSize: 28 }}>{fmt(total, 1)} <span className="muted" style={{ fontSize: 13 }}>{t('lab.hardSets')}</span></span></div>
        <button className="icon-btn" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 1))} aria-label="next week"><Icon name="chevron" size={18} /></button>
      </div>
      {over.length > 0 && (
        <div className="card alert-danger">
          <h3 className="danger"><Icon name="alert" size={18} /> {t('lab.mrvAlert')}</h3>
          <p className="small muted">{t('lab.mrvAlertD', { groups: over.map((g) => labels[g]).join(', ') })}</p>
        </div>
      )}
      <div className="card">
        <BodyMap colors={colors} labels={[t('body.front'), t('body.back')]} />
        <VolumeLegend t={t} />
      </div>
      <div className="card">
        <div className="row between"><span className="eyebrow">{t('lab.volumeTitle')}</span><span className="tiny faint">MEV · MAV · MRV</span></div>
        <VolumeTracks sets={sets} labels={labels} />
        <p className="tiny muted">{t('lab.volumeNote')}</p>
      </div>
      {(below.length > 0 || junk > 0) && (
        <div className="card alert-warn">
          {below.length > 0 && <p className="small"><b className="warn">{t('lab.belowMev')}:</b> {below.map((g) => labels[g]).join(', ')}</p>}
          {junk > 0 && <p className="small"><b className="warn">{t('lab.junk', { n: junk })}</b> {t('lab.junkD')}</p>}
        </div>
      )}
    </>
  );
}

function Body() {
  const t = useT();
  const lang = useLang();
  const unit = useStore((s) => s.settings.unit);
  const weighIns = useStore((s) => s.weighIns);
  const level = useStore((s) => s.profile?.level ?? 2);
  const sessions = useStore((s) => s.sessions);
  const [val, setVal] = useState('');
  const pts = useMemo(() => movingAverage(weighIns), [weighIns]);
  const report = useMemo(() => leanBulkReport(weighIns, level), [weighIns, level]);
  const alarm = useMemo(() => {
    const weekly = weeklyAverages(weighIns, weekStart);
    const comp = sessions.flatMap((s) => s.items.filter((i) => EX_BY_ID[i.exId]?.mech === 'c' && (EX_BY_ID[i.exId]?.cns ?? 1) >= 2)
      .map((i) => ({ exId: i.exId, at: s.endedAt ?? s.startedAt, e1rm: bestE1rm(i.sets) })));
    return stagnationAlarm(weekly, comp);
  }, [weighIns, sessions]);
  const today = isoDate(Date.now());
  const last = pts.at(-1);

  const save = () => {
    const v = parseFloat(val.replace(',', '.'));
    if (!v || v < 25 || v > 400 * (unit === 'lb' ? 2.2 : 1)) { toast(t('body.invalid')); return; }
    const kg = Math.round(fromDisplay(v, unit) * 100) / 100;
    setState((s) => { s.weighIns = [...s.weighIns.filter((w) => w.date !== today), { date: today, kg }]; });
    setVal('');
    toast(t('body.saved'));
  };

  return (
    <>
      <div className="card">
        <span className="eyebrow">{t('body.weighIn')}</span>
        <div className="row">
          <input className="input mono grow" style={{ fontSize: 22, fontWeight: 800 }} inputMode="decimal" placeholder={last ? String(toDisplay(last.kg, unit)) : unit}
            value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
          <button className="btn primary" onClick={save}>{t('common.save')}</button>
        </div>
        <span className="tiny muted">{t('body.weighInD')}</span>
      </div>

      <div className="grid-3">
        <div className="card tight"><span className="eyebrow">{t('body.ma7')}</span><span className="big-num" style={{ fontSize: 24 }}>{last ? fmt(toDisplay(last.ma, unit)) : '—'}</span><span className="tiny muted">{unit}</span></div>
        <div className="card tight"><span className="eyebrow">{t('lab.rate')}</span>
          <span className={`big-num ${report.status === 'on_target' ? 'accent' : report.status === 'fast' ? 'warn' : ''}`} style={{ fontSize: 24 }}>{report.ratePct == null ? '—' : `${report.ratePct > 0 ? '+' : ''}${fmt(report.ratePct, 2)}`}</span>
          <span className="tiny muted">% / {t('common.week')}</span></div>
        <div className="card tight"><span className="eyebrow">{t('body.kgWeek')}</span><span className="big-num" style={{ fontSize: 24 }}>{report.kgPerWeek == null ? '—' : fmt(toDisplay(report.kgPerWeek, unit), 2)}</span><span className="tiny muted">{unit} / {t('common.week')}</span></div>
      </div>

      <div className="card">
        <div className="row between"><span className="eyebrow">{t('body.chart')}</span>
          <span className="tiny muted"><span style={{ color: 'var(--muted)' }}>┄ {t('body.daily')}</span> · <span className="accent">━ {t('body.ma7')}</span></span></div>
        {pts.length >= 2 ? (
          <LineChart unit={unit}
            raw={pts.slice(-30).map((p) => ({ label: '', value: toDisplay(p.kg, unit) ?? 0 }))}
            smooth={pts.slice(-30).map((p) => ({ label: fmtDate(p.date, lang, { day: '2-digit', month: '2-digit' }), value: toDisplay(p.ma, unit) ?? 0 }))} />
        ) : <p className="small muted">{t('body.needMore')}</p>}
      </div>

      <div className={`card ${report.status === 'on_target' ? 'alert-ok' : report.status === 'fast' ? 'alert-warn' : report.status === 'insufficient' ? '' : 'alert-warn'}`}>
        <span className="eyebrow">{t('bulk.guardian')}</span>
        <h3 className={report.status === 'on_target' ? 'accent' : report.status === 'insufficient' ? '' : 'warn'}>{t(`bulk.${report.status}`)}</h3>
        <p className="small muted">{t('bulk.target', { lo: report.targetLow, hi: report.targetHigh })}</p>
        {report.kcalAdjust !== 0 && <p className="small"><b>{t('bulk.adjust', { kcal: `${report.kcalAdjust > 0 ? '+' : ''}${report.kcalAdjust}` })}</b></p>}
      </div>

      {alarm.fired && (
        <div className="card alert-danger">
          <h3 className="danger"><Icon name="alert" size={18} /> {t('alarm.title')}</h3>
          <p className="small">{t('alarm.text')}</p>
        </div>
      )}
      {!alarm.fired && alarm.reason !== 'insufficient' && <p className="tiny muted">✓ {t(`alarm.${alarm.reason}`)}</p>}

      <button className="btn secondary block" onClick={() => go('photos')}><Icon name="photo" size={18} />{t('nav.photos')}</button>
    </>
  );
}

function Strength() {
  const t = useT();
  const lang = useLang();
  const unit = useStore((s) => s.settings.unit);
  const sessions = useStore((s) => s.sessions);
  const prs = useMemo(() => {
    const m = new Map<string, { e: number; at: number; kg: number; reps: number }>();
    for (const s of sessions) for (const it of s.items) for (const x of it.sets) {
      if (!x.done || !x.kg || !x.reps) continue;
      const e = bestE1rm([x]);
      const cur = m.get(it.exId);
      if (!cur || e > cur.e) m.set(it.exId, { e, at: s.endedAt ?? s.startedAt, kg: x.kg, reps: x.reps });
    }
    return [...m.entries()].sort((a, b) => b[1].e - a[1].e);
  }, [sessions]);
  const ws = weekStart();
  const tonnage = Array.from({ length: 8 }, (_, i) => {
    const from = ws - (7 - i) * 7 * DAY;
    const v = sessions.filter((s) => (s.endedAt ?? 0) >= from && (s.endedAt ?? 0) < from + 7 * DAY)
      .reduce((a, s) => a + s.items.reduce((b, it) => b + it.sets.reduce((c, x) => c + (x.kg ?? 0) * (x.reps ?? 0), 0), 0), 0);
    return { label: fmtDate(from, lang, { day: '2-digit', month: '2-digit' }), value: Math.round((toDisplay(v, unit) ?? 0) / 100) / 10 };
  });
  if (!sessions.length) return <Empty />;
  return (
    <>
      <div className="card"><span className="eyebrow">{t('lab.tonnage')} ({unit === 'kg' ? 't' : 'k lb'})</span><BarChart data={tonnage} /></div>
      <div className="card">
        <span className="eyebrow">{t('lab.prs')}</span>
        {prs.slice(0, 20).map(([id, r]) => (
          <div key={id} className="kv small" onClick={() => go(`ex/${encodeURIComponent(id)}`)} role="button">
            <span className="grow ellipsis">{exName(EX_BY_ID[id], lang)}</span>
            <span className="mono"><b className="accent">{fmt(toDisplay(r.e, unit))}</b> <span className="faint">({fmt(toDisplay(r.kg, unit))}×{r.reps})</span></span>
          </div>
        ))}
      </div>
    </>
  );
}

function History() {
  const t = useT();
  const lang = useLang();
  const sessions = useStore((s) => s.sessions);
  if (!sessions.length) return <Empty />;
  return (
    <div>
      {sessions.slice(0, 100).map((s) => (
        <div key={s.id} className="list-row" onClick={() => go(`summary/${s.id}`)} role="button">
          <div className="index" style={{ width: 44, height: 44, flexDirection: 'column', fontSize: 14 }}>
            {new Date(s.endedAt ?? s.startedAt).getDate()}<span className="tiny">{fmtDate(s.endedAt ?? s.startedAt, lang, { month: 'short' })}</span>
          </div>
          <div className="grow col gap-4"><b className="ellipsis">{s.name}</b>
            <span className="tiny muted">{Math.round(((s.endedAt ?? s.startedAt) - s.startedAt) / 60000)} min · {s.items.reduce((a, it) => a + it.sets.filter(isHardSet).length, 0)} {t('lab.hardSets')}</span></div>
          <button className="icon-btn ghost" aria-label="delete" onClick={(e) => { e.stopPropagation(); if (window.confirm?.(t('lab.deleteQ')) ?? true) setState((st) => { st.sessions = st.sessions.filter((x) => x.id !== s.id); }); }}>
            <Icon name="trash" size={18} /></button>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  const t = useT();
  return <div className="card center"><Icon name="lab" size={32} /><h3>{t('lab.empty')}</h3><p className="small muted">{t('lab.emptyD')}</p></div>;
}
