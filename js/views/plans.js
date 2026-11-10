// Treinos: lista de planos, detalhe de um dia e editor "montar treino".
import * as store from '../store.js';
import { render, esc, icon, go, toast, sheet, confirmSheet, mascot } from '../ui.js';
import { EX_BY_ID, GROUPS, exImg } from '../data/exercises.js';
import { generatePlan } from '../generator.js';
import { openHowTo, openPicker } from './library.js';
import { startSession } from './session.js';
import { estimateMinutes } from './home.js';

// Modelos prontos: perfis predefinidos passados ao gerador.
const TEMPLATES = [
  { emoji: '🐣', nome: 'Iniciante na academia', desc: 'Full body 3x · 45 min', p: { objetivo: 'hipertrofia', nivel: 1, dias: 3, duracao: 45, local: 'academia' } },
  { emoji: '🍑', nome: 'Foco em glúteos', desc: 'Sup/Inf 4x · 60 min', p: { objetivo: 'hipertrofia', nivel: 2, dias: 4, duracao: 60, local: 'academia', foco: ['gluteos', 'posterior'] } },
  { emoji: '🏠', nome: 'Em casa com halteres', desc: 'Full body 3x · 45 min', p: { objetivo: 'hipertrofia', nivel: 1, dias: 3, duracao: 45, local: 'casa' } },
  { emoji: '🤸', nome: 'Sem equipamento', desc: 'Full body 3x · 30 min', p: { objetivo: 'condicionamento', nivel: 1, dias: 3, duracao: 30, local: 'corporal' } },
  { emoji: '🔥', nome: 'Queima total', desc: 'Sup/Inf 4x + cardio · 60 min', p: { objetivo: 'emagrecer', nivel: 2, dias: 4, duracao: 60, local: 'academia' } },
  { emoji: '🏋️', nome: 'Força', desc: 'Sup/Inf 4x · 75 min', p: { objetivo: 'forca', nivel: 2, dias: 4, duracao: 75, local: 'academia' } },
  { emoji: '💪', nome: 'Push / Pull / Legs', desc: '6x · 60 min', p: { objetivo: 'hipertrofia', nivel: 3, dias: 6, duracao: 60, local: 'academia' } },
  { emoji: '⚡', nome: 'Treino rápido', desc: 'Full body 2x · 30 min', p: { objetivo: 'saude', nivel: 1, dias: 2, duracao: 30, local: 'academia' } },
];

function dayCard(plan, d) {
  return `<a class="card tight click row gap" href="#/dia/${plan.id}/${d.id}" style="text-decoration:none;color:inherit;margin-top:10px">
    <div class="row" style="width:62px;flex-shrink:0">${d.itens.slice(0, 2).map((i, k) => `<img src="${exImg(i.exId, 1)}" alt="" style="width:40px;height:40px;border-radius:12px;object-fit:cover;border:2px solid var(--card);${k ? 'margin-left:-18px' : ''}">`).join('')}</div>
    <div class="grow"><b>${esc(d.nome)}</b><div class="small muted ellipsis">${esc(d.sub || d.itens.map((i) => EX_BY_ID[i.exId]?.n).join(', '))}</div></div>
    <span class="pill lilac">${d.itens.length} ex</span>
  </a>`;
}

