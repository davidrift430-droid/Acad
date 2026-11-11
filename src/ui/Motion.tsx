// Full-movement exercise animation: an articulated bodybuilder figure (original drawing) performs a complete
// repetition with a controlled tempo — eccentric, pause in the stretch, concentric, squeeze — while the
// working muscles glow red. Each of the 876 exercises maps to one of ~45 movement patterns.
import { useEffect, useRef, useState } from 'react';
import type { Exercise, MuscleId } from '../core/types';

type V = [number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
const rad = (d: number) => (d * Math.PI) / 180;
/** Unit vector for an absolute segment angle: 0 = straight down, +90 = facing direction (right), 180 = up. */
const dir = (deg: number): V => [Math.sin(rad(deg)), Math.cos(rad(deg))];
const len = (a: V) => Math.hypot(a[0], a[1]);

const L = { thigh: 46, shin: 46, torso: 60, ua: 33, fa: 30, neck: 9, head: 10 };
const GROUND = 214;

// ───────── Poses & patterns ─────────

interface SidePose { phi: number; t1: number; s1: number; t2?: number; s2?: number; u: number; f: number; u2?: number; f2?: number; lift?: number }
interface FrontPose { a: number; f: number; legR?: number; sh?: number }
type Anchor = 'feet' | 'hip' | 'hands' | 'farFoot';
type HandsAt = 'barBack' | 'barFront' | 'chest' | 'hip' | 'head';

interface SidePattern {
  view: 'side'; anchor: Anchor; at: V; a: SidePose; b: SidePose;
  concFirst?: boolean; // start at A (stretched) and contract first
  prone?: boolean; handsAt?: HandsAt; equipAt?: 'wrist' | 'hip' | 'ankle';
  bench?: string; bar?: number; cable?: V; mode?: 'reps' | 'hold' | 'cycle';
}
interface FrontPattern {
  view: 'front'; anchor: 'feet' | 'hands' | 'seat'; at: V; a: FrontPose; b: FrontPose;
  concFirst?: boolean; bar?: number; cable?: V; mode?: 'reps' | 'hold' | 'cycle';
}
type Pattern = SidePattern | FrontPattern;

const FEET: V = [112, 208];
const stand = { t1: 0, s1: 0 };

const P: Record<string, Pattern> = {
  squat: { view: 'side', anchor: 'feet', at: FEET, handsAt: 'barBack', a: { phi: 8, ...stand, u: 0, f: 0 }, b: { phi: 42, t1: 100, s1: -38, u: 0, f: 0 } },
  front_squat: { view: 'side', anchor: 'feet', at: FEET, handsAt: 'barFront', a: { phi: 2, ...stand, u: 0, f: 0 }, b: { phi: 20, t1: 108, s1: -42, u: 0, f: 0 } },
  goblet: { view: 'side', anchor: 'feet', at: FEET, handsAt: 'chest', a: { phi: 5, ...stand, u: 0, f: 0 }, b: { phi: 22, t1: 108, s1: -42, u: 0, f: 0 } },
  hack: { view: 'side', anchor: 'feet', at: [124, 208], handsAt: 'barBack', bench: 'hack', a: { phi: -8, t1: 5, s1: 5, u: 0, f: 0 }, b: { phi: -14, t1: 110, s1: -30, u: 0, f: 0 } },
  leg_press: { view: 'side', anchor: 'hip', at: [92, 172], handsAt: 'hip', bench: 'recline', equipAt: 'ankle', a: { phi: -58, t1: 130, s1: 130, u: 0, f: 0 }, b: { phi: -58, t1: 172, s1: 92, u: 0, f: 0 } },
  lunge: { view: 'side', anchor: 'feet', at: [140, 208], a: { phi: 4, t1: 25, s1: -8, t2: -25, s2: -35, u: 2, f: 2 }, b: { phi: 6, t1: 92, s1: -18, t2: 4, s2: -84, u: 2, f: 2 } },
  rdl: { view: 'side', anchor: 'feet', at: FEET, a: { phi: 0, ...stand, u: 0, f: 0 }, b: { phi: 78, t1: 22, s1: -8, u: 0, f: 0 } },
  deadlift: { view: 'side', anchor: 'feet', at: FEET, concFirst: true, a: { phi: 55, t1: 78, s1: -24, u: 0, f: 0 }, b: { phi: 0, ...stand, u: 0, f: 0 } },
  good_morning: { view: 'side', anchor: 'feet', at: FEET, handsAt: 'barBack', a: { phi: 0, ...stand, u: 0, f: 0 }, b: { phi: 80, t1: 20, s1: -8, u: 0, f: 0 } },
  hip_thrust: { view: 'side', anchor: 'feet', at: [158, 208], handsAt: 'hip', equipAt: 'hip', bench: 'thrust', concFirst: true, a: { phi: -52, t1: 128, s1: -8, u: 0, f: 0 }, b: { phi: -92, t1: 92, s1: -6, u: 0, f: 0 } },
  glute_bridge: { view: 'side', anchor: 'feet', at: [158, 208], handsAt: 'hip', equipAt: 'hip', concFirst: true, a: { phi: -88, t1: 132, s1: -18, u: 0, f: 0 }, b: { phi: -110, t1: 100, s1: -14, u: 0, f: 0 } },
  leg_ext: { view: 'side', anchor: 'hip', at: [104, 150], handsAt: 'hip', bench: 'seat', equipAt: 'ankle', concFirst: true, a: { phi: -10, t1: 88, s1: -12, u: 0, f: 0 }, b: { phi: -10, t1: 88, s1: 82, u: 0, f: 0 } },
  leg_curl_seated: { view: 'side', anchor: 'hip', at: [104, 150], handsAt: 'hip', bench: 'seat', equipAt: 'ankle', concFirst: true, a: { phi: -14, t1: 88, s1: 72, u: 0, f: 0 }, b: { phi: -14, t1: 88, s1: -28, u: 0, f: 0 } },
  leg_curl_lying: { view: 'side', anchor: 'hip', at: [118, 150], prone: true, bench: 'flat', equipAt: 'ankle', concFirst: true, a: { phi: -92, t1: 92, s1: 92, u: -80, f: -20 }, b: { phi: -92, t1: 92, s1: 205, u: -80, f: -20 } },
  calf_standing: { view: 'side', anchor: 'feet', at: FEET, handsAt: 'barBack', concFirst: true, a: { phi: 2, ...stand, u: 0, f: 0, lift: -5 }, b: { phi: 2, ...stand, u: 0, f: 0, lift: 13 } },
  calf_seated: { view: 'side', anchor: 'feet', at: FEET, handsAt: 'hip', concFirst: true, a: { phi: -4, t1: 90, s1: -2, u: 0, f: 0, lift: -5 }, b: { phi: -4, t1: 90, s1: -2, u: 0, f: 0, lift: 13 } },
  bench: { view: 'side', anchor: 'hip', at: [150, 150], bench: 'flat', a: { phi: -90, t1: 55, s1: -6, u: 180, f: 180 }, b: { phi: -90, t1: 55, s1: -6, u: 28, f: 178 } },
  incline_press: { view: 'side', anchor: 'hip', at: [140, 162], bench: 'incline', a: { phi: -55, t1: 70, s1: -4, u: 172, f: 172 }, b: { phi: -55, t1: 70, s1: -4, u: 40, f: 176 } },
  pushup: { view: 'side', anchor: 'hands', at: [168, 208], a: { phi: 72, t1: -108, s1: -108, u: 4, f: 0 }, b: { phi: 82, t1: -98, s1: -98, u: -62, f: 14 } },
  dip: { view: 'side', anchor: 'hands', at: [118, 128], bar: 128, a: { phi: 14, t1: -6, s1: -70, u: 4, f: 0 }, b: { phi: 26, t1: 10, s1: -60, u: 212, f: 12 } },
  ohp: { view: 'side', anchor: 'feet', at: FEET, concFirst: true, a: { phi: 0, ...stand, u: 30, f: 160 }, b: { phi: 0, ...stand, u: 178, f: 178 } },
  seated_press: { view: 'side', anchor: 'hip', at: [110, 168], bench: 'upright', concFirst: true, a: { phi: -4, t1: 88, s1: 2, u: 30, f: 160 }, b: { phi: -4, t1: 88, s1: 2, u: 176, f: 178 } },
  front_raise: { view: 'side', anchor: 'feet', at: FEET, concFirst: true, a: { phi: 0, ...stand, u: 6, f: 6 }, b: { phi: 0, ...stand, u: 92, f: 92 } },
  rear_fly: { view: 'side', anchor: 'feet', at: FEET, concFirst: true, a: { phi: 74, t1: 18, s1: -8, u: 4, f: 4 }, b: { phi: 74, t1: 18, s1: -8, u: -72, f: -72 } },
  row_bent: { view: 'side', anchor: 'feet', at: FEET, concFirst: true, a: { phi: 70, t1: 20, s1: -10, u: 0, f: 0 }, b: { phi: 70, t1: 20, s1: -10, u: -62, f: 14 } },
  row_cable: { view: 'side', anchor: 'hip', at: [86, 196], cable: [228, 196], bench: 'floor', concFirst: true, a: { phi: 24, t1: 82, s1: 86, u: 86, f: 88 }, b: { phi: -6, t1: 82, s1: 86, u: -55, f: 88 } },
  straight_pulldown: { view: 'side', anchor: 'feet', at: FEET, cable: [190, 30], concFirst: true, a: { phi: 18, ...stand, u: 148, f: 148 }, b: { phi: 12, ...stand, u: 6, f: 6 } },
  pullover: { view: 'side', anchor: 'hip', at: [150, 158], bench: 'flat', concFirst: true, a: { phi: -90, t1: 60, s1: -6, u: -112, f: -112 }, b: { phi: -90, t1: 60, s1: -6, u: -178, f: -178 } },
  curl: { view: 'side', anchor: 'feet', at: FEET, concFirst: true, a: { phi: 0, ...stand, u: 3, f: 3 }, b: { phi: 0, ...stand, u: 14, f: 158 } },
  incline_curl: { view: 'side', anchor: 'hip', at: [108, 168], bench: 'recline35', concFirst: true, a: { phi: -35, t1: 84, s1: 4, u: -22, f: -22 }, b: { phi: -35, t1: 84, s1: 4, u: -12, f: 128 } },
  preacher: { view: 'side', anchor: 'hip', at: [100, 170], bench: 'preacher', concFirst: true, a: { phi: 14, t1: 88, s1: 2, u: 52, f: 58 }, b: { phi: 14, t1: 88, s1: 2, u: 52, f: 168 } },
  pushdown: { view: 'side', anchor: 'feet', at: FEET, cable: [140, 26], concFirst: true, a: { phi: 8, ...stand, u: 6, f: 165 }, b: { phi: 8, ...stand, u: 6, f: 4 } },
  overhead_ext: { view: 'side', anchor: 'feet', at: FEET, concFirst: true, a: { phi: 2, ...stand, u: 172, f: -16 }, b: { phi: 2, ...stand, u: 172, f: -178 } },
  skull: { view: 'side', anchor: 'hip', at: [150, 150], bench: 'flat', concFirst: true, a: { phi: -90, t1: 55, s1: -6, u: -162, f: -78 }, b: { phi: -90, t1: 55, s1: -6, u: -162, f: -162 } },
  crunch: { view: 'side', anchor: 'hip', at: [118, 200], handsAt: 'head', concFirst: true, a: { phi: -90, t1: 140, s1: 6, u: 0, f: 0 }, b: { phi: -52, t1: 140, s1: 6, u: 0, f: 0 } },
  plank: { view: 'side', anchor: 'hands', at: [160, 208], mode: 'hold', a: { phi: 76, t1: -102, s1: -102, u: 2, f: 88 }, b: { phi: 76, t1: -102, s1: -102, u: 2, f: 88 } },
  leg_raise_hanging: { view: 'side', anchor: 'hands', at: [112, 34], bar: 34, concFirst: true, a: { phi: 0, ...stand, u: 180, f: 180 }, b: { phi: -8, t1: 100, s1: 96, u: 180, f: 180 } },
  leg_raise_lying: { view: 'side', anchor: 'hip', at: [118, 202], concFirst: true, a: { phi: -90, t1: 86, s1: 86, u: -88, f: -88 }, b: { phi: -90, t1: 172, s1: 172, u: -88, f: -88 } },
  back_ext: { view: 'side', anchor: 'hip', at: [120, 130], bench: 'hyper', concFirst: true, a: { phi: 155, t1: -58, s1: -58, u: 160, f: 160 }, b: { phi: 52, t1: -58, s1: -58, u: 40, f: 40 } },
  kickback: { view: 'side', anchor: 'farFoot', at: FEET, concFirst: true, a: { phi: 16, t1: 4, s1: 0, t2: 0, s2: 0, u: 60, f: 80 }, b: { phi: 22, t1: -48, s1: -40, t2: 0, s2: 0, u: 60, f: 80 } },
  swing: { view: 'side', anchor: 'feet', at: FEET, concFirst: true, a: { phi: 70, t1: 26, s1: -12, u: -24, f: -24 }, b: { phi: 0, ...stand, u: 92, f: 92 } },
  cardio: { view: 'side', anchor: 'hip', at: [112, 118], mode: 'cycle', a: { phi: 12, t1: 42, s1: -50, t2: -28, s2: -62, u: -40, f: 40, u2: 40, f2: 110 }, b: { phi: 12, t1: -28, s1: -62, t2: 42, s2: -50, u: 40, f: 110, u2: -40, f2: 40 } },
  wrist: { view: 'side', anchor: 'hip', at: [100, 170], bench: 'upright', concFirst: true, a: { phi: 22, t1: 88, s1: 2, u: 38, f: 82 }, b: { phi: 22, t1: 88, s1: 2, u: 38, f: 104 } },
  stretch_hold: { view: 'side', anchor: 'feet', at: FEET, mode: 'hold', a: { phi: 6, ...stand, u: 2, f: 2 }, b: { phi: 72, t1: 8, s1: 0, u: 6, f: 6 } },
  // Front view patterns
  lateral: { view: 'front', anchor: 'feet', at: [120, 208], concFirst: true, a: { a: 12, f: 12 }, b: { a: 90, f: 94 } },
  upright_row: { view: 'front', anchor: 'feet', at: [120, 208], concFirst: true, a: { a: 8, f: -4 }, b: { a: 98, f: -48 } },
  shrug: { view: 'front', anchor: 'feet', at: [120, 208], concFirst: true, a: { a: 6, f: 6, sh: 0 }, b: { a: 6, f: 6, sh: 10 } },
  fly: { view: 'front', anchor: 'feet', at: [120, 208], concFirst: true, a: { a: 92, f: 98 }, b: { a: 24, f: -8 } },
  pulldown: { view: 'front', anchor: 'seat', at: [120, 176], cable: [120, 8], concFirst: true, a: { a: 162, f: 172 }, b: { a: 38, f: 178 } },
  pullup: { view: 'front', anchor: 'hands', at: [120, 30], bar: 30, concFirst: true, a: { a: 168, f: 172 }, b: { a: 42, f: 178 } },
  hip_abd: { view: 'front', anchor: 'feet', at: [120, 208], concFirst: true, a: { a: 8, f: 8, legR: 2 }, b: { a: 8, f: 8, legR: 34 } },
  hip_add: { view: 'front', anchor: 'feet', at: [120, 208], concFirst: true, a: { a: 8, f: 8, legR: 34 }, b: { a: 8, f: 8, legR: 2 } },
};

export const PATTERN_KEYS = Object.keys(P);

const RULES: [RegExp, string][] = [
  [/stretch|smr|foam|mobility|circles|_roll/, 'stretch_hold'],
  [/lunge|split_squat|step_up|step-up|bulgarian/, 'lunge'],
  [/treadmill|bicycl|elliptical|jog|running|rope_jump|sprint|stair|skating|walking|recumbent|rowing,?_stationary|trail_running/, 'cardio'],
  [/front.*squat|zercher/, 'front_squat'], [/goblet/, 'goblet'], [/hack|smith_machine_squat/, 'hack'],
  [/calf|calves/, 'calf'], [/leg_press/, 'leg_press'],
  [/lunge|split_squat|step_up|step-up|bulgarian/, 'lunge'], [/squat/, 'squat'],
  [/romanian|stiff|rdl/, 'rdl'], [/good_morning/, 'good_morning'], [/hip_thrust/, 'hip_thrust'],
  [/bridge(?!.*side)|butt_lift|butt-ups/, 'glute_bridge'], [/side_bridge|plank|hollow/, 'plank'],
  [/deadlift|rack_pull|clean|snatch/, 'deadlift'], [/leg_extension/, 'leg_ext'],
  [/seated_leg_curl/, 'leg_curl_seated'], [/leg_curl|glute_ham|natural_glute/, 'leg_curl_lying'],
  [/hyperextension|back_extension|superman/, 'back_ext'], [/abductor|abduction/, 'hip_abd'], [/adductor|adduction/, 'hip_add'],
  [/swing/, 'swing'], [/straight-arm_pulldown|straight_arm_pulldown/, 'straight_pulldown'], [/pullover/, 'pullover'],
  [/reverse_fl|rear_delt|reverse_machine|face_pull|back_fl/, 'rear_fly'], [/fly|flye|crossover|pec_deck|butterfly/, 'fly'],
  [/lateral_raise|side_lateral/, 'lateral'], [/front_raise|front_dumbbell_raise|front_plate|front_cable/, 'front_raise'],
  [/upright/, 'upright_row'], [/shrug/, 'shrug'], [/pulldown|lat_pull/, 'pulldown'], [/pullup|pull-up|(^|_)chin|muscle_up/, 'pullup'],
  [/(?<!th)row(?!er)/, 'row'], [/incline.*curl/, 'incline_curl'], [/preacher|scott|spider/, 'preacher'], [/wrist/, 'wrist'],
  [/pushdown|push_down|press_down/, 'pushdown'], [/kickback/, 'kickback_x'],
  [/overhead.*(tricep|extension)|french|standing_dumbbell_triceps|seated_triceps|kneeling_cable_triceps|tricep.*overhead/, 'overhead_ext'],
  [/skull|lying_triceps|lying.*triceps|tate_press|lying_close/, 'skull'], [/dip/, 'dip'], [/push-up|pushup|push_up/, 'pushup'],
  [/incline.*(press|bench)/, 'incline_press'], [/bench_press|chest_press|floor_press|decline.*press|close-grip_barbell_bench/, 'bench'],
  [/shoulder_press|military|overhead_press|arnold|push_press|jerk|seated_dumbbell_press|handstand/, 'press'],
  [/hanging.*(leg|knee|pike)|knee_raise|captain/, 'leg_raise_hanging'], [/leg_raise|flutter|scissor|leg_pull/, 'leg_raise_lying'],
  [/crunch|sit-up|situp|sit_up|ab_roller|rollout|twist|dead_bug|jackknife|v-up|woodchop|oblique|heel_touch/, 'crunch'],
  [/curl/, 'curl'],
];

const BY_MUSCLE: Partial<Record<MuscleId, string>> = {
  chest: 'bench', lats: 'pulldown', 'middle back': 'row_bent', traps: 'shrug', 'lower back': 'back_ext', biceps: 'curl',
  triceps: 'pushdown', forearms: 'wrist', quadriceps: 'squat', hamstrings: 'rdl', glutes: 'hip_thrust', calves: 'calf_standing',
  abdominals: 'crunch', adductors: 'hip_add', abductors: 'hip_abd', neck: 'shrug',
};

export function patternFor(ex: Exercise): string {
  const id = ex.id.toLowerCase();
  if (ex.cat === 'stretching') return 'stretch_hold';
  if (ex.cat === 'cardio') return 'cardio';
  for (const [re, key] of RULES) {
    if (!re.test(id)) continue;
    if (key === 'calf') return /seated/.test(id) ? 'calf_seated' : 'calf_standing';
    if (key === 'row') return /seated|cable|low/.test(id) ? 'row_cable' : 'row_bent';
    if (key === 'press') return /seated/.test(id) ? 'seated_press' : 'ohp';
    if (key === 'kickback_x') return ex.pm.includes('triceps') ? 'pushdown' : 'kickback';
    if (key === 'curl' && !ex.pm.some((m) => m === 'biceps' || m === 'forearms')) continue;
    return key;
  }
  if (ex.pm[0] === 'shoulders') return ex.force === 'push' ? 'ohp' : 'lateral';
  return BY_MUSCLE[ex.pm[0] ?? 'chest'] ?? 'squat';
}

// ───────── Kinematics ─────────

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function mix<T extends object>(a: T, b: T, k: number): T {
  const out = { ...a } as Record<string, number>;
  for (const key of Object.keys(b)) {
    const va = (a as Record<string, number>)[key];
    const vb = (b as Record<string, number>)[key];
    out[key] = lerp(va ?? vb ?? 0, vb ?? 0, k);
  }
  return out as T;
}

/** Two-link inverse kinematics: elbow position for a hand target (bend toward `side`). */
function ik(s: V, target: V, l1: number, l2: number, side: 1 | -1): { e: V; w: V } {
  let d = sub(target, s);
  let dist = len(d);
  const max = l1 + l2 - 0.5;
  if (dist > max) { d = mul(d, max / dist); dist = max; }
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist))));
  const base = Math.atan2(d[1], d[0]) + side * a;
  const e: V = [s[0] + l1 * Math.cos(base), s[1] + l1 * Math.sin(base)];
  return { e, w: add(s, d) };
}

