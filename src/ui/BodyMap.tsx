// Anatomical front/back figure with a bodybuilder physique (wide delts, V-taper, full legs) in a dark
// "black iron" finish. Original vector drawing. Every muscle head is its own region keyed by MuscleId;
// the caller colours regions (worked muscle in red, weekly volume heat map, etc).
import { useId } from 'react';
import type { MuscleId } from '../core/types';

type Shape = {
  m: MuscleId | null; // null = non-trainable anatomy (tendons, serratus, tibialis, hands…)
  d: string;
  f?: string; // fibre / striation lines
  center?: boolean; // drawn once on the midline (not mirrored)
};

const HAND = 'M33,205 Q29,214 33,225 Q41,230 46,223 Q48,212 45,205 Z';
const FOREARM = 'M40,146 Q29,162 30,181 Q32,195 37,203 L45,203 Q54,184 55,164 Q53,150 48,144 Z';

const FRONT: Shape[] = [
  { m: null, center: true, d: 'M90,36 L110,36 L113,50 L87,50 Z' },
  { m: 'neck', d: 'M92,42 Q96,52 99,60 L96,61 Q91,52 89,45 Z' },
  { m: 'traps', d: 'M90,44 Q80,51 63,58 Q78,61 92,56 Z' },
  // Huge capped delts
  { m: 'shoulders', d: 'M81,58 Q58,51 45,68 Q37,87 43,105 Q52,92 60,84 Q70,72 81,66 Z', f: 'M70,60 Q55,74 50,98 M77,63 Q63,76 57,92' },
  // Square, full pecs
  { m: 'chest', d: 'M99,62 L81,60 Q63,64 59,80 Q61,97 76,103 Q90,107 99,103 Z', f: 'M99,68 Q82,69 64,77 M99,77 Q82,79 62,85 M99,87 Q84,89 66,92 M99,96 Q88,98 74,99' },
  { m: null, d: 'M64,103 L72,105 L71,110 L63,108 Z M65,112 L73,114 L72,119 L64,117 Z M66,121 L74,123 L73,128 L66,126 Z' },
  // Obliques tapering into a tight waist
  { m: 'abdominals', d: 'M68,104 Q77,103 87,106 L87,158 Q79,152 75,138 Q71,121 68,104 Z', f: 'M71,112 L85,126 M73,127 L85,140 M76,141 L85,152' },
  // Rectus abdominis (8-pack, left column; mirrored)
  { m: 'abdominals', d: 'M88.5,104 L98.5,104 L98.5,116 L89,116 Q88,110 88.5,104 Z' },
  { m: 'abdominals', d: 'M89,118.5 L98.5,118.5 L98.5,130 L89,130 Z' },
  { m: 'abdominals', d: 'M89,132.5 L98.5,132.5 L98.5,144 L89.5,144 Z' },
  { m: 'abdominals', d: 'M89.5,146.5 L98.5,146.5 L98.5,172 Q93,168 89.5,158 Z' },
  // Arms
  { m: 'biceps', d: 'M48,104 Q35,118 37,134 Q41,147 52,143 Q61,128 58,108 Q54,99 48,104 Z', f: 'M50,108 Q45,124 48,140 M54,108 Q55,124 52,140' },
  { m: 'triceps', d: 'M40,108 Q31,122 35,139 L39,139 Q35,124 44,106 Z' },
  { m: 'forearms', d: FOREARM, f: 'M44,150 Q38,172 40,198 M49,150 Q48,174 44,198' },
  { m: null, d: HAND },
  // Hips & quads with outer sweep
  { m: 'abductors', d: 'M74,158 Q65,168 65,183 L75,178 Q78,168 79,160 Z' },
  { m: 'quadriceps', d: 'M74,176 Q58,205 61,241 Q63,263 74,273 L80,259 Q73,225 80,186 Z', f: 'M70,190 Q63,220 69,258 M76,188 Q70,222 75,258' },
  { m: 'quadriceps', d: 'M82,171 Q74,212 80,258 L88,264 Q97,226 93,188 Q89,173 82,171 Z', f: 'M86,180 Q83,220 86,258' },
  { m: 'quadriceps', d: 'M88,240 Q95,228 98,236 Q100,256 95,272 Q86,276 85,264 Z' },
  { m: 'adductors', d: 'M98.5,174 Q91,178 92,194 Q93,216 97.5,236 L99,236 L99,174 Z' },
  { m: null, d: 'M77,172 Q87,214 95,262 L93.5,264 Q85,216 75,174 Z' },
  { m: null, d: 'M76,276 Q83,271 91,276 Q92,285 84,289 Q76,285 76,276 Z' },
  // Lower legs
  { m: 'calves', d: 'M74,291 Q63,312 67,336 Q72,350 79,356 L81,350 Q79,322 81,295 Z' },
  { m: 'calves', d: 'M89,291 Q100,308 97,334 Q93,348 87,356 L86,298 Z' },
  { m: null, d: 'M81.5,293 L87,293 L86,356 L82,356 Z' },
  { m: null, d: 'M76,360 L92,360 L95,372 L73,372 Z' },
];

