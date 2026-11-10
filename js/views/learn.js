// Aprender: guias educativos e calculadoras.
import * as store from '../store.js';
import { render, esc, icon, go, fmtNum, mascot } from '../ui.js';
import { GUIDES } from '../data/guides.js';
import { oneRM } from '../generator.js';

const CALCS = [
  { id: 'calorias', emoji: '🍽️', nome: 'Calorias e proteína', desc: 'Quanto comer por dia' },
  { id: 'imc', emoji: '⚖️', nome: 'IMC', desc: 'Índice de massa corporal' },
  { id: '1rm', emoji: '🏋️', nome: 'Carga máxima (1RM)', desc: 'E tabela de porcentagens' },
  { id: 'agua', emoji: '💧', nome: 'Água', desc: 'Hidratação diária' },
];

export function learnView(el) {
  render(el, `
    <div class="topbar"><h1>Aprender</h1></div>
    <div class="hero row gap">
      ${mascot('piscando', 72)}
      <div class="grow"><h2 style="margin:0 0 4px">Treinar com inteligência 🧠</h2><p class="small muted" style="margin:0">Guias curtinhos baseados em ciência para você entender o porquê de cada coisa.</p></div>
    </div>
    <div class="section-title"><h3>Guias</h3></div>
    <div class="grid2">${GUIDES.map((g) => `
      <a class="guide-card" href="#/guia/${g.id}" style="background:${g.cor};text-decoration:none">
        <span class="e">${g.emoji}</span><div><b>${esc(g.titulo)}</b><br><span>${esc(g.resumo)}</span></div>
      </a>`).join('')}</div>
    <div class="section-title"><h3>Calculadoras</h3></div>
    ${CALCS.map((c) => `<a class="card tight click row gap" href="#/calc/${c.id}" style="text-decoration:none;color:inherit;margin-top:10px">
      <div style="font-size:1.6rem;width:44px;height:44px;display:grid;place-items:center;background:var(--bg2);border-radius:14px">${c.emoji}</div>
      <div class="grow"><b>${c.nome}</b><div class="small muted">${c.desc}</div></div>${icon('back', 18).replace('class="ic"', 'class="ic" style="transform:rotate(180deg)"')}</a>`).join('')}
    <p class="tiny muted center mt-l">O Fofit é uma ferramenta educativa e não substitui orientação profissional de educação física, nutrição ou saúde.</p>
  `);
}

export function guideView(el, { id }) {
  const g = GUIDES.find((x) => x.id === id);
  if (!g) { go('aprender'); return; }
  const i = GUIDES.indexOf(g);
  const next = GUIDES[(i + 1) % GUIDES.length];
  // Conteúdo dos guias é estático (escrito no app), não vem do usuário.
  render(el, `
    <div class="topbar"><button class="icon-btn" data-back aria-label="Voltar">${icon('back')}</button><h2 class="ellipsis">${esc(g.titulo)}</h2></div>
    <div class="card center" style="background:${g.cor};color:#2f2236;box-shadow:none"><div style="font-size:3rem">${g.emoji}</div><b>${esc(g.resumo)}</b></div>
    <div class="article mt">${g.html}</div>
    <a class="card click row gap mt-l" href="#/guia/${next.id}" style="text-decoration:none;color:inherit">
      <span style="font-size:1.6rem">${next.emoji}</span><div class="grow"><div class="tiny muted bold">PRÓXIMO GUIA</div><b>${esc(next.titulo)}</b></div></a>
  `);
  el.querySelector('[data-back]').addEventListener('click', () => go('aprender'));
}