interface SideJoints {
  hip: V; sh: V; head: V; n: V; v: V;
  k1: V; a1: V; toe1: V; k2: V; a2: V; toe2: V;
  e1: V; w1: V; e2: V; w2: V;
}

function sideJoints(p: SidePattern, q: SidePose): SideJoints {
  const lift = q.lift ?? 0;
  const t2 = q.t2 ?? q.t1;
  const s2 = q.s2 ?? q.s1;
  const thigh1 = mul(dir(q.t1), L.thigh);
  const shin1 = mul(dir(q.s1), L.shin);
  const thigh2 = mul(dir(t2), L.thigh);
  const shin2 = mul(dir(s2), L.shin);
  const tv: V = [Math.sin(rad(q.phi)), -Math.cos(rad(q.phi))]; // hip → shoulder unit vector
  const ua = mul(dir(q.u), L.ua);
  const fa = mul(dir(q.f), L.fa);
  let hip: V;
  if (p.anchor === 'feet') hip = sub(sub([p.at[0], p.at[1] - lift], shin1), thigh1);
  else if (p.anchor === 'farFoot') hip = sub(sub(p.at, shin2), thigh2);
  else if (p.anchor === 'hands') hip = sub(sub(sub(p.at, fa), ua), mul(tv, L.torso));
  else hip = p.at;
  const sh = add(hip, mul(tv, L.torso));
  let n: V = [-tv[1], tv[0]];
  if (n[0] < 0 && !p.prone && Math.abs(q.phi) < 80) n = mul(n, -1);
  if (p.prone) n = mul(n, -1);
  const head = add(sh, mul(tv, L.neck + L.head));
  const k1 = add(hip, thigh1);
  const a1 = add(k1, shin1);
  const k2 = add(hip, thigh2);
  const a2 = add(k2, shin2);
  const footDir = (a: V): V => {
    if (lift) return [a[0] + 15, Math.min(GROUND - 1, a[1] + 6 + lift * 0.6)];
    return [a[0] + 16, a[1] + 4];
  };
  let e1 = add(sh, ua);
  let w1 = add(e1, fa);
  let e2 = add(sh, mul(dir(q.u2 ?? q.u), L.ua));
  let w2 = add(e2, mul(dir(q.f2 ?? q.f), L.fa));
  if (p.handsAt) {
    const target: V =
      p.handsAt === 'barBack' ? add(add(sh, mul(n, -9)), mul(tv, 3)) :
      p.handsAt === 'barFront' ? add(sh, mul(n, 11)) :
      p.handsAt === 'chest' ? add(add(sh, mul(n, 16)), mul(tv, -14)) :
      p.handsAt === 'hip' ? add(hip, mul(n, 8)) :
      add(head, mul(n, -6));
    const side: 1 | -1 = p.handsAt === 'barBack' || p.handsAt === 'head' ? 1 : -1;
    const r = ik(sh, target, L.ua, L.fa, (n[0] >= 0 ? side : (-side as 1 | -1)));
    e1 = r.e; w1 = r.w; e2 = r.e; w2 = r.w;
  }
  return { hip, sh, head, n, v: tv, k1, a1, toe1: footDir(a1), k2, a2, toe2: footDir(a2), e1, w1, e2, w2 };
}

