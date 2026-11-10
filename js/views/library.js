// Biblioteca de exercícios: busca, filtros e página "como fazer" com fotos animadas.
import * as store from '../store.js';
import { render, esc, icon, sheet, fmtDate, fmtNum } from '../ui.js';
import { EXERCISES, EX_BY_ID, GROUPS, EQUIP, LEVELS, exImg } from '../data/exercises.js';
import { exerciseHistory, personalRecords } from '../stats.js';
import { lineChart } from '../charts.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function animHTML(id, { tag = true } = {}) {
  return `<div class="anim" data-anim>
    <img src="${exImg(id, 0)}" alt="Posição inicial" loading="lazy">
    <img class="f1" src="${exImg(id, 1)}" alt="Posição final" loading="lazy">
    ${tag ? '<span class="tag">▶ início ↔ fim · toque para pausar</span>' : ''}
  </div>`;
}

export function bindAnim(root) {
  root.querySelectorAll('[data-anim]').forEach((a) => {
    a.addEventListener('click', () => {
      if (!a.classList.contains('paused')) { a.classList.add('paused'); a.classList.remove('show1'); }
      else if (!a.classList.contains('show1')) a.classList.add('show1');
      else a.classList.remove('paused', 'show1');
      const tag = a.querySelector('.tag');
      if (tag) tag.textContent = !a.classList.contains('paused') ? '▶ início ↔ fim · toque para pausar' : a.classList.contains('show1') ? '⏸ posição final · toque' : '⏸ posição inicial · toque';
    });
  });
}

export function howToHTML(ex) {
  const unit = ex.u === 's' ? 'Isométrico / tempo' : ex.u === 'm' ? 'Cardio contínuo' : ex.lv ? LEVELS[ex.lv] : '';
  return `
    ${animHTML(ex.id)}
    <div class="row wrap gap-s mt">
      <span class="pill pink">${GROUPS[ex.g].emoji} ${GROUPS[ex.g].nome}</span>
      ${ex.s.filter((g) => GROUPS[g]).map((g) => `<span class="pill">${GROUPS[g].nome}</span>`).join('')}
      <span class="pill lilac">🏋️ ${EQUIP[ex.eq]}</span>
      <span class="pill yellow">${unit}</span>
    </div>
    <h3 class="mt-l">📋 Passo a passo</h3>
    <ol class="steps">${ex.st.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <h3 class="mt">✨ Dicas</h3>
    <ul class="list-ic good">${ex.t.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <h3 class="mt">⚠️ Erros comuns</h3>
    <ul class="list-ic bad">${ex.e.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    ${ex.x.length ? `<p class="tip mt">🩹 Cuidado se tiver dor em: ${ex.x.join(', ')}. Se doer, pare e procure orientação.</p>` : ''}`;
}

function filterList(q, group) {
  const nq = norm(q.trim());
  return EXERCISES.filter((e) =>
    (!group || e.g === group || (group === 'gluteos' && e.s.includes('gluteos') && e.g !== 'cardio')) &&
    (!nq || norm(e.n).includes(nq) || norm(GROUPS[e.g].nome).includes(nq) || norm(EQUIP[e.eq]).includes(nq)));
}

const chipsHTML = (group) => `<div class="chips">
  <button class="chip ${!group ? 'on' : ''}" data-g="">✨ Todos</button>
  ${Object.entries(GROUPS).map(([k, g]) => `<button class="chip ${group === k ? 'on' : ''}" data-g="${k}">${g.emoji} ${g.nome}</button>`).join('')}
</div>`;

export function libraryView(el) {
  let q = '';
  let group = sessionStorage.getItem('fofit:libGroup') || '';

  function drawList() {
    const list = filterList(q, group);
    const box = el.querySelector('#lib-list');
    render(box, list.length ? `<div class="grid2">${list.map((e) => `
      <a class="ex-card" href="#/ex/${encodeURIComponent(e.id)}" style="text-decoration:none;color:inherit">
        <img src="${exImg(e.id, 1)}" alt="" loading="lazy">
        <div class="b"><b>${esc(e.n)}</b><span class="tiny muted bold">${GROUPS[e.g].emoji} ${GROUPS[e.g].nome} · ${EQUIP[e.eq]}</span></div>
      </a>`).join('')}</div>` : '<div class="empty-state muted">Nenhum exercício encontrado 🥲</div>');
    el.querySelector('#lib-count').textContent = `${list.length} exercícios`;
  }

  render(el, `
    <div class="topbar"><h1>Exercícios</h1><span class="pill lilac" id="lib-count"></span></div>
    <div class="search mb">${icon('search', 20)}<input class="input" id="q" placeholder="Buscar: agachamento, supino, glúteo..." autocomplete="off"></div>
    <div id="chips">${chipsHTML(group)}</div>
    <div id="lib-list" class="mt-s"></div>
  `);
  el.querySelector('#q').addEventListener('input', (e) => { q = e.target.value; drawList(); });
  el.querySelector('#chips').addEventListener('click', (e) => {
    const c = e.target.closest('[data-g]');
    if (!c) return;
    group = c.dataset.g;
    try { sessionStorage.setItem('fofit:libGroup', group); } catch { /* ignora */ }
    render(el.querySelector('#chips'), chipsHTML(group));
    drawList();
  });
  drawList();
}

