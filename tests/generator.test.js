// Testa o gerador com todas as combinações de perfil.
import assert from 'node:assert/strict';
import { generatePlan, GOALS, PLACES, progressionTip } from '../js/generator.js';
import { EX_BY_ID } from '../js/data/exercises.js';

let n = 0;
for (const objetivo of Object.keys(GOALS))
  for (const local of Object.keys(PLACES))
    for (const nivel of [1, 2, 3])
      for (const dias of [2, 3, 4, 5, 6])
        for (const duracao of [30, 45, 60, 75])
          for (const dores of [[], ['joelho', 'lombar', 'ombro', 'punho']])
            for (const foco of [[], ['gluteos'], ['peito', 'biceps']]) {
              const plan = generatePlan({ objetivo, local, nivel, dias, duracao, dores, foco });
              assert.equal(plan.dias.length, dias);
              for (const d of plan.dias) {
                assert.ok(d.itens.length >= 3, `poucos exercícios: ${JSON.stringify({ objetivo, local, nivel, dias, duracao, dores, foco, d: d.sub, n: d.itens.length })}`);
                const ids = d.itens.map((i) => i.exId);
                assert.equal(new Set(ids).size, ids.length, 'exercício repetido no mesmo dia');
                for (const it of d.itens) {
                  const ex = EX_BY_ID[it.exId];
                  assert.ok(ex);
                  assert.ok(PLACES[local].eq.includes(ex.eq), `equipamento errado ${ex.id} em ${local}`);
                  assert.ok(!ex.x.some((x) => dores.includes(x)), `restrição ignorada ${ex.id}`);
                  assert.ok(it.series >= 1 && it.reps);
                }
              }
              n++;
            }
console.log(`✔ ${n} perfis gerados sem erros`);

const tip = progressionTip({ series: 3, reps: '8-12' }, { sets: [{ kg: 20, reps: 12 }, { kg: 20, reps: 12 }, { kg: 20, reps: 12 }] });
assert.equal(tip.tipo, 'subir');
console.log('✔ dica de progressão');

const ex = generatePlan({ objetivo: 'hipertrofia', local: 'academia', nivel: 2, dias: 4, duracao: 60, dores: [], foco: ['gluteos'] });
for (const d of ex.dias) console.log(d.nome, '-', d.sub, '\n   ', d.itens.map((i) => `${EX_BY_ID[i.exId].n} ${i.series}x${i.reps}`).join(' | '));