// ───────── Drawing primitives ─────────

function capsule(a: V, b: V, ra: number, rb: number): string {
  const d = sub(b, a);
  const l = len(d) || 1;
  const nx = -d[1] / l;
  const ny = d[0] / l;
  const p1: V = [a[0] + nx * ra, a[1] + ny * ra];
  const p2: V = [b[0] + nx * rb, b[1] + ny * rb];
  const p3: V = [b[0] - nx * rb, b[1] - ny * rb];
  const p4: V = [a[0] - nx * ra, a[1] - ny * ra];
  const f = (p: V) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  return `M${f(p1)} L${f(p2)} A${rb},${rb} 0 0 1 ${f(p3)} L${f(p4)} A${ra},${ra} 0 0 1 ${f(p1)} Z`;
}
const poly = (pts: V[]) => 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') + ' Z';

type Colors = (m: MuscleId[]) => string;

function Bench({ kind, j }: { kind?: string; j: SideJoints }) {
  if (!kind) return null;
  const c = 'var(--mo-equip)';
  const legs = (x1: number, x2: number, top: number) => <path d={`M${x1},${top} L${x1},${GROUND} M${x2},${top} L${x2},${GROUND}`} stroke={c} strokeWidth="4" />;
  switch (kind) {
    case 'flat': { const y = j.hip[1] + 13; return <g>{legs(60, 150, y)}<rect x={40} y={y} width={130} height={8} rx={3} fill={c} /></g>; }
    case 'seat': case 'upright': { const y = j.hip[1] + 13; return <g>{legs(j.hip[0] - 14, j.hip[0] + 24, y)}<rect x={j.hip[0] - 26} y={y} width={58} height={8} rx={3} fill={c} />{kind === 'seat' && <path d={capsule(add(j.hip, mul(j.n, -13)), add(j.sh, mul(j.n, -13)), 4, 4)} fill={c} />}</g>; }
    case 'incline': case 'recline': case 'recline35': {
      const back = mul(j.n, -13);
      return <g>{legs(j.hip[0] - 10, j.hip[0] + 30, j.hip[1] + 13)}<rect x={j.hip[0] - 20} y={j.hip[1] + 13} width={56} height={8} rx={3} fill={c} />
        <path d={capsule(add(j.hip, back), add(add(j.sh, back), mul(j.v, 10)), 4, 4)} fill={c} /></g>;
    }
    case 'thrust': return <g><rect x={20} y={j.sh[1] + 10} width={58} height={GROUND - j.sh[1] - 10} rx={4} fill={c} opacity={0.9} /></g>;
    case 'hack': return <path d={capsule(add(j.hip, mul(j.n, -13)), add(j.sh, add(mul(j.n, -13), mul(j.v, 8))), 4, 4)} fill={c} />;
    case 'preacher': return <g><path d={capsule(add(j.sh, [4, 10]), add(j.e1, [2, 10]), 6, 6)} fill={c} />{legs(j.e1[0], j.e1[0], j.e1[1] + 16)}{legs(j.hip[0] - 8, j.hip[0] + 18, j.hip[1] + 13)}<rect x={j.hip[0] - 18} y={j.hip[1] + 13} width={46} height={8} rx={3} fill={c} /></g>;
    case 'hyper': return <g><path d={capsule(add(j.hip, [-4, 14]), add(j.hip, [-40, 50]), 5, 5)} fill={c} /><path d={`M${j.hip[0] - 22},${j.hip[1] + 32} L${j.hip[0] - 22},${GROUND}`} stroke={c} strokeWidth={4} /></g>;
    case 'floor': return <rect x={60} y={j.hip[1] + 12} width={60} height={6} rx={2} fill={c} />;
    default: return null;
  }
}

