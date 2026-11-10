// Gerador de treino personalizado.
// Regras baseadas nas recomendações do ACSM e em revisões sobre hipertrofia/força
// (ex.: Schoenfeld et al.): 10–20 séries semanais por músculo, cada músculo 2x/semana,
// exercícios compostos primeiro, faixa de repetições e descanso conforme o objetivo.
import { EXERCISES, GROUPS } from './data/exercises.js';
import { uid } from './store.js';

export const GOALS = {
  hipertrofia:     { nome: 'Ganhar massa', emoji: '💪', desc: 'Músculos maiores e mais definidos' },
  emagrecer:       { nome: 'Emagrecer', emoji: '🔥', desc: 'Perder gordura mantendo os músculos' },
  forca:           { nome: 'Ficar mais forte', emoji: '🏋️', desc: 'Levantar mais peso' },
  condicionamento: { nome: 'Condicionamento', emoji: '⚡', desc: 'Fôlego e resistência' },
  saude:           { nome: 'Saúde e bem-estar', emoji: '🌸', desc: 'Me mexer, ter disposição e qualidade de vida' },
};

export const PLACES = {
  academia: { nome: 'Academia completa', emoji: '🏢', eq: ['barra', 'halteres', 'maquina', 'cabo', 'corporal', 'kettlebell', 'barrafixa'] },
  casa:     { nome: 'Casa com halteres', emoji: '🏠', eq: ['halteres', 'corporal', 'kettlebell'] },
  corporal: { nome: 'Só peso do corpo', emoji: '🤸', eq: ['corporal'] },
};

export const PAINS = {
  joelho: 'Joelho',
  lombar: 'Lombar',
  ombro: 'Ombro',
  punho: 'Punho',
};

// Parâmetros por objetivo: [séries base, reps compostos, reps isolados, descanso compostos (s), descanso isolados (s)]
const PARAMS = {
  hipertrofia:     { sets: 3, repC: '8-12', repI: '10-15', restC: 90, restI: 60 },
  forca:           { sets: 4, repC: '4-6', repI: '8-12', restC: 180, restI: 90 },
  emagrecer:       { sets: 3, repC: '10-12', repI: '12-15', restC: 60, restI: 45 },
  condicionamento: { sets: 3, repC: '12-15', repI: '15-20', restC: 45, restI: 30 },
  saude:           { sets: 2, repC: '10-12', repI: '12-15', restC: 75, restI: 60 },
};

const COMPOUND = new Set(['push_h', 'push_v', 'pull_v', 'pull_h', 'squat', 'hinge', 'lunge', 'glute']);

// Modelos de dia: lista de "vagas" por padrão de movimento, em ordem de prioridade.
const DAY_TEMPLATES = {
  fullA: { nome: 'Corpo inteiro A', slots: ['squat', 'push_h', 'pull_v', 'hinge', 'push_v', 'core', 'biceps', 'triceps'] },
  fullB: { nome: 'Corpo inteiro B', slots: ['hinge', 'push_h', 'pull_h', 'lunge', 'delt_iso', 'core', 'triceps', 'biceps'] },
  fullC: { nome: 'Corpo inteiro C', slots: ['lunge', 'push_v', 'pull_v', 'glute', 'chest_iso', 'core', 'rear_delt', 'calves'] },
  push:  { nome: 'Empurrar (peito, ombro, tríceps)', slots: ['push_h', 'push_v', 'push_h', 'delt_iso', 'triceps', 'chest_iso', 'triceps'] },
  pull:  { nome: 'Puxar (costas, bíceps)', slots: ['pull_v', 'pull_h', 'rear_delt', 'biceps', 'pull_h', 'biceps', 'back_ext'] },
  legs:  { nome: 'Pernas e glúteos', slots: ['squat', 'hinge', 'lunge', 'quad_iso', 'ham_iso', 'calves', 'glute'] },
  upperA:{ nome: 'Superiores A', slots: ['push_h', 'pull_v', 'push_v', 'pull_h', 'delt_iso', 'biceps', 'triceps'] },
  upperB:{ nome: 'Superiores B', slots: ['pull_h', 'push_h', 'pull_v', 'push_v', 'rear_delt', 'triceps', 'biceps'] },
  lowerA:{ nome: 'Inferiores A', slots: ['squat', 'hinge', 'ham_iso', 'quad_iso', 'calves', 'core', 'glute_iso'] },
  lowerB:{ nome: 'Inferiores B', slots: ['hinge', 'lunge', 'glute', 'quad_iso', 'calves', 'core', 'ham_iso'] },
};

