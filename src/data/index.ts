// Exercise database access and localized helpers.
import raw from './exercises.json';
import type { Exercise, Lang, MuscleId } from '../core/types';

export const EXERCISES = raw as unknown as Exercise[];
export const EX_BY_ID: Record<string, Exercise | undefined> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const exName = (ex: Exercise | undefined, lang: Lang): string =>
  !ex ? '—' : lang === 'pt' ? ex.npt ?? ex.n : lang === 'es' ? ex.nes ?? ex.n : ex.n;

export const exImg = (id: string, frame: 0 | 1 = 0): string => `ex/${encodeURIComponent(id)}_${frame}.webp`;

export const MUSCLES: MuscleId[] = [
  'chest', 'lats', 'middle back', 'lower back', 'traps', 'shoulders', 'biceps', 'triceps', 'forearms',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'adductors', 'abductors', 'neck',
];

export const EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'kettlebells', 'e-z curl bar', 'bands', 'other'] as const;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function searchExercises(q: string, filter: { muscle?: MuscleId | ''; eq?: string; stretch?: boolean; cat?: string }): Exercise[] {
  const nq = norm(q.trim());
  const res = EXERCISES.filter((e) =>
    (!filter.muscle || e.pm.includes(filter.muscle)) &&
    (!filter.eq || e.eq === filter.eq) &&
    (!filter.stretch || e.star === 1 || (e.peak === 'L' && e.est === 0)) &&
    (!filter.cat || e.cat === filter.cat) &&
    (!nq || norm(e.n).includes(nq) || (e.npt && norm(e.npt).includes(nq)) || (e.nes && norm(e.nes).includes(nq))));
  // Curated and stretch-emphasis exercises first.
  return res.sort((a, b) => b.star - a.star || a.est - b.est || a.n.localeCompare(b.n));
}