function Equip({ eq, at, j, cable, kind }: { eq: string; at: V; j?: SideJoints; cable?: V; kind?: 'ankle' | 'hip' }) {
  const c = 'var(--mo-equip)';
  const lime = 'var(--accent)';
  const parts: JSX.Element[] = [];
  if (cable) parts.push(<path key="c" d={`M${cable[0]},${cable[1]} L${at[0]},${at[1]}`} stroke={lime} strokeWidth={1.4} strokeDasharray="3 3" />, <circle key="cp" cx={cable[0]} cy={cable[1]} r={5} fill={c} />);
  if (kind === 'ankle') parts.push(<rect key="pad" x={at[0] - 7} y={at[1] - 7} width={14} height={14} rx={5} fill={c} />);
  else if (eq === 'barbell' || eq === 'e-z curl bar' || kind === 'hip') parts.push(<circle key="p" cx={at[0]} cy={at[1]} r={15} fill={c} stroke="#000" strokeWidth={2} />, <circle key="h" cx={at[0]} cy={at[1]} r={3} fill={lime} />);
  else if (eq === 'dumbbell') parts.push(<rect key="d" x={at[0] - 10} y={at[1] - 5} width={20} height={10} rx={4} fill={c} />, <circle key="d1" cx={at[0] - 9} cy={at[1]} r={6} fill={c} />, <circle key="d2" cx={at[0] + 9} cy={at[1]} r={6} fill={c} />);
  else if (eq === 'kettlebells') parts.push(<circle key="k" cx={at[0]} cy={at[1] + 9} r={9} fill={c} />, <path key="kh" d={`M${at[0] - 5},${at[1] + 2} Q${at[0]},${at[1] - 6} ${at[0] + 5},${at[1] + 2}`} stroke={c} strokeWidth={3} fill="none" />);
  else if (eq === 'cable' || eq === 'machine' || eq === 'bands') parts.push(<rect key="hd" x={at[0] - 6} y={at[1] - 3} width={12} height={6} rx={3} fill={lime} />);
  void j;
  return <g>{parts}</g>;
}