const SPLITS = {
  2: { nome: 'Full body 2x', dias: ['fullA', 'fullB'], porque: 'Com 2 dias, treinar o corpo inteiro em cada sessão garante que cada músculo seja estimulado 2x por semana.' },
  3: { nome: 'Full body 3x', dias: ['fullA', 'fullB', 'fullC'], porque: 'Com 3 dias, o full body trabalha cada músculo 3x por semana com volume moderado — ótimo para evoluir rápido.' },
  '3+': { nome: 'Push / Pull / Legs', dias: ['push', 'pull', 'legs'], porque: 'Para quem já tem experiência, dividir em empurrar, puxar e pernas permite mais volume por músculo em cada treino.' },
  4: { nome: 'Superiores / Inferiores', dias: ['upperA', 'lowerA', 'upperB', 'lowerB'], porque: 'Com 4 dias, alternar superiores e inferiores dá frequência 2x por semana e tempo de recuperação equilibrado.' },
  5: { nome: 'PPL + Sup/Inf', dias: ['push', 'pull', 'legs', 'upperA', 'lowerB'], porque: 'Com 5 dias, combinamos Push/Pull/Legs com Superiores/Inferiores: cada músculo treina ~2x por semana.' },
  6: { nome: 'Push / Pull / Legs 2x', dias: ['push', 'pull', 'legs', 'push', 'pull', 'legs'], porque: 'Com 6 dias, o PPL repetido trabalha cada músculo 2x por semana com bastante volume.' },
};

// Se não houver exercício para um padrão (ex.: sem máquinas), tenta um substituto.
const FALLBACK = {
  pull_v: ['pull_h'],
  chest_iso: ['push_h'],
  quad_iso: ['squat', 'lunge'],
  ham_iso: ['hinge', 'glute'],
  hinge: ['glute', 'back_ext'],
  back_ext: ['glute', 'core'],
  glute_iso: ['glute'],
  lat_iso: ['pull_h'],
  calves: ['lunge'],
  squat: ['lunge'],
  lunge: ['squat'],
  push_v: ['delt_iso', 'push_h'],
  rear_delt: ['pull_h'],
  triceps: ['push_h'],
  biceps: ['pull_h'],
  glute: ['lunge'],
  delt_iso: ['push_v'],
  cardio_long: ['cardio'],
};

// Padrão que representa cada grupo quando o usuário quer dar ênfase a ele.
const FOCUS_SLOT = {
  peito: 'chest_iso', costas: 'pull_h', ombros: 'delt_iso', biceps: 'biceps', triceps: 'triceps',
  quadriceps: 'quad_iso', posterior: 'ham_iso', gluteos: 'glute', panturrilha: 'calves', abdomen: 'core',
};
// Alternativa quando o dia já tem a vaga principal desse grupo.
const FOCUS_ALT = {
  peito: 'push_h', costas: 'pull_v', ombros: 'rear_delt', biceps: 'biceps', triceps: 'triceps',
  quadriceps: 'squat', posterior: 'hinge', gluteos: 'glute_iso', panturrilha: 'calves', abdomen: 'core',
};
const FOCUS_DAYS = {
  peito: ['push', 'upper', 'full'], costas: ['pull', 'upper', 'full'], ombros: ['push', 'upper', 'full'],
  biceps: ['pull', 'upper', 'full'], triceps: ['push', 'upper', 'full'], quadriceps: ['legs', 'lower', 'full'],
  posterior: ['legs', 'lower', 'full'], gluteos: ['legs', 'lower', 'full'], panturrilha: ['legs', 'lower', 'full'],
  abdomen: ['legs', 'lower', 'full', 'pull'],
};

