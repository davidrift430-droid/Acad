// Exercise library, detail page, execution player, personal execution video and exercise picker.
import { useEffect, useMemo, useRef, useState } from 'react';
import { EXERCISES, EX_BY_ID, EQUIPMENT, MUSCLES, exImg, exName, searchExercises } from '../data';
import { setState, uid, useStore } from '../db/store';
import { idbDel, idbGet, idbSet } from '../db/idb';
import { bestE1rm } from '../core/training';
import type { Exercise, MuscleId } from '../core/types';
import { useLang, useT } from '../i18n';
import { BodyMap, exerciseColors } from '../ui/BodyMap';
import { LineChart } from '../ui/charts';
import { Icon, Sheet, fmt, fmtDate, go, toDisplay, toast } from '../ui/kit';

// ───────── Execution player: start ↔ end frames with speed control ─────────

export function ExercisePlayer({ ex }: { ex: Exercise }) {
  const t = useT();
  const [frame, setFrame] = useState<0 | 1>(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<'demo' | 'mine'>('demo');
  const videoKey = useStore((s) => s.videos[ex.id]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!playing || tab !== 'demo') return;
    const i = setInterval(() => setFrame((f) => (f ? 0 : 1)), 1200 / speed);
    return () => clearInterval(i);
  }, [playing, speed, tab]);

  useEffect(() => {
    let url: string | null = null;
    if (videoKey) void idbGet<Blob>('blobs', videoKey).then((b) => { if (b) { url = URL.createObjectURL(b); setVideoUrl(url); } });
    else setVideoUrl(null);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [videoKey]);

  const onVideo = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) { toast(t('ex.videoTooBig')); return; }
    const key = `video:${ex.id}:${uid()}`;
    await idbSet('blobs', key, file);
    if (videoKey) await idbDel('blobs', videoKey);
    setState((s) => { s.videos[ex.id] = key; });
    setTab('mine');
    toast(t('ex.videoSaved'));
  };

  return (
    <div className="col">
      <div className="seg">
        <button className={tab === 'demo' ? 'on' : ''} onClick={() => setTab('demo')}>{t('ex.demo')}</button>
        <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>{t('ex.myVideo')}</button>
      </div>
      {tab === 'demo' ? (
        <div className="media" onClick={() => { if (!playing) setFrame((f) => (f ? 0 : 1)); }}>
          <img src={exImg(ex.id, 0)} alt={t('ex.start')} />
          <img className={`f1 ${frame ? 'show' : ''}`} src={exImg(ex.id, 1)} alt={t('ex.end')} />
          <span className="phase">{frame ? t('ex.end') : t('ex.start')}</span>
          <div className="bar" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'pause' : 'play'}><Icon name={playing ? 'pause' : 'play'} size={14} /></button>
            {[0.5, 1, 2].map((v) => <button key={v} className={speed === v ? 'on' : ''} onClick={() => setSpeed(v)}>{v}×</button>)}
            <span className="grow" />
            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.n + ' exercise form')}`} target="_blank" rel="noreferrer">
              <button><Icon name="video" size={14} /> YT</button>
            </a>
          </div>
        </div>
      ) : (
        <div className="col">
          {videoUrl ? <div className="media" style={{ aspectRatio: 'auto' }}><video src={videoUrl} controls playsInline loop /></div>
            : <div className="card center"><Icon name="video" size={32} /><p className="muted small">{t('ex.myVideoEmpty')}</p></div>}
          <input ref={fileRef} type="file" accept="video/*" capture="environment" hidden onChange={(e) => void onVideo(e.target.files?.[0])} />
          <div className="row">
            <button className="btn secondary grow" onClick={() => fileRef.current?.click()}><Icon name="camera" size={18} />{videoUrl ? t('ex.replaceVideo') : t('ex.recordVideo')}</button>
            {videoKey && <button className="btn ghost" onClick={async () => { await idbDel('blobs', videoKey); setState((s) => { delete s.videos[ex.id]; }); }}><Icon name="trash" size={18} /></button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────── Detail content (used by screen and sheet) ─────────

function Detail({ ex }: { ex: Exercise }) {
  const t = useT();
  const lang = useLang();
  const unit = useStore((s) => s.settings.unit);
  const sessions = useStore((s) => s.sessions);
  const hist = useMemo(() => sessions.filter((s) => s.items.some((i) => i.exId === ex.id))
    .map((s) => ({ at: s.endedAt ?? s.startedAt, e: bestE1rm(s.items.find((i) => i.exId === ex.id)!.sets), sets: s.items.find((i) => i.exId === ex.id)!.sets }))
    .filter((x) => x.e > 0).reverse(), [sessions, ex.id]);
  const pt = lang === 'pt' && ex.pt;
  const steps = pt ? ex.pt!.st : ex.ins;
  const best = hist.reduce((b, h) => Math.max(b, h.e), 0);
  return (
    <div className="col gap-16">
      <ExercisePlayer ex={ex} />
      <div className="row wrap gap-4">
        <span className={`pill ${ex.peak === 'L' ? 'accent' : ''}`}>{t('meta.peak')}: {t(`peak.${ex.peak}`)}</span>
        <span className="pill">{t('meta.profile')}: {t(`profile.${ex.profile}`)}</span>
        <span className={`pill ${ex.cns === 3 ? 'warn' : ''}`}>{t('meta.cns')}: {t(`cns.${ex.cns}`)}</span>
        {ex.mech && <span className="pill">{t(ex.mech === 'c' ? 'meta.compound' : 'meta.isolation')}</span>}
        <span className="pill">{t(`eq.${ex.eq}`)}</span>
        <span className="pill">{t(`level.${ex.lv}`)}</span>
        {ex.star ? <span className="pill solid">★ {t('meta.stretch')}</span> : null}
        {ex.est ? <span className="pill" title={t('meta.estimatedD')}>~ {t('meta.estimated')}</span> : null}
      </div>
      <div className="card">
        <span className="eyebrow">{t('ex.muscles')}</span>
        <div className="muscle-title">{ex.pm.map((m) => t(`muscle.${m}`)).join(' · ')}</div>
        <BodyMap colors={exerciseColors(ex.pm, ex.sm)} labels={[t('body.front'), t('body.back')]} />
        <div className="row wrap gap-4">
          {ex.pm.map((m) => <span key={m} className="pill danger">● {t(`muscle.${m}`)}</span>)}
          {ex.sm.map((m) => <span key={m} className="pill warn">○ {t(`muscle.${m}`)}</span>)}
        </div>
        <div className="col gap-4">
          <span className="eyebrow">{t('ex.functions')}</span>
          {ex.pm.map((m) => <p key={m} className="small"><b>{t(`muscle.${m}`)}:</b> <span className="muted">{t(`fn.${m}`)}</span></p>)}
        </div>
      </div>
      {ex.star ? <div className="card alert-ok"><p className="small"><b className="accent">★ {t('meta.stretch')}.</b> {t('ex.stretchWhy')}</p></div> : null}
      <div className="card">
        <span className="eyebrow">{t('ex.steps')}</span>
        {!pt && lang !== 'en' && <span className="tiny faint">{t('ex.englishOnly')}</span>}
        <ol className="steps">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>
      {pt && (
        <div className="grid-2">
          <div className="card tight"><span className="eyebrow accent">{t('ex.tips')}</span>{ex.pt!.t.map((s, i) => <p className="small" key={i}>{s}</p>)}</div>
          <div className="card tight"><span className="eyebrow danger">{t('ex.errors')}</span>{ex.pt!.e.map((s, i) => <p className="small" key={i}>{s}</p>)}</div>
        </div>
      )}
      {hist.length > 0 && (
        <div className="card">
          <div className="row between"><span className="eyebrow">{t('ex.history')}</span><span className="pill accent">PR e1RM {fmt(toDisplay(best, unit))}{unit}</span></div>
          <LineChart smooth={hist.slice(-16).map((h) => ({ label: fmtDate(h.at, lang, { day: '2-digit', month: '2-digit' }), value: toDisplay(h.e, unit) ?? 0 }))} unit={unit} />
          {hist.slice(-4).reverse().map((h) => (
            <div className="kv small" key={h.at}><span className="muted">{fmtDate(h.at, lang)}</span>
              <span className="mono">{h.sets.map((s) => `${fmt(toDisplay(s.kg, unit))}×${s.reps}`).join(' · ')}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExerciseScreen({ id }: { id: string }) {
  const lang = useLang();
  const ex = EX_BY_ID[id];
  if (!ex) return <div className="screen"><p className="muted">—</p></div>;
  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => history.back()} aria-label="back"><Icon name="back" /></button>
        <h2>{exName(ex, lang)}</h2>
      </div>
      {lang !== 'en' && exName(ex, lang) !== ex.n && <span className="small faint" style={{ marginTop: -8 }}>{ex.n}</span>}
      <Detail ex={ex} />
    </div>
  );
}

export function ExerciseSheet({ exId, onClose }: { exId: string | null; onClose: () => void }) {
  const lang = useLang();
  const ex = exId ? EX_BY_ID[exId] : undefined;
  return (
    <Sheet open={!!ex} onClose={onClose}>
      {ex && <>
        <div className="row between"><h2>{exName(ex, lang)}</h2><button className="icon-btn ghost" onClick={onClose} aria-label="close"><Icon name="x" /></button></div>
        <Detail ex={ex} />
      </>}
    </Sheet>
  );
}

// ───────── Filters + list ─────────

function useFiltered(q: string, muscle: MuscleId | '', eq: string, stretch: boolean, exclude: string[] = []) {
  return useMemo(() => searchExercises(q, { muscle, eq, stretch }).filter((e) => !exclude.includes(e.id)), [q, muscle, eq, stretch, exclude]);
}

function Filters({ q, setQ, muscle, setMuscle, eq, setEq, stretch, setStretch }: {
  q: string; setQ: (v: string) => void; muscle: MuscleId | ''; setMuscle: (m: MuscleId | '') => void;
  eq: string; setEq: (v: string) => void; stretch: boolean; setStretch: (v: boolean) => void;
}) {
  const t = useT();
  return (
    <div className="col gap-12">
      <div className="search"><Icon name="search" size={18} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('lib.search')} /></div>
      <div className="chips">
        <button className={`chip ${stretch ? 'on' : ''}`} onClick={() => setStretch(!stretch)}>★ {t('meta.stretch')}</button>
        <button className={`chip ${!muscle ? 'on' : ''}`} onClick={() => setMuscle('')}>{t('lib.allMuscles')}</button>
        {MUSCLES.map((m) => <button key={m} className={`chip ${muscle === m ? 'on' : ''}`} onClick={() => setMuscle(m)}>{t(`muscle.${m}`)}</button>)}
      </div>
      <div className="chips">
        <button className={`chip ${!eq ? 'on' : ''}`} onClick={() => setEq('')}>{t('lib.allEquipment')}</button>
        {EQUIPMENT.map((e) => <button key={e} className={`chip ${eq === e ? 'on' : ''}`} onClick={() => setEq(e)}>{t(`eq.${e}`)}</button>)}
      </div>
    </div>
  );
}

function Row({ ex, onClick, trailing }: { ex: Exercise; onClick: () => void; trailing?: React.ReactNode }) {
  const t = useT();
  const lang = useLang();
  return (
    <div className="list-row" onClick={onClick} role="button">
      <img className="thumb" src={exImg(ex.id, 1)} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
      <div className="grow col gap-4">
        <b className="ellipsis">{ex.star ? <span className="accent">★ </span> : null}{exName(ex, lang)}</b>
        <span className="tiny muted ellipsis">{ex.pm.map((m) => t(`muscle.${m}`)).join(', ')} · {t(`eq.${ex.eq}`)} · {t('meta.peak')} {t(`peak.${ex.peak}`)}</span>
      </div>
      {trailing}
    </div>
  );
}

function useIncremental<T>(list: T[], step = 40) {
  const [n, setN] = useState(step);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setN(step), [list, step]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) setN((x) => x + step); }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [list, step]);
  return { visible: list.slice(0, n), sentinel: <div ref={ref} style={{ height: 1 }} /> };
}

export function LibraryScreen() {
  const t = useT();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<MuscleId | ''>('');
  const [eq, setEq] = useState('');
  const [stretch, setStretch] = useState(false);
  const list = useFiltered(q, muscle, eq, stretch);
  const { visible, sentinel } = useIncremental(list);
  return (
    <div className="screen">
      <div className="topbar"><h1>{t('tab.library')}</h1><span className="pill">{list.length} / {EXERCISES.length}</span></div>
      <Filters {...{ q, setQ, muscle, setMuscle, eq, setEq, stretch, setStretch }} />
      <div>{visible.map((ex) => <Row key={ex.id} ex={ex} onClick={() => go(`ex/${encodeURIComponent(ex.id)}`)} />)}{sentinel}</div>
      {!list.length && <p className="muted center">{t('lib.none')}</p>}
    </div>
  );
}

export function Picker({ open, title, muscle: initialMuscle, exclude, onPick, onClose }: {
  open: boolean; title: string; muscle?: MuscleId | undefined; exclude: string[]; onPick: (id: string) => void; onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<MuscleId | ''>(initialMuscle ?? '');
  const [eq, setEq] = useState('');
  const [stretch, setStretch] = useState(false);
  useEffect(() => { if (open) { setMuscle(initialMuscle ?? ''); setQ(''); } }, [open, initialMuscle]);
  const list = useFiltered(q, muscle, eq, stretch, exclude);
  const { visible, sentinel } = useIncremental(list, 30);
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="row between"><h2>{title}</h2><button className="icon-btn ghost" onClick={onClose} aria-label="close"><Icon name="x" /></button></div>
      <Filters {...{ q, setQ, muscle, setMuscle, eq, setEq, stretch, setStretch }} />
      <div>{visible.map((ex) => <Row key={ex.id} ex={ex} onClick={() => onPick(ex.id)} trailing={<Icon name="plus" />} />)}{sentinel}</div>
    </Sheet>
  );
}