export function plansView(el) {
  const draw = () => {
    const st = store.get();
    const active = store.activePlan();
    const next = store.nextDay(active);
    const others = st.plans.filter((p) => p !== active);
    render(el, `
      <div class="topbar"><h1>Treinos</h1></div>
      ${active ? `
        <div class="card">
          <div class="row between"><span class="pill pink">⭐ Treino ativo</span>
            <div class="row gap-s"><button class="icon-btn soft" data-why aria-label="Por que esse treino?">${icon('info', 20)}</button><a class="icon-btn soft" href="#/editor/${active.id}" aria-label="Editar">${icon('edit', 20)}</a></div></div>
          <h2 class="mt-s">${esc(active.nome)}</h2>
          <p class="small muted" style="margin:0">${active.dias.length} treinos · próximo: <b>${esc(next?.nome || '-')}</b></p>
          ${active.dias.map((d) => dayCard(active, d)).join('')}
        </div>` : `<div class="empty-state">${mascot('uau', 90)}<p class="muted">Você ainda não tem treinos.</p></div>`}

      <div class="grid2 mt">
        <button class="card click center" data-new style="border:0"><div style="font-size:1.8rem">🧩</div><b>Montar do zero</b><div class="small muted">Escolha cada exercício</div></button>
        <button class="card click center" data-regen style="border:0"><div style="font-size:1.8rem">✨</div><b>Gerar personalizado</b><div class="small muted">Refazer questionário</div></button>
      </div>
      <button class="btn ghost block mt" data-free>${icon('play', 18)} Começar treino livre</button>

      ${others.length ? `<div class="section-title"><h3>Meus outros treinos</h3></div>
        ${others.map((p) => `<div class="card tight row gap" style="margin-top:10px">
          <div class="grow"><b>${esc(p.nome)}</b><div class="small muted">${p.dias.length} treinos</div></div>
          <button class="btn sm" data-activate="${p.id}">Usar</button>
          <a class="icon-btn soft" href="#/editor/${p.id}" aria-label="Editar">${icon('edit', 18)}</a>
          <button class="icon-btn soft" data-del="${p.id}" aria-label="Excluir">${icon('trash', 18)}</button>
        </div>`).join('')}` : ''}

      <div class="section-title"><h3>Modelos prontos</h3><span class="small muted bold">toque para usar</span></div>
      <div class="grid2">${TEMPLATES.map((t, i) => `
        <button class="card click" data-tpl="${i}" style="border:0;text-align:left"><div style="font-size:1.6rem">${t.emoji}</div><b>${esc(t.nome)}</b><div class="small muted">${esc(t.desc)}</div></button>`).join('')}
      </div>
    `);
  };

  el.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const st = store.get();
    if (t.dataset.why !== undefined) {
      const p = store.activePlan();
      sheet(`<h2>Por que esse treino? 🤓</h2>${(p.explicacao || ['Treino montado por você! Lembre de progredir as cargas aos poucos e treinar cada músculo ~2x por semana.']).map((x) => `<p>${esc(x)}</p>`).join('')}
        <a class="btn block mt" href="#/guia/montar-treino" data-close>Aprender a montar treinos</a>`);
    }
    if (t.dataset.new !== undefined) {
      const plan = { id: store.uid(), nome: 'Meu treino', gerado: false, criadoEm: Date.now(), dias: [{ id: store.uid(), nome: 'Treino A', sub: '', itens: [] }] };
      store.update((s) => { s.plans.unshift(plan); });
      go(`editor/${plan.id}`);
    }
    if (t.dataset.regen !== undefined) go('onboarding');
    if (t.dataset.free !== undefined) {
      if (st.session) { go('sessao'); return; }
      startSession(null, null); go('sessao');
    }
    if (t.dataset.activate) { store.update((s) => { s.activePlanId = t.dataset.activate; }); toast('Treino ativado ⭐'); draw(); }
    if (t.dataset.del) {
      if (await confirmSheet('Excluir treino?', 'Seu histórico continua salvo.', 'Excluir', true)) {
        store.update((s) => { s.plans = s.plans.filter((p) => p.id !== t.dataset.del); });
        draw();
      }
    }
    if (t.dataset.tpl) {
      const tpl = TEMPLATES[Number(t.dataset.tpl)];
      const prof = st.profile || {};
      const plan = generatePlan({ foco: [], dores: prof.dores || [], ...tpl.p });
      plan.nome = `${tpl.emoji} ${tpl.nome}`;
      plan.editado = true; // não é apagado ao refazer o questionário
      store.update((s) => { s.plans.unshift(plan); s.activePlanId = plan.id; });
      toast(`${tpl.nome} ativado! ✨`);
      draw();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  draw();
}

export function dayView(el, { planId, dayId }) {
  const plan = store.get().plans.find((p) => p.id === planId);
  const day = plan?.dias.find((d) => d.id === dayId);
  if (!day) { go('treinos'); return; }
  render(el, `
    <div class="topbar"><button class="icon-btn" data-back aria-label="Voltar">${icon('back')}</button><h2 class="ellipsis">${esc(day.nome)}</h2>
      <a class="icon-btn" href="#/editor/${plan.id}" aria-label="Editar">${icon('edit')}</a></div>
    <div class="row wrap gap-s mb"><span class="pill pink">${esc(day.sub || plan.nome)}</span><span class="pill lilac">⏱️ ~${estimateMinutes(day)} min</span><span class="pill mint">${day.itens.length} exercícios</span></div>
    <p class="small muted">Toque em um exercício para ver como fazer 📸</p>
    ${day.itens.map((it, i) => {
      const ex = EX_BY_ID[it.exId];
      const u = ex?.u === 's' ? 's' : ex?.u === 'm' ? ' min' : '';
      return `<div class="ex-row" data-howto="${esc(it.exId)}">
        <span class="num">${i + 1}</span>
        <img class="thumb" src="${exImg(it.exId, 1)}" alt="" loading="lazy">
        <div class="grow"><b>${esc(ex?.n || it.exId)}</b><div class="meta">${GROUPS[ex?.g]?.emoji || ''} ${it.series} × ${esc(it.reps)}${u}${it.descanso ? ` · ⏱️ ${it.descanso}s` : ''}</div></div>
      </div>`;
    }).join('') || '<p class="muted center">Nenhum exercício. Toque em editar ✏️</p>'}
    <div class="bottom-cta"><button class="btn lg block" data-start ${day.itens.length ? '' : 'disabled'}>${icon('play', 18)} Começar este treino</button></div>
  `);
  el.querySelector('[data-back]').addEventListener('click', () => go('treinos'));
  el.addEventListener('click', (e) => {
    const h = e.target.closest('[data-howto]');
    if (h) openHowTo(h.dataset.howto);
  });
  el.querySelector('[data-start]').addEventListener('click', async () => {
    if (store.get().session && !(await confirmSheet('Você já tem um treino em andamento', 'Deseja descartá-lo e começar este?', 'Começar este', true))) return;
    startSession(plan, day);
    go('sessao');
  });
}

export function editorView(el, { planId }) {
  const plan = store.get().plans.find((p) => p.id === planId);
  if (!plan) { go('treinos'); return; }
  let cur = 0;
  const save = () => store.update((s) => {
    const i = s.plans.findIndex((p) => p.id === plan.id);
    plan.editado = true;
    if (i >= 0) s.plans[i] = plan;
  });

  function draw() {
    const d = plan.dias[cur];
    render(el, `
      <div class="topbar"><button class="icon-btn" data-done aria-label="Concluir">${icon('back')}</button><h2>Montar treino</h2>
        <button class="btn sm" data-done>Salvar</button></div>
      <label class="field"><span>Nome do treino</span><input class="input" data-plan-name value="${esc(plan.nome)}" maxlength="40"></label>
      <div class="day-tabs">${plan.dias.map((x, i) => `<button class="${i === cur ? 'on' : ''}" data-day="${i}">${esc(x.nome)}</button>`).join('')}
        <button data-addday>${icon('plus', 16)}</button></div>
      ${d ? `
        <div class="card mt-s">
          <div class="grid2">
            <label class="field" style="margin:0"><span>Nome do dia</span><input class="input" data-day-name value="${esc(d.nome)}" maxlength="24"></label>
            <label class="field" style="margin:0"><span>Foco</span><input class="input" data-day-sub value="${esc(d.sub || '')}" placeholder="Ex.: Peito e tríceps" maxlength="40"></label>
          </div>
        </div>
        <div class="section-title"><h3>Exercícios (${d.itens.length})</h3>${plan.dias.length > 1 ? '<button class="link small" data-delday style="color:var(--danger)">Excluir dia</button>' : ''}</div>
        ${d.itens.map((it, i) => {
          const ex = EX_BY_ID[it.exId];
          return `<div class="edit-item" data-i="${i}">
            <div class="row gap">
              <img class="thumb" src="${exImg(it.exId, 1)}" alt="" style="width:52px;height:52px" data-howto="${esc(it.exId)}">
              <div class="grow"><b class="small" style="display:block;line-height:1.2">${esc(ex?.n || it.exId)}</b><span class="tiny muted bold">${GROUPS[ex?.g]?.emoji || ''} ${GROUPS[ex?.g]?.nome || ''}</span></div>
              <div class="col gap-s">
                <button class="icon-btn soft" style="width:32px;height:32px" data-mv="-1" aria-label="Subir">${icon('up', 16)}</button>
                <button class="icon-btn soft" style="width:32px;height:32px" data-mv="1" aria-label="Descer">${icon('down', 16)}</button>
              </div>
              <button class="icon-btn soft" style="width:32px;height:32px" data-rm aria-label="Remover">${icon('trash', 16)}</button>
            </div>
            <div class="mini-fields">
              <div><label>Séries</label><input inputmode="numeric" data-f="series" value="${esc(it.series)}"></div>
              <div><label>${ex?.u === 's' ? 'Segundos' : ex?.u === 'm' ? 'Minutos' : 'Reps'}</label><input data-f="reps" value="${esc(it.reps)}"></div>
              <div><label>Descanso (s)</label><input inputmode="numeric" data-f="descanso" value="${esc(it.descanso)}"></div>
            </div>
          </div>`;
        }).join('')}
        <button class="btn outline block mt" data-addex>${icon('plus', 18)} Adicionar exercício</button>
        <div class="card mt" style="background:var(--lilac-soft);box-shadow:none">
          <b>💡 Dicas para montar</b>
          <ul class="small" style="padding-left:18px;margin:6px 0 0">
            <li>Comece pelos exercícios compostos (agachamento, supino, remada).</li>
            <li>4–8 exercícios por treino é o suficiente.</li>
            <li>Mire em 10–20 séries por músculo na semana.</li>
          </ul>
          <a class="link small" href="#/guia/montar-treino">Ler o guia completo →</a>
        </div>` : ''}
    `);
  }

  el.addEventListener('input', (e) => {
    const t = e.target;
    const d = plan.dias[cur];
    if (t.matches('[data-plan-name]')) plan.nome = t.value;
    else if (t.matches('[data-day-name]')) { d.nome = t.value; const b = el.querySelector(`[data-day="${cur}"]`); if (b) b.textContent = t.value; }
    else if (t.matches('[data-day-sub]')) d.sub = t.value;
    else if (t.dataset.f) {
      const i = Number(t.closest('[data-i]').dataset.i);
      const f = t.dataset.f;
      d.itens[i][f] = f === 'reps' ? t.value : Math.max(0, parseInt(t.value) || 0);
    } else return;
    save();
  });

  el.addEventListener('click', async (e) => {
    const t = e.target.closest('button, [data-howto]');
    if (!t) return;
    const d = plan.dias[cur];
    if (t.dataset.howto) return openHowTo(t.dataset.howto);
    if (t.dataset.done !== undefined) {
      if (!plan.nome.trim()) plan.nome = 'Meu treino';
      plan.dias.forEach((x) => { x.itens.forEach((it) => { if (!it.series) it.series = 1; }); });
      const total = plan.dias.reduce((a, x) => a + x.itens.length, 0);
      if (!total) {
        store.update((s) => { s.plans = s.plans.filter((p) => p.id !== plan.id); });
        toast('Treino vazio descartado');
      } else {
        plan.dias = plan.dias.filter((x) => x.itens.length);
        save();
        if (store.get().activePlanId !== plan.id) {
          store.update((s) => { s.activePlanId = plan.id; });
          toast('Treino salvo e ativado ⭐');
        } else toast('Treino salvo 💾');
      }
      go('treinos'); return;
    }
    if (t.dataset.day) { cur = Number(t.dataset.day); return draw(); }
    if (t.dataset.addday !== undefined) {
      if (plan.dias.length >= 7) return toast('Máximo de 7 dias');
      plan.dias.push({ id: store.uid(), nome: `Treino ${String.fromCharCode(65 + plan.dias.length)}`, sub: '', itens: [] });
      cur = plan.dias.length - 1; save(); return draw();
    }
    if (t.dataset.delday !== undefined) {
      if (!(await confirmSheet(`Excluir ${d.nome}?`, 'Os exercícios deste dia serão removidos.', 'Excluir', true))) return;
      plan.dias.splice(cur, 1); cur = Math.max(0, cur - 1); save(); return draw();
    }
    const itemEl = t.closest('[data-i]');
    if (itemEl) {
      const i = Number(itemEl.dataset.i);
      if (t.dataset.rm !== undefined) { d.itens.splice(i, 1); save(); return draw(); }
      if (t.dataset.mv) {
        const j = i + Number(t.dataset.mv);
        if (j < 0 || j >= d.itens.length) return;
        [d.itens[i], d.itens[j]] = [d.itens[j], d.itens[i]];
        save(); return draw();
      }
    }
    if (t.dataset.addex !== undefined) {
      openPicker({
        exclude: d.itens.map((x) => x.exId),
        onPick: (id) => {
          const ex = EX_BY_ID[id];
          const comp = ['push_h', 'push_v', 'pull_v', 'pull_h', 'squat', 'hinge', 'lunge', 'glute'].includes(ex.p);
          d.itens.push(ex.u === 'm' ? { exId: id, series: 1, reps: '15', descanso: 0 }
            : ex.u === 's' ? { exId: id, series: 3, reps: '30-45', descanso: 45 }
            : { exId: id, series: 3, reps: comp ? '8-12' : '10-15', descanso: comp ? 90 : 60 });
          save(); draw(); toast(`${ex.n} adicionado ✅`);
        },
      });
    }
  });

  draw();
}