function SideFigure({ p, q, colors, eq }: { p: SidePattern; q: SidePose; colors: Colors; eq: string }) {
  const j = sideJoints(p, q);
  const iron = 'url(#mo-iron)';
  const far = 'url(#mo-iron-far)';
  const fill = (ms: MuscleId[], dflt: string) => colors(ms) || dflt;
  const chestTop = add(j.sh, mul(j.n, 15));
  const hipFront = add(j.hip, mul(j.n, 11));
  const midFront = add(add(j.hip, mul(j.v, L.torso * 0.48)), mul(j.n, 13));
  const mid = add(j.hip, mul(j.v, L.torso * 0.48));
  const backTop = add(j.sh, mul(j.n, -13));
  const backMid = add(add(j.hip, mul(j.v, L.torso * 0.48)), mul(j.n, -11));
  const hipBack = add(j.hip, mul(j.n, -10));
  const equipAt = p.equipAt === 'hip' ? add(j.hip, mul(j.n, 14)) : p.equipAt === 'ankle' ? add(j.a1, mul(j.n, 6)) : j.w1;
  return (
    <g>
      <Bench kind={p.bench} j={j} />
      {p.bar != null && <path d={`M60,${p.bar} L180,${p.bar}`} stroke="var(--mo-equip)" strokeWidth={5} strokeLinecap="round" />}
      {/* far limbs */}
      <path d={capsule(j.hip, j.k2, 10, 7)} fill={fill(['quadriceps', 'hamstrings'], far)} opacity={0.55} />
      <path d={capsule(j.k2, j.a2, 7, 4.5)} fill={fill(['calves'], far)} opacity={0.55} />
      <path d={capsule(j.a2, j.toe2, 4, 3)} fill={far} opacity={0.55} />
      <path d={capsule(j.sh, j.e2, 7, 5.5)} fill={fill(['biceps', 'triceps'], far)} opacity={0.55} />
      <path d={capsule(j.e2, j.w2, 5.5, 4)} fill={fill(['forearms'], far)} opacity={0.55} />
      {/* torso: chest / abs (front), upper / lower back */}
      <path d={poly([j.sh, chestTop, midFront, mid])} fill={fill(['chest'], iron)} />
      <path d={poly([mid, midFront, hipFront, j.hip])} fill={fill(['abdominals'], iron)} />
      <path d={poly([j.sh, backTop, backMid, mid])} fill={fill(['lats', 'middle back', 'traps'], iron)} />
      <path d={poly([mid, backMid, hipBack, j.hip])} fill={fill(['lower back'], iron)} />
      <circle cx={hipBack[0]} cy={hipBack[1]} r={11} fill={fill(['glutes', 'abductors'], iron)} />
      <path d={capsule(add(j.sh, mul(j.v, 2)), add(j.head, mul(j.v, -L.head)), 6, 5)} fill={fill(['neck', 'traps'], iron)} />
      <circle cx={j.head[0]} cy={j.head[1]} r={L.head} fill={iron} />
      {/* near leg */}
      <path d={capsule(j.hip, j.k1, 11, 7.5)} fill={fill(['quadriceps', 'hamstrings', 'adductors'], iron)} />
      <path d={capsule(j.k1, j.a1, 7.5, 4.5)} fill={fill(['calves'], iron)} />
      <path d={capsule(j.a1, j.toe1, 4, 3)} fill={iron} />
      {/* near arm */}
      <circle cx={j.sh[0]} cy={j.sh[1]} r={9.5} fill={fill(['shoulders'], iron)} />
      <path d={capsule(j.sh, j.e1, 7.5, 5.5)} fill={fill(['biceps', 'triceps'], iron)} />
      <path d={capsule(j.e1, j.w1, 5.5, 4)} fill={fill(['forearms'], iron)} />
      <Equip eq={eq} at={equipAt} cable={p.cable} kind={p.equipAt === 'ankle' ? 'ankle' : p.equipAt === 'hip' ? 'hip' : undefined} />
    </g>
  );
}

