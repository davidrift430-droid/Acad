// Before/after progress photos stored on-device (IndexedDB), with a draggable comparison slider.
import { useEffect, useRef, useState } from 'react';
import { setState, uid, useStore } from '../db/store';
import { idbDel, idbGet, idbSet } from '../db/idb';
import { isoDate, movingAverage } from '../core/body';
import type { PhotoMeta, Pose } from '../core/types';
import { useLang, useT } from '../i18n';
import { Icon, fmt, fmtDate, go, toDisplay, toast } from '../ui/kit';

/** Downscale to 1280 px JPEG so hundreds of photos fit on the device. */
async function compress(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b ?? file), 'image/jpeg', 0.82));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function usePhotoUrl(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    if (id) void idbGet<Blob>('blobs', `photo:${id}`).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } });
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url;
}

function Thumb({ p, selected, onClick }: { p: PhotoMeta; selected: boolean; onClick: () => void }) {
  const url = usePhotoUrl(p.id);
  const lang = useLang();
  return (
    <button className={selected ? 'sel' : ''} onClick={onClick}>
      {url && <img src={url} alt="" />}
      <span className="cap">{fmtDate(p.date, lang, { day: '2-digit', month: 'short', year: '2-digit' })}{p.kg ? ` · ${fmt(p.kg, 1)}kg` : ''}</span>
    </button>
  );
}

function Compare({ a, b }: { a: PhotoMeta; b: PhotoMeta }) {
  const t = useT();
  const lang = useLang();
  const unit = useStore((s) => s.settings.unit);
  const ua = usePhotoUrl(a.id);
  const ub = usePhotoUrl(b.id);
  const [split, setSplit] = useState(50);
  const days = Math.round((Date.parse(b.date) - Date.parse(a.date)) / 86400000);
  return (
    <div className="card">
      <div className="compare" style={{ ['--split' as string]: `${split}%` }}>
        {ua && <img src={ua} alt={t('photos.before')} />}
        {ub && <img className="after" src={ub} alt={t('photos.after')} />}
        <div className="handle-line" />
        <span className="tag" style={{ left: 10 }}>{t('photos.before')} · {fmtDate(a.date, lang)}</span>
        <span className="tag" style={{ right: 10 }}>{t('photos.after')} · {fmtDate(b.date, lang)}</span>
        <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} aria-label={t('photos.slider')} />
      </div>
      <div className="grid-3">
        <div><span className="eyebrow">{t('photos.days')}</span><div className="mono bold" style={{ fontSize: 20 }}>{days}</div></div>
        <div><span className="eyebrow">{t('photos.before')}</span><div className="mono bold" style={{ fontSize: 20 }}>{a.kg ? fmt(toDisplay(a.kg, unit)) : '—'}</div></div>
        <div><span className="eyebrow">Δ</span><div className="mono bold accent" style={{ fontSize: 20 }}>{a.kg && b.kg ? `${b.kg - a.kg > 0 ? '+' : ''}${fmt(toDisplay(b.kg - a.kg, unit))}` : '—'}</div></div>
      </div>
    </div>
  );
}

export function PhotosScreen() {
  const t = useT();
  const photos = useStore((s) => s.photos);
  const weighIns = useStore((s) => s.weighIns);
  const [pose, setPose] = useState<Pose>('front');
  const [sel, setSel] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = photos.filter((p) => p.pose === pose).sort((a, b) => a.date.localeCompare(b.date));
  const chosen = sel.map((id) => photos.find((p) => p.id === id)).filter((p): p is PhotoMeta => !!p).sort((a, b) => a.date.localeCompare(b.date));
  const compare = chosen.length === 2 ? chosen : list.length >= 2 ? [list[0]!, list[list.length - 1]!] : null;

  const add = async (file: File | undefined) => {
    if (!file) return;
    const id = uid();
    const blob = await compress(file);
    await idbSet('blobs', `photo:${id}`, blob);
    const kg = movingAverage(weighIns).at(-1)?.ma;
    setState((s) => { s.photos.push({ id, date: isoDate(Date.now()), pose, ...(kg ? { kg } : {}) }); });
    toast(t('photos.saved'));
  };

  return (
    <div className="screen">
      <div className="topbar"><button className="icon-btn" onClick={() => history.back()} aria-label="back"><Icon name="back" /></button><h1>{t('nav.photos')}</h1></div>
      <div className="seg">{(['front', 'side', 'back'] as Pose[]).map((p) => <button key={p} className={pose === p ? 'on' : ''} onClick={() => { setPose(p); setSel([]); }}>{t(`pose.${p}`)}</button>)}</div>
      <input ref={fileRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => { void add(e.target.files?.[0]); e.target.value = ''; }} />
      <button className="btn primary block" onClick={() => fileRef.current?.click()}><Icon name="camera" size={18} />{t('photos.add')}</button>
      <p className="tiny muted">{t('photos.tip')}</p>
      {compare && <Compare a={compare[0]!} b={compare[1]!} />}
      {list.length > 0 ? (
        <>
          <span className="eyebrow">{t('photos.pick')}</span>
          <div className="photo-grid">
            {[...list].reverse().map((p) => (
              <Thumb key={p.id} p={p} selected={sel.includes(p.id)} onClick={() => setSel((s) => (s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id].slice(-2)))} />
            ))}
          </div>
          {sel.length > 0 && (
            <button className="btn ghost block" style={{ color: 'var(--danger)' }} onClick={async () => {
              for (const id of sel) await idbDel('blobs', `photo:${id}`);
              setState((s) => { s.photos = s.photos.filter((p) => !sel.includes(p.id)); });
              setSel([]);
            }}><Icon name="trash" size={18} />{t('photos.delete', { n: sel.length })}</button>
          )}
        </>
      ) : <div className="card center"><Icon name="photo" size={32} /><p className="small muted">{t('photos.empty')}</p></div>}
      <button className="btn ghost" onClick={() => go('lab/body')}>{t('nav.body')}</button>
    </div>
  );
}
