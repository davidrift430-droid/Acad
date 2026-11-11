// SVG charts drawn to scale: weight (raw dotted + moving average solid), bars, and MEV/MAV/MRV volume tracks.
import { LANDMARKS, zoneOf, type VolumeGroup } from '../core/training';
import { fmt } from './kit';

export interface Pt { label: string; value: number }

export function LineChart({ raw, smooth, unit = '', height = 170 }: { raw?: Pt[]; smooth: Pt[]; unit?: string; height?: number }) {
  if (smooth.length < 2) return null;
  const w = 340;
  const pad = { t: 18, r: 40, b: 22, l: 8 };
  const all = [...smooth, ...(raw ?? [])].map((p) => p.value);
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (max - min < 1) { min -= 0.5; max += 0.5; }
  const span = max - min;
  min -= span * 0.1; max += span * 0.1;
  const n = smooth.length;
  const X = (i: number) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);
  const path = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ');
  const ticks = [max - (max - min) * 0.1, (max + min) / 2, min + (max - min) * 0.1];
  const step = Math.max(1, Math.ceil(n / 5));
  const last = smooth[n - 1]!;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="chart" role="img">
      {ticks.map((v, i) => (
        <g key={i}>
          <line className="grid" x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} />
          <text x={w - pad.r + 6} y={Y(v) + 3}>{fmt(v, 1)}</text>
        </g>
      ))}
      {raw && <path d={path(raw)} fill="none" stroke="var(--muted)" strokeWidth={1.4} strokeDasharray="3 4" />}
      {raw?.map((p, i) => <circle key={i} cx={X(i)} cy={Y(p.value)} r={2} fill="var(--muted)" />)}
      <path d={path(smooth)} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={X(n - 1)} cy={Y(last.value)} r={5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
      <text x={X(n - 1) - 4} y={Y(last.value) - 10} textAnchor="end" style={{ fill: 'var(--text)', fontWeight: 800 }}>{fmt(last.value, 1)}{unit}</text>
      {smooth.map((p, i) => (i % step === 0 || i === n - 1) && <text key={i} x={X(i)} y={height - 6} textAnchor="middle">{p.label}</text>)}
    </svg>
  );
}

export function BarChart({ data, height = 140, highlightLast = true }: { data: Pt[]; height?: number; highlightLast?: boolean }) {
  if (!data.length) return null;
  const w = 340;
  const pad = { t: 18, b: 22 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = w / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="chart" role="img">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - pad.t - pad.b);
        const x = i * bw + bw * 0.2;
        const y = height - pad.b - h;
        const hi = highlightLast && i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw * 0.6} height={Math.max(h, 1.5)} rx={3} fill={hi ? 'var(--accent)' : 'var(--surface-3)'} />
            {d.value > 0 && <text x={x + bw * 0.3} y={y - 5} textAnchor="middle" style={{ fill: hi ? 'var(--text)' : 'var(--muted)' }}>{fmt(d.value, 0)}</text>}
            <text x={x + bw * 0.3} y={height - 6} textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

const ZONE_COLOR = { below: 'var(--faint)', mev: 'var(--info)', mav: 'var(--accent)', high: 'var(--warn)', over: 'var(--danger)' } as const;

/** One track per muscle: shaded MEV→MAV→MRV bands with the week's fractional hard sets as the fill. */
export function VolumeTracks({ sets, labels }: { sets: Record<VolumeGroup, number>; labels: Record<VolumeGroup, string> }) {
  const groups = Object.keys(LANDMARKS) as VolumeGroup[];
  return (
    <div className="col gap-12">
      {groups.map((g) => {
        const lm = LANDMARKS[g];
        const scale = lm.mrv * 1.25;
        const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
        const v = sets[g] ?? 0;
        const z = zoneOf(v, lm);
        return (
          <div className="vol-row" key={g}>
            <span className="ellipsis bold">{labels[g]}</span>
            <div className="vol-track" title={`MEV ${lm.mev} · MAV ${lm.mavLow}-${lm.mavHigh} · MRV ${lm.mrv}`}>
              <div className="zone" style={{ left: pct(lm.mev), width: `calc(${pct(lm.mavLow)} - ${pct(lm.mev)})`, background: 'rgba(90,200,250,.12)' }} />
              <div className="zone" style={{ left: pct(lm.mavLow), width: `calc(${pct(lm.mavHigh)} - ${pct(lm.mavLow)})`, background: 'var(--accent-soft)' }} />
              <div className="zone" style={{ left: pct(lm.mavHigh), width: `calc(${pct(lm.mrv)} - ${pct(lm.mavHigh)})`, background: 'var(--warn-soft)' }} />
              <div className="zone" style={{ left: pct(lm.mrv), right: 0, background: 'var(--danger-soft)' }} />
              <div className="fill" style={{ width: pct(v), background: ZONE_COLOR[z], opacity: v ? 1 : 0 }} />
            </div>
            <span className="mono bold" style={{ textAlign: 'right', color: z === 'over' ? 'var(--danger)' : z === 'mav' ? 'var(--accent-text)' : 'var(--text)' }}>{fmt(v, 1)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function VolumeLegend({ t }: { t: (k: string) => string }) {
  return (
    <div className="vol-legend">
      <span><i style={{ background: 'var(--faint)' }} />{'< MEV'}</span>
      <span><i style={{ background: 'var(--info)' }} />MEV</span>
      <span><i style={{ background: 'var(--accent)' }} />MAV · {t('lab.optimal')}</span>
      <span><i style={{ background: 'var(--warn)' }} />{t('lab.high')}</span>
      <span><i style={{ background: 'var(--danger)' }} />{'> MRV'}</span>
    </div>
  );
}