const BACK: Shape[] = [
  { m: null, center: true, d: 'M90,36 L110,36 L113,48 L87,48 Z' },
  // Thick trapezius
  { m: 'traps', center: true, d: 'M100,38 L90,43 Q82,51 61,58 Q78,66 88,88 L100,130 L112,88 Q122,66 139,58 Q118,51 110,43 Z', f: 'M100,46 L100,126 M90,52 Q80,58 68,60 M90,74 L100,100 M110,74 L100,100' },
  { m: 'shoulders', d: 'M61,58 Q45,56 39,72 Q35,90 42,105 Q53,92 59,82 Q66,70 61,58 Z', f: 'M55,62 Q45,78 45,100' },
  { m: 'middle back', d: 'M66,74 Q61,88 66,100 Q79,104 87,96 Q83,82 73,74 Z', f: 'M69,80 L85,96 M66,90 L80,102' },
  // Wide lats (V-taper)
  { m: 'lats', d: 'M65,100 Q56,123 65,146 Q77,161 96,167 L98,149 Q94,124 91,100 Q80,106 65,100 Z', f: 'M68,108 Q76,138 95,160 M63,124 Q72,148 92,164' },
  { m: 'lower back', d: 'M92,134 Q89,156 91,180 L99,182 L99,128 Z', f: 'M95.5,138 L95.5,178' },
  { m: 'triceps', d: 'M48,104 Q35,118 37,136 Q42,148 53,143 Q61,126 58,106 Q53,99 48,104 Z', f: 'M52,108 Q55,124 50,142 M44,112 Q41,126 44,140' },
  { m: 'forearms', d: FOREARM, f: 'M46,150 Q41,174 42,198' },
  { m: null, d: HAND },
  // Glutes & hamstrings
  { m: 'abductors', d: 'M74,168 Q65,180 69,193 Q82,187 88,176 Q83,168 74,168 Z' },
  { m: 'glutes', d: 'M99,178 Q84,172 72,186 Q65,206 78,221 Q92,229 99,220 Z', f: 'M98,186 Q84,196 75,214 M98,200 Q90,208 84,222' },
  { m: 'hamstrings', d: 'M72,225 Q63,249 68,275 L81,279 Q79,251 84,227 Z', f: 'M75,232 Q70,254 74,274' },
  { m: 'hamstrings', d: 'M86,227 Q81,253 84,279 L96,277 Q101,249 98,225 Z', f: 'M91,234 L90,274' },
  { m: null, d: 'M76,281 Q88,278 96,283 L94,291 L79,291 Z' },
  // Diamond calves
  { m: 'calves', d: 'M76,292 Q63,307 67,329 Q74,341 84,334 Q85,307 83,292 Z', f: 'M78,298 Q72,314 76,330' },
  { m: 'calves', d: 'M87,292 Q100,303 97,327 Q92,343 86,336 Q85,309 87,292 Z', f: 'M91,298 Q95,314 91,332' },
  { m: 'calves', d: 'M71,334 Q74,351 81,363 L90,363 Q97,349 96,334 Q88,345 83,340 Z' },
  { m: null, d: 'M78,365 L93,365 L96,374 L75,374 Z' },
];

function Figure({ shapes, colors, label }: { shapes: Shape[]; colors: Partial<Record<MuscleId, string>>; label: string }) {
  const uid = useId().replace(/:/g, '');
  const shade = `sh${uid}`;
  const spec = `sp${uid}`;
  const glow = `gl${uid}`;
  const mirrored = shapes.filter((s) => !s.center);
  const under = (s: Shape, i: number) => <path key={`u${i}`} d={s.d} className="bm-under" />;
  const draw = (s: Shape, i: number) => {
    const color = s.m ? colors[s.m] : undefined;
    return (
      <g key={i} filter={color ? `url(#${glow})` : undefined}>
        <path d={s.d} className={s.m ? 'bm-m' : 'bm-deco'} style={color ? { fill: color } : undefined}>{s.m && <title>{s.m}</title>}</path>
        <path d={s.d} fill={`url(#${shade})`} pointerEvents="none" />
        <path d={s.d} fill={`url(#${spec})`} pointerEvents="none" />
        {s.f && <path d={s.f} className="bm-fiber" fill="none" pointerEvents="none" />}
      </g>
    );
  };
  return (
    <div>
      <svg viewBox="26 10 148 368" role="img" aria-label={label}>
        <defs>
          <radialGradient id={shade} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
            <stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.7" />
          </radialGradient>
          <radialGradient id={spec} cx="0.32" cy="0.22" r="0.28">
            <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.6" result="b" />
            <feFlood floodColor="#ff2d2d" floodOpacity="0.7" />
            <feComposite in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g>{shapes.map(under)}<g transform="translate(200,0) scale(-1,1)">{mirrored.map((s, i) => under(s, i + 1000))}</g></g>
        <ellipse cx="100" cy="27" rx="12" ry="15" className="bm-deco" />
        <ellipse cx="100" cy="27" rx="12" ry="15" fill={`url(#${shade})`} />
        <ellipse cx="100" cy="27" rx="12" ry="15" fill={`url(#${spec})`} />
        {shapes.map(draw)}
        <g transform="translate(200,0) scale(-1,1)">{mirrored.map((s, i) => draw(s, i + 1000))}</g>
      </svg>
      <div className="label">{label}</div>
    </div>
  );
}

export function BodyMap({ colors, labels }: { colors: Partial<Record<MuscleId, string>>; labels: [string, string] }) {
  return (
    <div className="bodymap">
      <Figure shapes={FRONT} colors={colors} label={labels[0]} />
      <Figure shapes={BACK} colors={colors} label={labels[1]} />
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
