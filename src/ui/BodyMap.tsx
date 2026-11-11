// Front/back anatomical map (original stylized drawing). Each region is keyed by MuscleId and coloured by the caller.
import type { MuscleId } from '../core/types';

type Shape = { m: MuscleId; d?: string; e?: [number, number, number, number]; center?: boolean };

const FRONT: Shape[] = [
  { m: 'neck', d: 'M92,50 L108,50 L111,66 L89,66 Z', center: true },
  { m: 'traps', d: 'M89,60 L70,72 L90,70 Z' },
  { m: 'shoulders', e: [64, 84, 14, 15] },
  { m: 'chest', d: 'M99,72 L80,73 Q67,80 69,96 Q73,111 99,108 Z' },
  { m: 'biceps', d: 'M57,97 Q49,111 51,130 Q57,137 64,131 Q69,113 66,99 Z' },
  { m: 'forearms', d: 'M51,138 Q43,158 45,182 L56,182 Q65,160 64,138 Z' },
  { m: 'abdominals', d: 'M86,112 L114,112 L112,170 Q100,177 88,170 Z', center: true },
  { m: 'abdominals', d: 'M71,108 L84,112 L86,168 Q77,160 73,140 Z' },
  { m: 'abductors', d: 'M71,166 Q65,180 69,198 L77,192 L80,171 Z' },
  { m: 'quadriceps', d: 'M80,174 Q67,212 73,262 Q84,269 94,262 Q98,228 96,186 Q90,177 80,174 Z' },
  { m: 'adductors', d: 'M99,182 L91,184 Q91,210 97,236 L99,236 Z' },
  { m: 'calves', d: 'M75,284 Q69,313 76,346 L88,346 Q94,312 90,284 Z' },
];

const BACK: Shape[] = [
  { m: 'neck', d: 'M93,48 L107,48 L109,58 L91,58 Z', center: true },
  { m: 'middle back', d: 'M99,86 L83,84 L79,110 L99,128 Z' },
  { m: 'traps', d: 'M100,54 L84,64 Q76,70 71,76 L100,126 L129,76 Q124,70 116,64 Z', center: true },
  { m: 'shoulders', e: [64, 84, 13, 14] },
  { m: 'lats', d: 'M78,98 Q68,120 75,147 Q87,157 98,151 L98,133 L83,110 Z' },
  { m: 'lower back', d: 'M87,148 L113,148 L115,174 L85,174 Z', center: true },
  { m: 'triceps', d: 'M57,95 Q49,111 51,130 Q57,137 64,131 Q69,111 66,97 Z' },
  { m: 'forearms', d: 'M51,138 Q43,158 45,182 L56,182 Q65,160 64,138 Z' },
  { m: 'abductors', e: [77, 177, 8, 9] },
  { m: 'glutes', d: 'M99,176 Q86,170 77,183 Q72,201 84,211 Q96,215 99,207 Z' },
  { m: 'hamstrings', d: 'M78,214 Q71,238 76,264 L94,264 Q99,238 96,216 Z' },
  { m: 'calves', d: 'M75,280 Q68,302 75,328 Q84,336 92,328 Q97,302 90,280 Z' },
];

function Base({ back }: { back?: boolean }) {
  const side = (
    <>
      <rect x="47" y="76" width="22" height="62" rx="11" className="bm-base" />
      <rect x="43" y="132" width="22" height="54" rx="10" className="bm-base" />
      <ellipse cx="50" cy="194" rx="7" ry="10" className="bm-base" />
      <rect x="67" y="168" width="32" height="104" rx="14" className="bm-base" />
      <rect x="71" y="266" width="24" height="86" rx="11" className="bm-base" />
      <ellipse cx="82" cy="360" rx="12" ry="7" className="bm-base" />
    </>
  );
  return (
    <g>
      <ellipse cx="100" cy="28" rx="17" ry="21" className="bm-base" />
      <rect x="68" y="64" width="64" height="114" rx="22" className="bm-base" />
      {side}
      <g transform="translate(200,0) scale(-1,1)">{side}</g>
      {back && <ellipse cx="100" cy="28" rx="17" ry="21" fill="var(--surface-3)" />}
    </g>
  );
}

function Figure({ shapes, colors, back, label }: { shapes: Shape[]; colors: Partial<Record<MuscleId, string>>; back?: boolean; label: string }) {
  const draw = (s: Shape, i: number, mirror: boolean) => {
    const fill = colors[s.m];
    const style = fill ? { fill } : undefined;
    const common = { className: 'bm-m', style, key: `${i}${mirror ? 'r' : 'l'}` };
    const el = s.e
      ? <ellipse {...common} cx={s.e[0]} cy={s.e[1]} rx={s.e[2]} ry={s.e[3]}><title>{s.m}</title></ellipse>
      : <path {...common} d={s.d}><title>{s.m}</title></path>;
    return mirror ? <g key={`${i}m`} transform="translate(200,0) scale(-1,1)">{el}</g> : el;
  };
  return (
    <div>
      <svg viewBox="30 0 140 372" role="img" aria-label={label}>
        <Base back={back} />
        {shapes.map((s, i) => draw(s, i, false))}
        {shapes.filter((s) => !s.center).map((s, i) => draw(s, i + 100, true))}
      </svg>
      <div className="label">{label}</div>
    </div>
  );
}

export function BodyMap({ colors, labels }: { colors: Partial<Record<MuscleId, string>>; labels: [string, string] }) {
  return (
    <div className="bodymap">
      <Figure shapes={FRONT} colors={colors} label={labels[0]} />
      <Figure shapes={BACK} colors={colors} back label={labels[1]} />
    </div>
  );
}

/** Primary movers in red, secondary in orange — the "which muscle does this hit" view. */
export function exerciseColors(pm: MuscleId[], sm: MuscleId[]): Partial<Record<MuscleId, string>> {
  const c: Partial<Record<MuscleId, string>> = {};
  sm.forEach((m) => { c[m] = 'var(--muscle-secondary)'; });
  pm.forEach((m) => { c[m] = 'var(--muscle-primary)'; });
  return c;
}