function FrontFigure({ p, q, colors, eq }: { p: FrontPattern; q: FrontPose; colors: Colors; eq: string }) {
  const iron = 'url(#mo-iron)';
  const fill = (ms: MuscleId[]) => colors(ms) || iron;
  const legLen = 92;
  const ua = (s: 1 | -1): V => [s * Math.sin(rad(q.a)) * L.ua, Math.cos(rad(q.a)) * L.ua];
  const fa = (s: 1 | -1): V => [s * Math.sin(rad(q.f)) * L.fa, Math.cos(rad(q.f)) * L.fa];
  let hipY: number;
  let cx = p.at[0];
  if (p.anchor === 'feet') hipY = p.at[1] - legLen;
  else if (p.anchor === 'seat') hipY = p.at[1];
  else { const shY = p.at[1] - ua(1)[1] - fa(1)[1]; hipY = shY + L.torso; cx = p.at[0]; }
  const shY = hipY - L.torso - (q.sh ?? 0);
  const shL: V = [cx - 26, shY];
  const shR: V = [cx + 26, shY];
  if (p.anchor === 'hands') { const off = p.at[0] + 30 - (shR[0] + ua(1)[0] + fa(1)[0]); shL[0] += off; shR[0] += off; cx += off; }
  const eL = add(shL, mul(ua(1), 1)) as V; eL[0] = shL[0] - ua(1)[0];
  const eR = add(shR, ua(1));
  const wL: V = [eL[0] - fa(1)[0], eL[1] + fa(1)[1]];
  const wR = add(eR, fa(1));
  const hipL: V = [cx - 14, hipY];
  const hipR: V = [cx + 14, hipY];
  const seated = p.anchor === 'seat';
  const legR = q.legR ?? 0;
  const kneeL: V = seated ? [cx - 18, hipY + 6] : [cx - 16, hipY + 46];
  const kneeR: V = seated ? [cx + 18, hipY + 6] : [hipR[0] + Math.sin(rad(legR)) * 46, hipY + Math.cos(rad(legR)) * 46];
  const ankL: V = seated ? [cx - 20, hipY + 40] : [cx - 17, hipY + legLen - 4];
  const ankR: V = seated ? [cx + 20, hipY + 40] : [hipR[0] + Math.sin(rad(legR)) * 88, hipY + Math.cos(rad(legR)) * 88];
  const neck: V = [cx, shY - 6];
  const head: V = [cx, shY - 22];
  return (
    <g>
      {p.bar != null && <path d={`M40,${p.bar} L200,${p.bar}`} stroke="var(--mo-equip)" strokeWidth={5} strokeLinecap="round" />}
      {seated && <rect x={cx - 34} y={hipY + 8} width={68} height={8} rx={3} fill="var(--mo-equip)" />}
      {/* legs */}
      <path d={capsule(hipL, kneeL, 12, 8)} fill={fill(['quadriceps', 'adductors'])} />
      <path d={capsule(kneeL, ankL, 8, 5)} fill={fill(['calves'])} />
      <path d={capsule(hipR, kneeR, 12, 8)} fill={fill(['quadriceps', 'abductors', 'adductors'])} />
      <path d={capsule(kneeR, ankR, 8, 5)} fill={fill(['calves'])} />
      {/* torso V-taper */}
      <path d={poly([[cx - 30, shY + 2], [cx + 30, shY + 2], [cx + 22, shY + 30], [cx - 22, shY + 30]])} fill={fill(['chest'])} />
      <path d={poly([[cx - 22, shY + 30], [cx + 22, shY + 30], [cx + 16, hipY + 4], [cx - 16, hipY + 4]])} fill={fill(['abdominals'])} />
      <path d={poly([[cx - 30, shY + 4], [cx - 22, shY + 30], [cx - 18, shY + 44], [cx - 26, shY + 26]])} fill={fill(['lats'])} />
      <path d={poly([[cx + 30, shY + 4], [cx + 22, shY + 30], [cx + 18, shY + 44], [cx + 26, shY + 26]])} fill={fill(['lats'])} />
      <path d={poly([[cx - 8, shY - 8], [cx + 8, shY - 8], [cx + 24, shY + 2], [cx - 24, shY + 2]])} fill={fill(['traps'])} />
      <path d={capsule(neck, [cx, shY - 12], 6, 6)} fill={fill(['neck'])} />
      <circle cx={head[0]} cy={head[1]} r={L.head} fill={iron} />
      {/* arms */}
      {([[shL, eL, wL], [shR, eR, wR]] as [V, V, V][]).map(([s, e, w], i) => (
        <g key={i}>
          <path d={capsule(s, e, 7.5, 5.5)} fill={fill(['biceps', 'triceps'])} />
          <path d={capsule(e, w, 5.5, 4)} fill={fill(['forearms'])} />
          <circle cx={s[0]} cy={s[1]} r={10} fill={fill(['shoulders'])} />
          <Equip eq={eq} at={w} cable={p.cable ? [p.cable[0] + (i ? 40 : -40), p.cable[1]] : undefined} />
        </g>
      ))}
    </g>
  );
}

