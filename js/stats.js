// Cálculos de estatísticas, sequência e conquistas.
import { EX_BY_ID } from './data/exercises.js';
import { oneRM } from './generator.js';

export const DAY = 86400000;

export function weekStart(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export function sessionVolume(h) {
  let v = 0;
  for (const it of h.itens) for (const s of it.sets) if (s.done) v += (Number(s.kg) || 0) * (Number(s.reps) || 0);
  return v;
}

export const doneSets = (h) => h.itens.reduce((a, it) => a + it.sets.filter((s) => s.done).length, 0);

export function thisWeek(history) {
  const ws = weekStart();
  return history.filter((h) => h.fim >= ws);
}

// Semanas seguidas com pelo menos um treino (a semana atual conta se já tiver treino).
export function weekStreak(history) {
  if (!history.length) return 0;
  const weeks = new Set(history.map((h) => weekStart(h.fim)));
  let w = weekStart();
  if (!weeks.has(w)) w -= 7 * DAY;
  let n = 0;
  while (weeks.has(w)) { n++; w = weekStart(w - 3 * DAY); }
  return n;
}

// Melhor 1RM estimado por exercício, e a sessão em que aconteceu.
export function personalRecords(history) {
  const pr = {};
  for (const h of [...history].reverse()) {
    for (const it of h.itens) {
      for (const s of it.sets) {
        if (!s.done || !Number(s.kg)) continue;
        const e = oneRM(Number(s.kg), Number(s.reps) || 1);
        if (!pr[it.exId] || e > pr[it.exId].e1rm) pr[it.exId] = { e1rm: e, kg: Number(s.kg), reps: Number(s.reps), data: h.fim, histId: h.id };
      }
    }
  }
  return pr;
}

// Recordes batidos em uma sessão específica (comparado ao histórico anterior).
export function sessionPRs(history, session) {
  const before = personalRecords(history.filter((h) => h.fim < session.fim));
  const out = [];
  for (const it of session.itens) {
    let best = null;
    for (const s of it.sets) {
      if (!s.done || !Number(s.kg)) continue;
      const e = oneRM(Number(s.kg), Number(s.reps) || 1);
      if (!best || e > best.e) best = { e, kg: s.kg, reps: s.reps };
    }
    if (best && (!before[it.exId] || best.e > before[it.exId].e1rm + 0.01)) {
      out.push({ exId: it.exId, nome: EX_BY_ID[it.exId]?.n || it.exId, ...best, primeiro: !before[it.exId] });
    }
  }
  return out;
}

export function exerciseHistory(history, exId) {
  return history
    .filter((h) => h.itens.some((i) => i.exId === exId && i.sets.some((s) => s.done)))
    .map((h) => {
      const sets = h.itens.find((i) => i.exId === exId).sets.filter((s) => s.done);
      const best = Math.max(...sets.map((s) => oneRM(Number(s.kg) || 0, Number(s.reps) || 1)));
      const maxKg = Math.max(...sets.map((s) => Number(s.kg) || 0));
      return { data: h.fim, sets, best, maxKg };
    })
    .reverse();
}

export function badges(state) {
  const h = state.history;
  const total = h.length;
  const vol = h.reduce((a, x) => a + sessionVolume(x), 0);
  const streak = weekStreak(h);
  const prs = Object.keys(personalRecords(h)).length;
  const early = h.some((x) => new Date(x.inicio).getHours() < 7);
  const night = h.some((x) => new Date(x.inicio).getHours() >= 21);
  const long = h.some((x) => x.fim - x.inicio >= 75 * 60000);
  return [
    { id: 'first', emoji: '🌱', nome: 'Primeiro treino', on: total >= 1 },
    { id: 't10', emoji: '🔟', nome: '10 treinos', on: total >= 10 },
    { id: 't25', emoji: '🏅', nome: '25 treinos', on: total >= 25 },
    { id: 't50', emoji: '🏆', nome: '50 treinos', on: total >= 50 },
    { id: 't100', emoji: '👑', nome: '100 treinos', on: total >= 100 },
    { id: 's2', emoji: '🔥', nome: '2 semanas seguidas', on: streak >= 2 },
    { id: 's4', emoji: '🌟', nome: '1 mês seguido', on: streak >= 4 },
    { id: 's12', emoji: '💎', nome: '3 meses seguidos', on: streak >= 12 },
    { id: 'v1', emoji: '🐘', nome: '1 tonelada', on: vol >= 1000 },
    { id: 'v10', emoji: '🦕', nome: '10 toneladas', on: vol >= 10000 },
    { id: 'v100', emoji: '🚀', nome: '100 toneladas', on: vol >= 100000 },
    { id: 'pr5', emoji: '📈', nome: 'Recordes em 5 exercícios', on: prs >= 5 },
    { id: 'early', emoji: '🌅', nome: 'Madrugador(a)', on: early },
    { id: 'night', emoji: '🌙', nome: 'Coruja', on: night },
    { id: 'long', emoji: '⏳', nome: 'Treino maratona', on: long },
    { id: 'plan', emoji: '🧩', nome: 'Montou um treino', on: state.plans.some((p) => !p.gerado || p.editado) },
  ];
}