export function exerciseView(el, { id }) {
  const ex = EX_BY_ID[id];
  if (!ex) { render(el, '<p>Exercício não encontrado.</p>'); return; }
  const st = store.get();
  const hist = exerciseHistory(st.history, id);
  const pr = personalRecords(st.history)[id];

  render(el, `
    <div class="topbar"><button class="icon-btn" data-back aria-label="Voltar">${icon('back')}</button><h2 class="ellipsis">${esc(ex.n)}</h2></div>
    ${howToHTML(ex)}
    ${hist.length ? `
      <h3 class="mt-l">📈 Sua evolução</h3>
      <div class="card">
        ${pr ? `<div class="row between mb"><span class="pill yellow">🏆 Recorde: ${fmtNum(pr.kg, 1)} kg × ${pr.reps}</span><span class="small muted">1RM est. ${fmtNum(pr.e1rm, 1)} kg</span></div>` : ''}
        ${lineChart(hist.slice(-12).map((x) => ({ label: fmtDate(x.data), value: Math.round(x.best * 10) / 10 })), { unit: 'kg' })}
        <p class="tiny muted center">1RM estimado (fórmula de Epley)</p>
        ${hist.slice(-4).reverse().map((x) => `<div class="kv small"><span class="muted">${fmtDate(x.data, { day: '2-digit', month: 'short', year: '2-digit' })}</span><span class="bold">${x.sets.map((s) => `${fmtNum(s.kg, 1)}×${s.reps}`).join(' · ')}</span></div>`).join('')}
      </div>` : ''}
  `);
  el.querySelector('[data-back]').addEventListener('click', () => history.length > 1 ? history.back() : (location.hash = '#/exercicios'));
  bindAnim(el);
}

// Folha "como fazer" usada dentro do treino/editor.
export function openHowTo(id) {
  const ex = EX_BY_ID[id];
  const s = sheet(`<div class="row between mb"><h2 style="margin:0">${esc(ex.n)}</h2><button class="icon-btn soft" data-close aria-label="Fechar">${icon('x')}</button></div>${howToHTML(ex)}`);
  bindAnim(s);
}

// Seletor de exercícios (para montar treino, trocar ou adicionar durante o treino).
export function openPicker({ title = 'Adicionar exercício', group = '', exclude = [], onPick }) {
  let q = '';
  let g = group;
  const s = sheet(`<div class="row between mb"><h2 style="margin:0">${esc(title)}</h2><button class="icon-btn soft" data-close aria-label="Fechar">${icon('x')}</button></div>
    <div class="search mb">${icon('search', 20)}<input class="input" data-q placeholder="Buscar exercício" autocomplete="off"></div>
    <div data-chips></div><div data-list class="mt-s"></div>`);
  const draw = () => {
    render(s.querySelector('[data-chips]'), chipsHTML(g));
    const list = filterList(q, g).filter((e) => !exclude.includes(e.id));
    render(s.querySelector('[data-list]'), list.map((e) => `
      <div class="ex-row" data-pick="${esc(e.id)}">
        <img class="thumb" src="${exImg(e.id, 1)}" alt="" loading="lazy">
        <div class="grow"><b>${esc(e.n)}</b><div class="meta">${GROUPS[e.g].emoji} ${GROUPS[e.g].nome} · ${EQUIP[e.eq]}</div></div>
        <span class="icon-btn soft">${icon('plus', 20)}</span>
      </div>`).join('') || '<p class="muted center">Nada encontrado</p>');
  };
  s.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { q = e.target.value; draw(); } });
  s.addEventListener('click', (e) => {
    const c = e.target.closest('[data-g]');
    if (c) { g = c.dataset.g; draw(); return; }
    const p = e.target.closest('[data-pick]');
    if (p) { onPick(p.dataset.pick); s.close(); }
  });
  draw();
  return s;
}