// ───────── Player ─────────

export type Phase = 'top' | 'ecc' | 'pause' | 'conc' | 'squeeze' | 'hold';

export interface MotionLabels { ecc: string; conc: string; pause: string; squeeze: string; hold: string; start: string; peak: string; rep: string; tempo: string }

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function MotionPlayer({ ex, labels, speed = 1, playing = true, at, pattern }: { ex: Exercise; labels: MotionLabels; speed?: number; playing?: boolean; at?: number; pattern?: string }) {
  const key = pattern ?? patternFor(ex);
  const p = P[key] ?? P.squat!;
  const mode = p.mode ?? 'reps';
  const ecc = 2.6;
  const pause = ex.star || ex.peak === 'L' ? 1 : 0.5;
  const conc = 1.2;
  const top = 0.5;
  const seq: { ph: Phase; d: number; from: 'a' | 'b'; to: 'a' | 'b' }[] =
    mode === 'hold' ? [{ ph: 'top', d: 1.2, from: 'a', to: 'a' }, { ph: 'ecc', d: 2, from: 'a', to: 'b' }, { ph: 'hold', d: 4, from: 'b', to: 'b' }, { ph: 'conc', d: 1.5, from: 'b', to: 'a' }]
      : mode === 'cycle' ? [{ ph: 'conc', d: 0.45, from: 'a', to: 'b' }, { ph: 'conc', d: 0.45, from: 'b', to: 'a' }]
      : p.concFirst
        ? [{ ph: 'pause', d: pause, from: 'a', to: 'a' }, { ph: 'conc', d: conc, from: 'a', to: 'b' }, { ph: 'squeeze', d: top, from: 'b', to: 'b' }, { ph: 'ecc', d: ecc, from: 'b', to: 'a' }]
        : [{ ph: 'top', d: top, from: 'a', to: 'a' }, { ph: 'ecc', d: ecc, from: 'a', to: 'b' }, { ph: 'pause', d: pause, from: 'b', to: 'b' }, { ph: 'conc', d: conc, from: 'b', to: 'a' }];
  const total = seq.reduce((s, x) => s + x.d, 0);
  const [t, setT] = useState(0);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) { last.current = null; return; }
    let raf = 0;
    const loop = (now: number) => {
      if (last.current != null) setT((x) => x + ((now - last.current!) / 1000) * speed);
      last.current = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); last.current = null; };
  }, [playing, speed]);

  const time = at ?? t;
  const rep = Math.floor(time / total) + 1;
  let local = time % total;
  let step = seq[0]!;
  for (const s of seq) { if (local <= s.d) { step = s; break; } local -= s.d; step = s; }
  const k = ease(Math.min(1, Math.max(0, local / step.d)));
  const from = step.from === 'a' ? p.a : p.b;
  const to = step.to === 'a' ? p.a : p.b;
  const q = mix(from as object, to as object, k);

  const pm = new Set(ex.pm);
  const sm = new Set(ex.sm);
  const active = step.ph === 'conc' || step.ph === 'ecc' || step.ph === 'pause' || step.ph === 'squeeze' || step.ph === 'hold';
  const colors: Colors = (ms) => (ms.some((m) => pm.has(m)) ? (active ? 'url(#mo-hot)' : 'var(--muscle-primary)') : ms.some((m) => sm.has(m)) ? 'var(--muscle-secondary)' : '');
  // Peak tension: lengthened exercises at the stretched end, shortened ones at the contracted end.
  const stretchEnd = p.concFirst ? 'a' : 'b';
  const atEnd = (end: 'a' | 'b') => step.from === end && step.to === end;
  const peak = mode === 'reps' && ((ex.peak === 'L' && atEnd(stretchEnd)) || (ex.peak === 'S' && atEnd(stretchEnd === 'a' ? 'b' : 'a')));
  const label = { top: labels.start, ecc: labels.ecc, pause: labels.pause, conc: labels.conc, squeeze: labels.squeeze, hold: labels.hold }[step.ph];
  const remaining = Math.max(0, step.d - local);
  const tempo = mode === 'reps' ? `${Math.round(ecc)}-${pause >= 1 ? 1 : 0}-${Math.round(conc)}-${p.concFirst ? 1 : 0}` : '';

  return (
    <div className="motion">
      <svg viewBox="0 0 240 230" role="img" aria-label={`${label}`}>
        <defs>
          <linearGradient id="mo-iron" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6b707a" /><stop offset="0.45" stopColor="#3f434b" /><stop offset="1" stopColor="#1c1e22" />
          </linearGradient>
          <linearGradient id="mo-iron-far" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a3d44" /><stop offset="1" stopColor="#131417" />
          </linearGradient>
          <linearGradient id="mo-hot" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff6a5c" /><stop offset="0.5" stopColor="#ff2d2d" /><stop offset="1" stopColor="#a30f0f" />
          </linearGradient>
          <filter id="mo-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="mo-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.04)" /></pattern>
        </defs>
        <rect width="240" height="230" fill="url(#mo-grid)" />
        <path d={`M0,${GROUND} L240,${GROUND}`} stroke="var(--line-strong)" strokeWidth={1} />
        <g filter={active ? 'url(#mo-glow)' : undefined}>
          {p.view === 'side'
            ? <SideFigure p={p} q={q as SidePose} colors={colors} eq={ex.eq} />
            : <FrontFigure p={p} q={q as FrontPose} colors={colors} eq={ex.eq} />}
        </g>
      </svg>
      <div className="mo-hud">
        <span className={`mo-phase mo-${step.ph}`}>{label} {mode !== 'cycle' && <b className="mono">{remaining.toFixed(1)}s</b>}</span>
        {peak && <span className="mo-peak">⚡ {labels.peak}</span>}
      </div>
      <div className="mo-foot mono">
        <span>{labels.rep} {mode === 'reps' ? rep : '—'}</span>
        {tempo && <span>{labels.tempo} {tempo}</span>}
      </div>
      <div className="mo-progress"><i style={{ width: `${((time % total) / total) * 100}%` }} /></div>
    </div>
  );
}
