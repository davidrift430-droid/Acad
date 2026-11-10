// Estado do app salvo no próprio aparelho (localStorage).
const KEY = 'fofit:v1';

const DEFAULT = {
  profile: null,          // preenchido no onboarding
  plans: [],              // treinos (gerados ou montados)
  activePlanId: null,
  history: [],            // sessões concluídas
  bodyLog: [],            // { data, peso }
  session: null,          // treino em andamento
  settings: { tema: 'auto', som: true, vibrar: true },
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return { ...structuredClone(DEFAULT), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Não foi possível salvar', err);
  }
  listeners.forEach((fn) => fn(state));
}

export const get = () => state;

export function update(fn) {
  fn(state);
  save();
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Backup importado: mantém só campos conhecidos e IDs seguros.
const safeId = (v) => (typeof v === 'string' && /^[\w-]{1,80}$/.test(v) ? v : uid());
const arr = (v) => (Array.isArray(v) ? v : []);
function sanitize(d) {
  const numStr = (v) => String(v ?? '').replace(/[^\d.,-]/g, '').slice(0, 8);
  const set = (x) => ({ kg: numStr(x?.kg), reps: numStr(x?.reps), done: !!x?.done });
  const item = (it) => ({
    exId: String(it?.exId ?? ''), series: Number(it?.series) || 1, reps: String(it?.reps ?? '').slice(0, 12),
    descanso: Number(it?.descanso) || 0, sets: arr(it?.sets).map(set),
  });
  const pr = d.profile && typeof d.profile === 'object' ? d.profile : null;
  const keys = (v) => arr(v).filter((k) => typeof k === 'string' && /^[a-z]+$/.test(k));
  return {
    profile: pr && {
      ...pr, nome: String(pr.nome ?? '').slice(0, 30), nivel: Number(pr.nivel) || 1, dias: Number(pr.dias) || 3,
      duracao: Number(pr.duracao) || 60, foco: keys(pr.foco), dores: keys(pr.dores),
      objetivo: ['hipertrofia', 'emagrecer', 'forca', 'condicionamento', 'saude'].includes(pr.objetivo) ? pr.objetivo : 'hipertrofia',
      local: ['academia', 'casa', 'corporal'].includes(pr.local) ? pr.local : 'academia',
    },
    plans: arr(d.plans).map((p) => ({ ...p, id: safeId(p.id), dias: arr(p.dias).map((dd) => ({ ...dd, id: safeId(dd.id), itens: arr(dd.itens).map(item) })) })),
    activePlanId: typeof d.activePlanId === 'string' ? d.activePlanId : null,
    history: arr(d.history).map((h) => ({ ...h, id: safeId(h.id), inicio: Number(h.inicio) || 0, fim: Number(h.fim) || 0, itens: arr(h.itens).map(item) })),
    bodyLog: arr(d.bodyLog).filter((b) => Number(b?.peso)).map((b) => ({ data: Number(b.data) || Date.now(), peso: Number(b.peso) })),
    session: null,
    settings: { ...DEFAULT.settings, ...(d.settings || {}) },
  };
}

export function replaceAll(data) {
  state = sanitize(data);
  save();
}

export function resetAll() {
  state = structuredClone(DEFAULT);
  save();
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function activePlan() {
  return state.plans.find((p) => p.id === state.activePlanId) || state.plans[0] || null;
}

// Próximo dia do treino ativo: o dia seguinte ao último concluído desse plano.
export function nextDay(plan = activePlan()) {
  if (!plan || !plan.dias.length) return null;
  const last = state.history.find((h) => h.planId === plan.id);
  if (!last) return plan.dias[0];
  const idx = plan.dias.findIndex((d) => d.id === last.dayId);
  return plan.dias[(idx + 1) % plan.dias.length];
}

// Última vez que um exercício foi feito (para mostrar e sugerir progressão).
export function lastPerformance(exId) {
  for (const h of state.history) {
    const it = h.itens.find((i) => i.exId === exId && i.sets.some((s) => s.done));
    if (it) return { data: h.fim, sets: it.sets.filter((s) => s.done) };
  }
  return null;
}
