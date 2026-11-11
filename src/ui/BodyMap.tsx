// Anatomical front/back figure — original vector drawing in a grey "statue" style.
// Every muscle head is its own region keyed by MuscleId; the caller colours regions (worked muscle in red,
// weekly volume heat map, etc). A shared radial gradient adds 3D shading and thin strokes add fibre direction.
import { useId } from 'react';
import type { MuscleId } from '../core/types';

type Shape = {
  m: MuscleId | null; // null = non-trainable anatomy (tendons, serratus, tibialis…)
  d: string;
  f?: string; // fibre lines
  center?: boolean; // drawn once on the midline (not mirrored)
};

// Body silhouette behind the muscles: what shows through the gaps reads as separation lines.
const SILHOUETTE =
  'M100,14 C110,14 116,22 116,34 C116,44 112,50 110,54 L112,62 C126,64 140,66 148,74 C154,82 152,98 150,112 ' +
  'C154,130 158,150 156,172 C158,190 160,204 156,218 L148,220 C146,206 142,190 140,176 C138,190 132,186 128,184 ' +
  'C132,214 132,250 126,280 C126,300 124,330 120,358 L122,372 L106,374 L108,356 C104,330 104,300 104,284 C102,250 102,220 100,200 ' +
  'C98,220 98,250 96,284 C96,300 96,330 92,356 L94,374 L78,372 L80,358 C76,330 74,300 74,280 C68,250 68,214 72,184 ' +
  'C68,186 62,190 60,176 C58,190 54,206 52,220 L44,218 C40,204 42,190 44,172 C42,150 46,130 50,112 C48,98 46,82 52,74 ' +
  'C60,66 74,64 88,62 L90,54 C88,50 84,44 84,34 C84,22 90,14 100,14 Z';

const FRONT: Shape[] = [
  // Neck & traps
  { m: 'neck', d: 'M92,52 Q96,61 99,70 L96,71 Q91,62 89,54 Z' },
  { m: 'traps', d: 'M89,58 Q80,64 68,69 Q78,70 88,67 Z' },
  // Shoulders (anterior + lateral deltoid)
  { m: 'shoulders', d: 'M78,68 Q62,65 54,78 Q49,94 55,110 Q60,99 66,91 Q72,82 79,76 Z', f: 'M70,72 Q60,86 58,104 M76,74 Q66,84 62,98' },
  // Pectoralis major (clavicular + sternal fibres)
  { m: 'chest', d: 'M99,72 L80,70 Q70,75 67,88 Q69,101 80,107 Q92,111 99,107 Z', f: 'M99,78 Q86,79 72,85 M99,86 Q86,88 70,92 M99,95 Q88,97 74,99 M99,103 Q90,104 80,104' },
  // Serratus anterior (decorative)
  { m: null, d: 'M73,108 L80,110 L79,115 L72,113 Z M74,116 L81,118 L80,123 L73,121 Z M75,124 L82,126 L81,131 L75,129 Z' },
  // Obliques
  { m: 'abdominals', d: 'M75,112 Q81,111 88,113 L88,170 Q81,164 78,150 Q77,132 75,112 Z', f: 'M78,120 L87,132 M79,134 L87,146 M80,148 L87,160' },
  // Rectus abdominis (six-pack, left column; mirrored)
  { m: 'abdominals', d: 'M89.5,110 L98.5,110 L98.5,123 L90,123 Q89,117 89.5,110 Z' },
  { m: 'abdominals', d: 'M90,125.5 L98.5,125.5 L98.5,139 L90,139 Z' },
  { m: 'abdominals', d: 'M90,141.5 L98.5,141.5 L98.5,155 L90.5,155 Z' },
  { m: 'abdominals', d: 'M90.5,157.5 L98.5,157.5 L98.5,184 Q93,180 90.5,170 Z' },
  // Arm
  { m: 'biceps', d: 'M57,111 Q50,123 52,139 Q55,148 61,146 Q66,131 64,114 Q61,108 57,111 Z', f: 'M58,116 Q56,130 58,143' },
  { m: 'triceps', d: 'M51,116 Q46,128 49,142 L52,141 Q50,128 54,114 Z' },
  { m: 'forearms', d: 'M51,149 Q44,164 44,181 Q46,195 50,205 L56,205 Q62,186 63,166 Q62,154 58,148 Z', f: 'M54,152 Q50,172 52,200 M58,152 Q58,174 55,198' },
  { m: null, d: 'M45,208 Q42,216 46,226 Q52,230 57,224 Q59,214 56,207 Z' },
  // Hip & thigh
  { m: 'abductors', d: 'M76,174 Q69,184 70,198 L78,193 Q81,183 81,175 Z' },
  { m: 'quadriceps', d: 'M77,192 Q68,214 70,248 Q72,266 80,274 L84,262 Q80,230 84,197 Z', f: 'M76,206 Q73,232 78,262' },
  { m: 'quadriceps', d: 'M85,186 Q80,220 84,262 L90,266 Q96,234 94,200 Q91,187 85,186 Z', f: 'M88,196 L88,256' },
  { m: 'quadriceps', d: 'M90,248 Q95,236 97.5,242 Q99.5,258 96,272 Q89,276 88,266 Z' },
  { m: 'adductors', d: 'M98.5,186 Q92,190 93,205 Q94,224 97.5,240 L99,240 L99,186 Z' },
  { m: null, d: 'M80,184 Q88,220 95,262 L94,264 Q86,222 78,186 Z' }, // sartorius
  { m: null, d: 'M80,278 Q86,274 92,278 Q93,286 86,290 Q79,286 80,278 Z' }, // knee
  // Lower leg
  { m: 'calves', d: 'M79,292 Q72,312 75,336 Q79,350 83,356 L85,350 Q83,322 85,296 Z' },
  { m: 'calves', d: 'M91,292 Q98,310 96,334 Q93,348 89,356 L88,300 Z' },
  { m: null, d: 'M85,294 L89.5,294 L88,356 L85.5,356 Z' }, // tibialis
  { m: null, d: 'M80,360 L94,360 L96,372 L78,372 Z' },
];

