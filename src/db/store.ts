// Application state: in-memory for instant reactivity, persisted to IndexedDB (debounced) — offline-first.
import { useSyncExternalStore } from 'react';
import { idbGet, idbSet, idbClear } from './idb';
import type { DietPlan, PhotoMeta, Profile, Program, Session, Settings, WeighIn } from '../core/types';

export interface RestState { until: number; total: number; label: string }

export interface AppState {
  v: 2;
  profile: Profile | null;
  settings: Settings;
  programs: Program[];
  activeProgramId: string | null;
  sessions: Session[]; // finished, newest first
  active: Session | null;
  rest: RestState | null;
  weighIns: WeighIn[];
  diet: DietPlan | null;
  dietMeals: number;
  photos: PhotoMeta[];
  videos: Record<string, string>; // exId -> blob key of the athlete's own execution video
  notes: Record<string, string>; // exId -> personal cue / machine setting
}

const detectLang = (): Settings['lang'] => {
  const l = (typeof navigator !== 'undefined' ? navigator.language : 'pt').toLowerCase();
  return l.startsWith('es') ? 'es' : l.startsWith('en') ? 'en' : 'pt';
};

export const initialState = (): AppState => ({
  v: 2,
  profile: null,
  settings: { lang: detectLang(), theme: 'dark', unit: 'kg', sound: true, haptics: true },
  programs: [],
  activeProgramId: null,
  sessions: [],
  active: null,
  rest: null,
  weighIns: [],
  diet: null,
  dietMeals: 5,
  photos: [],
  videos: {},
  notes: {},
});

let state: AppState = initialState();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const getState = (): AppState => state;

export function setState(fn: (draft: AppState) => AppState | void): void {
  const draft = structuredClone(state);
  const res = fn(draft);
  state = res ?? draft;
  listeners.forEach((l) => l());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 250);
}

export function persist(): Promise<void> {
  clearTimeout(saveTimer);
  return idbSet('kv', 'state', state).catch(() => undefined);
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export async function loadState(): Promise<void> {
  const saved = await idbGet<AppState>('kv', 'state');
  if (saved && saved.v === 2) state = { ...initialState(), ...saved, settings: { ...initialState().settings, ...saved.settings } };
  else migrateV1();
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void persist(); });
  }
}

/** Imports history and body weight from the first version of the app (Fofit, localStorage). */
function migrateV1(): void {
  try {
    const raw = localStorage.getItem('fofit:v1');
    if (!raw) return;
    const old = JSON.parse(raw) as { history?: { id: string; nome: string; inicio: number; fim: number; itens: { exId: string; sets: { kg: string; reps: string; done: boolean }[] }[] }[]; bodyLog?: { data: number; peso: number }[] };
    state.sessions = (old.history ?? []).map((h) => ({
      id: String(h.id), programId: null, dayId: null, name: String(h.nome), week: 1, deload: false,
      startedAt: Number(h.inicio), endedAt: Number(h.fim),
      items: (h.itens ?? []).map((it) => ({
        exId: String(it.exId), repMin: 8, repMax: 12, restSec: 90, rirTarget: 2,
        sets: (it.sets ?? []).map((s) => ({ kg: Number(s.kg) || null, reps: Number(s.reps) || null, rir: null, done: !!s.done })),
      })),
    }));
    state.weighIns = (old.bodyLog ?? []).map((b) => ({ date: new Date(b.data).toISOString().slice(0, 10), kg: Number(b.peso) })).filter((w) => w.kg > 0);
  } catch { /* ignore corrupt legacy data */ }
}

export async function resetAll(): Promise<void> {
  await idbClear();
  state = initialState();
  listeners.forEach((l) => l());
}

export const uid = (): string => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);

export const activeProgram = (s: AppState = state): Program | null =>
  s.programs.find((p) => p.id === s.activeProgramId) ?? s.programs[0] ?? null;

export function nextDay(s: AppState = state) {
  const p = activeProgram(s);
  if (!p || !p.days.length) return null;
  const last = s.sessions.find((x) => x.programId === p.id);
  if (!last) return p.days[0]!;
  const i = p.days.findIndex((d) => d.id === last.dayId);
  return p.days[(i + 1) % p.days.length]!;
}

/** Most recent completed sets for an exercise (the "Anterior" column). */
export function lastSets(exId: string, s: AppState = state) {
  for (const sess of s.sessions) {
    const it = sess.items.find((i) => i.exId === exId && i.sets.some((x) => x.done));
    if (it) return { at: sess.endedAt ?? sess.startedAt, sets: it.sets.filter((x) => x.done), repMin: it.repMin, repMax: it.repMax };
  }
  return null;
}

/** Validates a JSON backup before replacing the state. */
export function importBackup(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<AppState>;
  if (d.v !== 2 || !Array.isArray(d.sessions) || !Array.isArray(d.programs)) return false;
  const base = initialState();
  setState(() => ({
    ...base,
    profile: d.profile ?? null,
    settings: { ...base.settings, ...(d.settings ?? {}) },
    programs: d.programs ?? [],
    activeProgramId: typeof d.activeProgramId === 'string' ? d.activeProgramId : null,
    sessions: d.sessions ?? [],
    weighIns: Array.isArray(d.weighIns) ? d.weighIns.filter((w) => typeof w?.date === 'string' && Number(w.kg) > 0) : [],
    diet: d.diet ?? null,
    dietMeals: Number(d.dietMeals) || 5,
    photos: [],
    videos: {},
    notes: d.notes && typeof d.notes === 'object' ? d.notes : {},
  }));
  return true;
}