const EX_COUNT = { 30: 4, 45: 5, 60: 6, 75: 7, 90: 8 };

export function generatePlan(profile) {
  const { objetivo = 'hipertrofia', nivel = 1, dias = 3, duracao = 60, local = 'academia', foco = [], dores = [] } = profile;
  const params = PARAMS[objetivo];
  const eqAllowed = new Set(PLACES[local].eq);
  const splitKey = dias === 3 && nivel >= 2 ? '3+' : String(Math.min(6, Math.max(2, dias)));
  const split = SPLITS[splitKey];
  const usage = new Map();
  const nBase = EX_COUNT[duracao] || 6;
  const addCardio = ['emagrecer', 'condicionamento', 'saude'].includes(objetivo);

  const candidates = (pattern, usedToday) =>
    EXERCISES.filter((e) =>
      e.p === pattern &&
      eqAllowed.has(e.eq) &&
      !e.x.some((x) => dores.includes(x)) &&
      e.lv <= Math.max(nivel + 1, 1) &&
      !usedToday.has(e.id));

  function pick(pattern, usedToday) {
    const tryPatterns = [pattern, ...(FALLBACK[pattern] || [])];
    for (const p of tryPatterns) {
      let list = candidates(p, usedToday);
      if (!list.length) continue;
      // Prefere o nível certo, depois o menos usado no plano (variedade entre dias A/B).
      list = list
        .map((e) => ({ e, score: (e.lv > nivel ? 10 : 0) + (usage.get(e.id) || 0) * 3 + (e.lv < nivel - 1 ? 1 : 0) }))
        .sort((a, b) => a.score - b.score || EXERCISES.indexOf(a.e) - EXERCISES.indexOf(b.e));
      return list[0].e;
    }
    return null;
  }

  function prescription(ex) {
    const comp = COMPOUND.has(ex.p);
    let series = params.sets + (nivel === 3 && comp ? 1 : 0);
    if (nivel === 1 && objetivo !== 'saude') series = Math.min(series, 3);
    if (ex.u === 'm') return { series: 1, reps: objetivo === 'emagrecer' ? '20-30' : '15-20', descanso: 0 };
    if (ex.u === 's') return { series: Math.min(series, 3), reps: objetivo === 'forca' ? '30-45' : '30-60', descanso: 45 };
    if (ex.p === 'core' || ex.p === 'calves') return { series: Math.min(series, 3), reps: '12-20', descanso: 45 };
    return {
      series,
      reps: comp ? params.repC : params.repI,
      descanso: comp ? params.restC : params.restI,
    };
  }

  const planDays = split.dias.map((tplKey, i) => {
    const tpl = DAY_TEMPLATES[tplKey];
    const kind = tplKey.replace(/[A-C]$/, '');
    const slots = [...tpl.slots];
    let max = nBase - (addCardio ? 1 : 0);

    // Ênfase: adiciona uma vaga extra para cada grupo de foco nos dias que treinam esse grupo.
    foco.forEach((g) => {
      if (FOCUS_SLOT[g] && FOCUS_DAYS[g]?.includes(kind)) {
        const slot = slots.includes(FOCUS_SLOT[g]) ? FOCUS_ALT[g] : FOCUS_SLOT[g];
        slots.splice(Math.min(3, slots.length), 0, slot);
        max += 1;
      }
    });

    const usedToday = new Set();
    const itens = [];
    for (const slot of slots) {
      if (itens.length >= max) break;
      const ex = pick(slot, usedToday);
      if (!ex) continue;
      usedToday.add(ex.id);
      usage.set(ex.id, (usage.get(ex.id) || 0) + 1);
      itens.push({ exId: ex.id, ...prescription(ex) });
    }

    // Muitas restrições podem deixar o dia curto: completa com opções seguras.
    for (const slot of ['core', 'glute', 'glute_iso', 'core', 'squat', 'push_h', 'pull_h']) {
      if (itens.length >= Math.min(4, max)) break;
      const ex = pick(slot, usedToday);
      if (!ex) continue;
      usedToday.add(ex.id);
      usage.set(ex.id, (usage.get(ex.id) || 0) + 1);
      itens.push({ exId: ex.id, ...prescription(ex) });
    }

    if (addCardio) {
      const ex = pick(local === 'academia' ? 'cardio_long' : 'cardio', usedToday);
      if (ex) {
        usage.set(ex.id, (usage.get(ex.id) || 0) + 1);
        const pr = prescription(ex);
        if (ex.u === 's') { pr.series = objetivo === 'condicionamento' ? 4 : 3; pr.reps = '30-40'; pr.descanso = 30; }
        itens.push({ exId: ex.id, ...pr });
      }
    }

    const letra = String.fromCharCode(65 + i);
    return { id: uid(), nome: `Treino ${letra}`, sub: tpl.nome, itens };
  });

  const focoTxt = foco.length ? ` com ênfase em ${foco.map((g) => GROUPS[g].nome.toLowerCase()).join(', ')}` : '';
  return {
    id: uid(),
    nome: `${GOALS[objetivo].nome} · ${split.nome}`,
    gerado: true,
    criadoEm: Date.now(),
    dias: planDays,
    explicacao: [
      `🗓️ ${split.porque}`,
      `🎯 Objetivo "${GOALS[objetivo].nome}": compostos com ${params.repC} repetições e ${params.restC}s de descanso; isolados com ${params.repI} repetições e ${params.restI}s.`,
      `📈 Use progressão dupla: quando completar todas as séries no topo da faixa de repetições, aumente a carga (2–5%).`,
      `😮‍💨 Termine cada série com 1–3 repetições "sobrando" (RIR 1–3). Não precisa ir à falha toda vez.`,
      addCardio ? '❤️ Incluímos cardio no final para gastar mais energia e melhorar o fôlego.' : '🧘 Aqueça 5–10 min antes e faça 1–2 séries leves do primeiro exercício.',
      dores.length ? `🩹 Evitamos exercícios que costumam incomodar: ${dores.map((d) => PAINS[d].toLowerCase()).join(', ')}.` : null,
      focoTxt ? `✨ Plano montado${focoTxt}.` : null,
    ].filter(Boolean),
  };
}

// Estimativa de 1RM (fórmula de Epley).
export const oneRM = (kg, reps) => (reps <= 1 ? kg : kg * (1 + reps / 30));

// Sugestão de progressão: compara a última sessão com a faixa de repetições prescrita.
export function progressionTip(item, last) {
  if (!last || !last.sets.length) return null;
  const [, max] = String(item.reps).split('-').map(Number);
  const top = max || Number(item.reps);
  const heaviest = Math.max(...last.sets.map((s) => Number(s.kg) || 0));
  const allTop = last.sets.length >= item.series && last.sets.every((s) => Number(s.reps) >= top);
  if (allTop && heaviest > 0) {
    const inc = heaviest >= 40 ? 2.5 : heaviest >= 10 ? 2 : 1;
    return { tipo: 'subir', texto: `Você bateu ${top} reps em todas as séries! Tente ${+(heaviest + inc).toFixed(1)} kg hoje 🚀` };
  }
  if (allTop) return { tipo: 'subir', texto: 'Você completou tudo! Tente uma variação mais difícil ou mais reps 🚀' };
  return { tipo: 'manter', texto: `Mantenha ${heaviest ? heaviest + ' kg' : 'a carga'} e tente fazer +1 repetição 💪` };
}
