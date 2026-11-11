// Generates src/data/exercises.json from Free Exercise DB (public domain)
// + curated biomechanics (data/curated.mjs) + Portuguese coaching content (data/pt-content.json).
import fs from 'node:fs';
import { CURATED } from '../data/curated.mjs';

const src = JSON.parse(fs.readFileSync('data/free-exercise-db.json', 'utf8'));
const pt = JSON.parse(fs.readFileSync('data/pt-content.json', 'utf8'));

const LEVEL = { beginner: 1, intermediate: 2, expert: 3 };
const has = (name, words) => words.some((w) => name.includes(w));

// Heuristics for exercises without curated metadata (flagged with est: 1 in the output).
function estimate(e) {
  const n = e.name.toLowerCase();
  const compound = e.mechanic === 'compound';
  let peak = 'M';
  if (has(n, ['fly', 'flye', 'pullover', 'overhead', 'incline curl', 'incline dumbbell curl', 'preacher', 'stiff', 'romanian', 'deficit', 'lunge', 'split squat', 'squat', 'calf', 'good morning', 'french press', 'skullcrusher', 'stretch'])) peak = 'L';
  else if (has(n, ['kickback', 'shrug', 'leg extension', 'hip thrust', 'bridge', 'lateral raise', 'front raise', 'concentration', 'spider', 'row', 'abductor', 'crunch'])) peak = 'S';
  const cable = e.equipment === 'cable' || e.equipment === 'machine';
  const profile = cable ? 'F' : peak === 'L' ? 'D' : peak === 'S' ? 'A' : 'B';
  let cns = 1;
  if (['powerlifting', 'olympic weightlifting', 'strongman'].includes(e.category)) cns = 3;
  else if (compound && e.equipment === 'barbell') cns = 3;
  else if (compound) cns = 2;
  return { profile, peak, cns };
}

const out = src.map((e) => {
  const cur = CURATED[e.id];
  let meta;
  let names = {};
  if (cur) {
    const [ptName, esName, profile, peak, cns, star] = cur.split('|');
    meta = { profile, peak, cns: Number(cns), star: star === '★' ? 1 : 0, est: 0 };
    names = { pt: ptName, es: esName };
  } else {
    meta = { ...estimate(e), star: 0, est: 1 };
  }
  const coach = pt[e.id];
  return {
    id: e.id,
    n: e.name,
    ...(names.pt ? { npt: names.pt, nes: names.es } : {}),
    cat: e.category,
    eq: e.equipment || 'other',
    lv: LEVEL[e.level] || 1,
    mech: e.mechanic === 'compound' ? 'c' : e.mechanic === 'isolation' ? 'i' : null,
    force: e.force || null,
    pm: e.primaryMuscles,
    sm: e.secondaryMuscles,
    ins: e.instructions,
    ...(coach ? { pt: { st: coach.st, t: coach.t, e: coach.e } } : {}),
    ...meta,
  };
});

const missing = Object.keys(CURATED).filter((id) => !src.some((e) => e.id === id));
if (missing.length) throw new Error('Curated ids not found: ' + missing.join(', '));
fs.writeFileSync('src/data/exercises.json', JSON.stringify(out));
console.log(`${out.length} exercises, ${Object.keys(CURATED).length} curated, ${out.filter((e) => e.star).length} stretch picks`);