export function calcView(el, { id }) {
  const c = CALCS.find((x) => x.id === id);
  if (!c) { go('aprender'); return; }
  const p = store.get().profile || {};
  const peso = store.get().bodyLog.at(-1)?.peso || p.peso || '';
  const v = { peso, altura: p.altura || '', idade: p.idade || '', sexo: p.sexo || 'f', atividade: '1.55', objetivo: p.objetivo === 'emagrecer' ? 'perder' : p.objetivo === 'hipertrofia' ? 'ganhar' : 'manter', kg: '', reps: '' };

  const field = (k, label, ph = '') => `<label class="field"><span>${label}</span><input class="input" inputmode="decimal" data-k="${k}" value="${esc(v[k])}" placeholder="${ph}"></label>`;
  let form = '';
  if (id === 'imc') form = `<div class="grid2">${field('peso', 'Peso (kg)')}${field('altura', 'Altura (cm)')}</div>`;
  if (id === 'agua') form = field('peso', 'Peso (kg)');
  if (id === '1rm') form = `<div class="grid2">${field('kg', 'Carga (kg)', 'ex.: 40')}${field('reps', 'Repetições', 'ex.: 8')}</div>`;
  if (id === 'calorias') {
    form = `<div class="seg mb">${[['f', 'Feminino'], ['m', 'Masculino']].map(([k, n]) => `<button data-sexo="${k}" class="${v.sexo === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="grid2">${field('peso', 'Peso (kg)')}${field('altura', 'Altura (cm)')}${field('idade', 'Idade')}</div>
      <label class="field"><span>Nível de atividade</span><select class="input" data-k="atividade">
        ${[['1.2', 'Sedentário (pouco ou nenhum exercício)'], ['1.375', 'Leve (1–3 treinos/semana)'], ['1.55', 'Moderado (3–5 treinos/semana)'], ['1.725', 'Alto (6–7 treinos/semana)'], ['1.9', 'Muito alto (atleta / trabalho físico)']].map(([k, n]) => `<option value="${k}" ${v.atividade === k ? 'selected' : ''}>${n}</option>`).join('')}
      </select></label>
      <div class="seg">${[['perder', '🔥 Perder'], ['manter', '⚖️ Manter'], ['ganhar', '💪 Ganhar']].map(([k, n]) => `<button data-obj="${k}" class="${v.objetivo === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  }

  render(el, `
    <div class="topbar"><button class="icon-btn" data-back aria-label="Voltar">${icon('back')}</button><h2>${c.emoji} ${c.nome}</h2></div>
    <div class="card" data-form>${form}</div>
    <div data-out></div>
  `);

  const num = (k) => parseFloat(String(v[k]).replace(',', '.')) || 0;

  function compute() {
    let out = '';
    if (id === 'imc') {
      const a = num('altura') / 100;
      if (num('peso') && a) {
        const imc = num('peso') / (a * a);
        const cls = imc < 18.5 ? ['Abaixo do peso', '🌱'] : imc < 25 ? ['Peso normal', '💚'] : imc < 30 ? ['Sobrepeso', '🟡'] : ['Obesidade', '🟠'];
        out = `<div class="result-box"><span class="small">Seu IMC</span><b>${fmtNum(imc, 1)}</b><span>${cls[1]} ${cls[0]}</span></div>
          <p class="small muted mt">Faixa saudável para sua altura: <b>${fmtNum(18.5 * a * a, 1)} a ${fmtNum(24.9 * a * a, 1)} kg</b>.</p>
          <p class="tip">💡 O IMC não diferencia músculo de gordura. Pessoas musculosas podem ter IMC alto e estar saudáveis.</p>`;
      }
    }
    if (id === 'agua' && num('peso')) {
      const ml = num('peso') * 35;
      out = `<div class="result-box"><span class="small">Meta diária aproximada</span><b>${fmtNum(ml / 1000, 1)} litros</b><span>≈ ${Math.round(ml / 250)} copos de 250 ml</span></div>
        <p class="small muted mt">Some ~500 ml para cada hora de treino ou em dias quentes. Urina clarinha é um bom sinal 💛</p>`;
    }
    if (id === '1rm' && num('kg') && num('reps')) {
      const r = num('reps');
      const rm = oneRM(num('kg'), r);
      out = `<div class="result-box"><span class="small">1RM estimado</span><b>${fmtNum(rm, 1)} kg</b><span>Fórmula de Epley</span></div>
        ${r > 12 ? '<p class="tip mt">⚠️ Acima de 12 repetições a estimativa fica menos precisa.</p>' : ''}
        <div class="card mt"><h3>Tabela de cargas</h3>
        ${[[95, 2], [90, 4], [85, 6], [80, 8], [75, 10], [70, 12], [65, 15], [60, 18]].map(([pc, reps]) => `<div class="kv small"><span>${pc}% · ~${reps} reps</span><b>${fmtNum(rm * pc / 100, 1)} kg</b></div>`).join('')}
        </div>`;
    }
    if (id === 'calorias' && num('peso') && num('altura') && num('idade')) {
      // Mifflin-St Jeor
      const tmb = 10 * num('peso') + 6.25 * num('altura') - 5 * num('idade') + (v.sexo === 'm' ? 5 : -161);
      const get = tmb * parseFloat(v.atividade);
      const alvo = v.objetivo === 'perder' ? get - 400 : v.objetivo === 'ganhar' ? get + 250 : get;
      const prot = [1.6, 2.2].map((x) => x * num('peso'));
      out = `<div class="result-box"><span class="small">Meta diária</span><b>${fmtNum(Math.round(alvo / 10) * 10)} kcal</b><span>${v.objetivo === 'perder' ? 'déficit de ~400 kcal' : v.objetivo === 'ganhar' ? 'superávit de ~250 kcal' : 'manutenção'}</span></div>
        <div class="card mt">
          <div class="kv small"><span>Metabolismo basal (TMB)</span><b>${fmtNum(tmb)} kcal</b></div>
          <div class="kv small"><span>Gasto total (GET)</span><b>${fmtNum(get)} kcal</b></div>
          <div class="kv small"><span>🍗 Proteína</span><b>${fmtNum(prot[0])}–${fmtNum(prot[1])} g/dia</b></div>
          <div class="kv small"><span>💧 Água</span><b>${fmtNum(num('peso') * 0.035, 1)} L/dia</b></div>
        </div>
        <p class="tiny muted mt">Estimativa pela equação de Mifflin-St Jeor. Ajuste conforme sua evolução ao longo de 2–3 semanas. Para um plano individual, procure um(a) nutricionista.</p>`;
    }
    render(el.querySelector('[data-out]'), out || '<p class="muted center mt">Preencha os campos para ver o resultado ✨</p>');
  }

  el.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) { v[k] = e.target.value; compute(); } });
  el.addEventListener('change', (e) => { const k = e.target.dataset.k; if (k) { v[k] = e.target.value; compute(); } });
  el.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.back !== undefined) return go('aprender');
    if (t.dataset.sexo) { v.sexo = t.dataset.sexo; t.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === t)); compute(); }
    if (t.dataset.obj) { v.objetivo = t.dataset.obj; t.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === t)); compute(); }
  });
  compute();
}
