// More: navigation hub, settings (language, theme, units, sound, haptics), profile, backup, science library.
import { useRef, useState } from 'react';
import { getState, importBackup, resetAll, setState, useStore } from '../db/store';
import { STUDIES } from '../data/science';
import { EXERCISES } from '../data';
import type { Lang, Settings } from '../core/types';
import { useLang, useT } from '../i18n';
import { Icon, Sheet, go, toast } from '../ui/kit';

const IDX: Record<Lang, 0 | 1 | 2> = { pt: 0, en: 1, es: 2 };

export function MoreScreen() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  const profile = useStore((s) => s.profile);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setState((s) => { s.settings[k] = v; });

  const exportBackup = () => {
    const { active, rest, ...data } = getState();
    void active; void rest;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dymo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(t('more.exported'));
  };

  const links: [string, string, string][] = [
    ['grid', 'nav.programs', 'programs'],
    ['photo', 'nav.photos', 'photos'],
    ['flask', 'nav.science', 'science'],
    ['history', 'nav.history', 'lab/history'],
    ['user', 'more.profile', 'onboarding'],
  ];

  return (
    <div className="screen">
      <div className="topbar"><h1>{t('tab.more')}</h1></div>
      <div className="col gap-0">
        {links.map(([icon, label, path]) => (
          <div key={path} className="list-row" role="button" onClick={() => go(path)}>
            <span className="index" style={{ width: 36, height: 36 }}><Icon name={icon} size={18} /></span>
            <b className="grow">{t(label)}</b><Icon name="chevron" size={18} />
          </div>
        ))}
      </div>

      <div className="card">
        <span className="eyebrow">{t('more.settings')}</span>
        <div className="field"><span><Icon name="globe" size={12} /> {t('more.language')}</span>
          <div className="seg">{(['pt', 'en', 'es'] as Lang[]).map((l) => <button key={l} className={settings.lang === l ? 'on' : ''} onClick={() => set('lang', l)}>{l === 'pt' ? 'Português' : l === 'en' ? 'English' : 'Español'}</button>)}</div></div>
        <div className="field"><span>{t('more.theme')}</span>
          <div className="seg">{(['dark', 'light', 'system'] as const).map((v) => <button key={v} className={settings.theme === v ? 'on' : ''} onClick={() => set('theme', v)}>{t(`theme.${v}`)}</button>)}</div></div>
        <div className="field"><span>{t('more.unit')}</span>
          <div className="seg">{(['kg', 'lb'] as const).map((v) => <button key={v} className={settings.unit === v ? 'on' : ''} onClick={() => set('unit', v)}>{v}</button>)}</div></div>
        <div className="kv"><span>{t('more.sound')}</span><input type="checkbox" checked={settings.sound} onChange={(e) => set('sound', e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} /></div>
        <div className="kv"><span>{t('more.haptics')}</span><input type="checkbox" checked={settings.haptics} onChange={(e) => set('haptics', e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} /></div>
      </div>

      <div className="card">
        <span className="eyebrow">{t('more.data')}</span>
        <p className="tiny muted">{t('more.offline')}</p>
        <div className="grid-2">
          <button className="btn secondary" onClick={exportBackup}><Icon name="download" size={18} />{t('more.export')}</button>
          <button className="btn secondary" onClick={() => fileRef.current?.click()}><Icon name="upload" size={18} />{t('more.import')}</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try { toast(importBackup(JSON.parse(await f.text())) ? t('more.imported') : t('more.invalid')); } catch { toast(t('more.invalid')); }
          e.target.value = '';
        }} />
        <button className="btn ghost" style={{ color: 'var(--danger)' }} onClick={() => setConfirmReset(true)}>{t('more.reset')}</button>
      </div>

      <p className="tiny faint center">
        Dymo Training 2.0 · {profile?.name ?? ''}<br />
        {t('more.credits', { n: EXERCISES.length })}<br />
        {t('more.disclaimer')}
      </p>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)}>
        <h2>{t('more.resetQ')}</h2>
        <p className="muted small">{t('more.resetD')}</p>
        <div className="row">
          <button className="btn secondary grow" onClick={() => setConfirmReset(false)}>{t('common.cancel')}</button>
          <button className="btn danger grow" onClick={async () => { await resetAll(); setConfirmReset(false); go('onboarding'); }}>{t('more.reset')}</button>
        </div>
      </Sheet>
    </div>
  );
}

export function ScienceScreen() {
  const t = useT();
  const lang = useLang();
  const i = IDX[lang];
  const [topic, setTopic] = useState<string>('');
  const topics = [...new Set(STUDIES.map((s) => s.topic))];
  const list = STUDIES.filter((s) => !topic || s.topic === topic);
  return (
    <div className="screen">
      <div className="topbar"><button className="icon-btn" onClick={() => history.back()} aria-label="back"><Icon name="back" /></button><h1>{t('nav.science')}</h1></div>
      <p className="small muted">{t('sci.intro')}</p>
      <div className="chips">
        <button className={`chip ${!topic ? 'on' : ''}`} onClick={() => setTopic('')}>{t('sci.all')}</button>
        {topics.map((tp) => <button key={tp} className={`chip ${topic === tp ? 'on' : ''}`} onClick={() => setTopic(tp)}>{t(`sci.topic.${tp}`)}</button>)}
      </div>
      {list.map((s) => (
        <article key={s.id} className="card">
          <span className="eyebrow">{t(`sci.topic.${s.topic}`)}</span>
          <h3>{s.title[i]}</h3>
          <p className="small">{s.takeaway[i]}</p>
          <div className="card tight" style={{ background: 'var(--surface-2)' }}>
            <span className="eyebrow accent">{t('sci.inApp')}</span><p className="small">{s.app[i]}</p>
          </div>
          <p className="tiny muted">{s.cite}</p>
          <a className="small bold" href={s.url} target="_blank" rel="noreferrer"><Icon name="link" size={14} /> {t('sci.read')}</a>
        </article>
      ))}
      <div className="card">
        <span className="eyebrow">{t('sci.books')}</span>
        <p className="small muted">{t('sci.booksD')}</p>
      </div>
    </div>
  );
}