const BACK: Shape[] = [
  // Trapezius (kite, midline)
  { m: 'traps', center: true, d: 'M100,48 L92,52 Q85,61 69,69 Q83,75 91,94 L100,132 L109,94 Q117,75 131,69 Q115,61 108,52 Z', f: 'M100,56 L100,128 M92,60 Q84,66 74,69 M92,78 L100,100' },
  // Rear deltoid
  { m: 'shoulders', d: 'M69,69 Q57,69 52,82 Q49,97 55,109 Q63,97 69,88 Q73,79 69,69 Z', f: 'M64,74 Q57,88 57,104' },
  // Infraspinatus / teres (mid back)
  { m: 'middle back', d: 'M73,80 Q70,93 75,104 Q85,108 91,100 Q88,88 80,80 Z', f: 'M76,86 L89,100 M74,95 L86,104' },
  // Latissimus dorsi
  { m: 'lats', d: 'M75,106 Q69,124 73,146 Q81,162 96,169 L98,152 Q94,128 92,104 Q84,110 75,106 Z', f: 'M78,112 Q84,140 96,162 M74,126 Q82,150 94,166' },
  // Erector spinae
  { m: 'lower back', d: 'M93,136 Q90,158 92,182 L99,184 L99,130 Z', f: 'M96,138 L96,180' },
  // Arm
  { m: 'triceps', d: 'M56,110 Q48,122 50,140 Q54,149 61,146 Q66,130 64,112 Q60,107 56,110 Z', f: 'M60,114 Q62,128 58,144 M54,118 Q52,130 54,142' },
  { m: 'forearms', d: 'M51,149 Q44,164 44,181 Q46,195 50,205 L56,205 Q62,186 63,166 Q62,154 58,148 Z', f: 'M55,152 Q52,176 53,200' },
  { m: null, d: 'M45,208 Q42,216 46,226 Q52,230 57,224 Q59,214 56,207 Z' },
  // Glutes
  { m: 'abductors', d: 'M75,170 Q69,181 73,193 Q84,187 89,178 Q84,170 75,170 Z' },
  { m: 'glutes', d: 'M99,180 Q86,176 76,188 Q70,206 80,218 Q92,225 99,217 Z', f: 'M98,186 Q86,196 78,212 M98,198 Q90,206 84,218' },
  // Hamstrings
  { m: 'hamstrings', d: 'M76,222 Q70,246 74,272 L84,276 Q82,248 86,224 Z', f: 'M79,228 Q76,250 79,270' },
  { m: 'hamstrings', d: 'M88,224 Q84,250 86,276 L96,274 Q100,246 98,222 Z', f: 'M92,230 L91,270' },
  { m: null, d: 'M80,278 Q90,276 96,280 L94,288 L82,288 Z' },
  // Calves
  { m: 'calves', d: 'M78,289 Q70,305 74,327 Q80,337 86,331 Q86,305 84,289 Z', f: 'M80,296 Q77,312 80,328' },
  { m: 'calves', d: 'M88,289 Q98,301 96,325 Q92,339 87,333 Q86,307 88,289 Z', f: 'M92,296 Q94,312 91,330' },
  { m: 'calves', d: 'M76,331 Q79,348 84,360 L90,360 Q96,346 95,331 Q88,341 84,337 Z' },
  { m: null, d: 'M80,362 L94,362 L96,372 L78,372 Z' },
];

function Figure({ shapes, colors, label, back }: { shapes: Shape[]; colors: Partial<Record<MuscleId, string>>; label: string; back?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const shade = `sh${uid}`;
  const glow = `gl${uid}`;
  const draw = (s: Shape, i: number) => {
    const color = s.m ? colors[s.m] : undefined;
    return (
      <g key={i} filter={color ? `url(#${glow})` : undefined}>
        <path d={s.d} className={s.m ? 'bm-m' : 'bm-deco'} style={color ? { fill: color } : undefined}>{s.m && <title>{s.m}</title>}</path>
        <path d={s.d} fill={`url(#${shade})`} pointerEvents="none" />
        {s.f && <path d={s.f} className="bm-fiber" fill="none" pointerEvents="none" />}
      </g>
    );
  };
  const mirrored = shapes.filter((s) => !s.center);
  return (
    <div>
      <svg viewBox="38 8 124 370" role="img" aria-label={label}>
        <defs>
          <radialGradient id={shade} cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
          <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="b" />
            <feFlood floodColor="#ff3b30" floodOpacity="0.55" />
            <feComposite in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={SILHOUETTE} className="bm-body" />
        <ellipse cx="100" cy="33" rx="14" ry="18" className="bm-deco" />
        <ellipse cx="100" cy="33" rx="14" ry="18" fill={`url(#${shade})`} />
        {back && <path d="M100,15 L100,50" className="bm-fiber" />}
        {shapes.map((s, i) => draw(s, i))}
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
      <Figure shapes={BACK} colors={colors} label={labels[1]} back />
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
