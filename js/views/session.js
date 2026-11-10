// Treino em andamento: registrar séries, cargas, descanso automático e resumo final.
import * as store from '../store.js';
import { render, toNodes, esc, icon, go, toast, confirmSheet, confetti, beep, vibrate, fmtTime, fmtNum, mascot, sheet } from '../ui.js';
import { EX_BY_ID, GROUPS, exImg } from '../data/exercises.js';
import { progressionTip } from '../generator.js';
import { sessionPRs, sessionVolume, doneSets } from '../stats.js';
import { openHowTo, openPicker } from './library.js';

function newItem(it) {
  const last = store.lastPerformance(it.exId);
  const ex = EX_BY_ID[it.exId];
  return {
    exId: it.exId,
    series: Number(it.series) || 3,
    reps: it.reps || '10',
    descanso: Number(it.descanso ?? 60),
    sets: Array.from({ length: Number(it.series) || 3 }, (_, i) => {
      const prev = last?.sets[i] || last?.sets.at(-1);
      return { kg: ex?.u ? '' : (prev?.kg ?? ''), reps: '', done: false, prev: prev ? { kg: prev.kg, reps: prev.reps } : null };
    }),
  };
}

export function startSession(plan, day) {
  store.update((s) => {
    s.session = {
      id: store.uid(),
      planId: plan?.id || null,
      dayId: day?.id || null,
      nome: day?.nome || 'Treino livre',
      sub: day?.sub || '',
      inicio: Date.now(),
      itens: (day?.itens || []).map(newItem),
      rest: null,
    };
  });
}

const unitLabel = (ex) => (ex?.u === 's' ? 'seg' : ex?.u === 'm' ? 'min' : 'reps');

export function sessionView(el) {
  let sess = store.get().session;
  if (!sess) { go(''); return; }
  let wakeLock = null;
  try { navigator.wakeLock?.request('screen').then((w) => { wakeLock = w; }).catch(() => {}); } catch { /* ignora */ }

  const totals = () => {
    const all = sess.itens.reduce((a, it) => a + it.sets.length, 0);
    const done = sess.itens.reduce((a, it) => a + it.sets.filter((s) => s.done).length, 0);
    return { all, done };
  };
  const persist = () => store.update((s) => { s.session = sess; });

  function itemHTML(it, idx) {
    const ex = EX_BY_ID[it.exId];
    const tip = progressionTip(it, store.lastPerformance(it.exId));
    const u = unitLabel(ex);
    const noKg = ex?.u === 'm' || ex?.u === 's';
    const allDone = it.sets.length && it.sets.every((s) => s.done);
    return `<div class="card mt" data-item="${idx}" style="${allDone ? 'outline:2.5px solid var(--mint)' : ''}">
      <div class="row gap">
        <img class="thumb" src="${exImg(it.exId, 1)}" alt="" data-howto="${idx}" style="cursor:pointer">
        <div class="grow">
          <div class="tiny muted bold">${idx + 1}/${sess.itens.length} · ${GROUPS[ex?.g]?.emoji || ''} ${GROUPS[ex?.g]?.nome || ''}</div>
          <b style="font-size:1.05rem;line-height:1.2;display:block">${esc(ex?.n || it.exId)}</b>
          <div class="small muted bold">${it.series} × ${esc(it.reps)} ${u}${it.descanso ? ` · ⏱️ ${it.descanso}s` : ''}</div>
        </div>
        <button class="icon-btn soft" data-menu="${idx}" aria-label="Opções">⋯</button>
      </div>
      <button class="link small mt-s" data-howto="${idx}">📸 Ver como fazer</button>
      ${tip && !noKg ? `<div class="tip ${tip.tipo === 'subir' ? 'up' : ''} mt-s">${esc(tip.texto)}</div>` : ''}
      <table class="set-table mt-s">
        <thead><tr><th>Série</th><th>Anterior</th>${noKg ? '' : '<th>kg</th>'}<th>${u}</th><th></th></tr></thead>
        <tbody>${it.sets.map((s, si) => `
          <tr class="${s.done ? 'done' : ''}" data-set="${si}">
            <td class="n">${si + 1}</td>
            <td class="prev">${s.prev ? (noKg ? esc(s.prev.reps) : `${fmtNum(s.prev.kg, 1)}×${esc(s.prev.reps)}`) : '—'}</td>
            ${noKg ? '' : `<td><input class="set-input" inputmode="decimal" data-k="kg" value="${esc(s.kg)}" placeholder="${s.prev ? esc(s.prev.kg) : 'kg'}"></td>`}
            <td><input class="set-input" inputmode="numeric" data-k="reps" value="${esc(s.reps)}" placeholder="${esc(String(it.reps).split('-').pop())}"></td>
            <td><button class="check" data-check aria-label="Concluir série">${icon('check', 20)}</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="row gap-s mt-s">
        <button class="btn ghost sm grow" data-addset="${idx}">${icon('plus', 16)} Série</button>
        ${it.sets.length > 1 ? `<button class="btn ghost sm" data-delset="${idx}">− Série</button>` : ''}
      </div>
    </div>`;
  }

  function draw() {
    const { all, done } = totals();
    render(el, `
      <div class="session-head">
        <div class="row gap">
          <button class="icon-btn soft" data-home aria-label="Minimizar">${icon('down')}</button>
          <div class="grow"><b class="ellipsis" style="display:block">${esc(sess.nome)}</b><span class="small muted bold" data-elapsed>${fmtTime((Date.now() - sess.inicio) / 1000)}</span></div>
          <button class="btn mint sm" data-finish>${icon('check', 16)} Concluir</button>
        </div>
        <div class="progress mt-s"><i data-prog style="width:${all ? (done / all) * 100 : 0}%"></i></div>
      </div>
      ${sess.itens.length ? '' : `<div class="empty-state">${mascot('uau', 90)}<p class="muted">Treino livre! Adicione exercícios abaixo.</p></div>`}
      <div data-items>${sess.itens.map(itemHTML).join('')}</div>
      <button class="btn outline block mt" data-addex>${icon('plus', 18)} Adicionar exercício</button>
      <button class="btn ghost block mt-s" data-cancel style="color:var(--danger)">Descartar treino</button>
      <div class="rest" data-rest>
        <div class="col"><span class="tiny bold" style="opacity:.7">DESCANSO</span><span class="t" data-rest-t>0:00</span></div>
        <div class="row gap-s grow" style="justify-content:flex-end">
          <button data-rest-add="-15">−15</button><button data-rest-add="15">+15</button><button data-rest-skip>Pular</button>
        </div>
        <div class="bar"><i data-rest-bar></i></div>
      </div>
    `);
    tick();
  }

  function updateProgress() {
    const { all, done } = totals();
    const bar = el.querySelector('[data-prog]');
    if (bar) bar.style.width = `${all ? (done / all) * 100 : 0}%`;
  }

  function startRest(sec) {
    if (!sec) return;
    sess.rest = { until: Date.now() + sec * 1000, total: sec };
    persist();
    tick();
  }

  function tick() {
    const e = el.querySelector('[data-elapsed]');
    if (e) e.textContent = fmtTime((Date.now() - sess.inicio) / 1000);
    const box = el.querySelector('[data-rest]');
    if (!box) return;
    if (sess.rest) {
      const left = (sess.rest.until - Date.now()) / 1000;
      if (left <= 0) {
        sess.rest = null;
        persist();
        box.classList.remove('show');
        const set = store.get().settings;
        if (set.som) beep();
        if (set.vibrar) vibrate([200, 100, 200]);
        toast('⏰ Descanso acabou! Próxima série 💪');
        return;
      }
      box.classList.add('show');
      el.querySelector('[data-rest-t]').textContent = fmtTime(left);
      el.querySelector('[data-rest-bar]').style.width = `${(left / sess.rest.total) * 100}%`;
    } else box.classList.remove('show');
  }

  const iv = setInterval(tick, 500);

  el.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-k]');
    if (!inp) return;
    const idx = Number(inp.closest('[data-item]').dataset.item);
    const si = Number(inp.closest('[data-set]').dataset.set);
    sess.itens[idx].sets[si][inp.dataset.k] = inp.value.replace(',', '.');
    persist();
  });

  el.addEventListener('click', async (e) => {
    const t = e.target.closest('button, [data-howto]');
    if (!t) return;
    const itemEl = t.closest('[data-item]');
    const idx = itemEl ? Number(itemEl.dataset.item) : null;

    if (t.dataset.howto !== undefined) return openHowTo(sess.itens[Number(t.dataset.howto)].exId);
    if (t.dataset.home !== undefined) return go('');

    if (t.dataset.check !== undefined) {
      const row = t.closest('[data-set]');
      const si = Number(row.dataset.set);
      const it = sess.itens[idx];
      const s = it.sets[si];
      if (!s.done) {
        // Preenche com o sugerido se a pessoa não digitou.
        if (s.reps === '') s.reps = String(it.reps).split('-').pop();
        if (s.kg === '' && !EX_BY_ID[it.exId]?.u) s.kg = it.sets[si - 1]?.kg || s.prev?.kg || '';
        s.done = true;
        vibrate(30);
        persist();
        // Atualiza só este card para não perder o foco.
        itemEl.replaceWith(toNodes(itemHTML(it, idx).trim())[0]);
        updateProgress();
        const { all, done } = totals();
        if (done === all) { toast('Tudo feito! Toque em Concluir 🎉'); sess.rest = null; persist(); tick(); }
        else startRest(it.descanso);
      } else {
        s.done = false;
        persist();
        row.classList.remove('done');
        itemEl.style.outline = '';
        updateProgress();
      }
      return;
    }

    if (t.dataset.addset !== undefined) {
      const it = sess.itens[idx];
      const lastSet = it.sets.at(-1);
      it.sets.push({ kg: lastSet?.kg ?? '', reps: '', done: false, prev: lastSet?.prev || null });
      persist(); return draw();
    }
    if (t.dataset.delset !== undefined) {
      sess.itens[idx].sets.pop();
      persist(); return draw();
    }
    if (t.dataset.menu !== undefined) {
      const it = sess.itens[idx];
      const s = sheet(`<h3>${esc(EX_BY_ID[it.exId]?.n)}</h3>
        <div class="col gap mt">
          <button class="btn ghost block" data-a="howto">📸 Como fazer</button>
          <button class="btn ghost block" data-a="swap">${icon('swap', 18)} Trocar exercício</button>
          <button class="btn ghost block" data-a="up">${icon('up', 18)} Mover para cima</button>
          <button class="btn ghost block" data-a="down">${icon('down', 18)} Mover para baixo</button>
          <button class="btn ghost block" data-a="del" style="color:var(--danger)">${icon('trash', 18)} Remover do treino</button>
        </div>`);
      s.addEventListener('click', (ev) => {
        const a = ev.target.closest('[data-a]')?.dataset.a;
        if (!a) return;
        s.close();
        if (a === 'howto') openHowTo(it.exId);
        if (a === 'swap') {
          openPicker({
            title: 'Trocar por...', group: EX_BY_ID[it.exId]?.g || '', exclude: sess.itens.map((x) => x.exId),
            onPick: (id) => { sess.itens[idx] = newItem({ ...it, exId: id }); persist(); draw(); toast('Exercício trocado 🔁'); },
          });
        }
        if (a === 'up' && idx > 0) { [sess.itens[idx - 1], sess.itens[idx]] = [sess.itens[idx], sess.itens[idx - 1]]; persist(); draw(); }
        if (a === 'down' && idx < sess.itens.length - 1) { [sess.itens[idx + 1], sess.itens[idx]] = [sess.itens[idx], sess.itens[idx + 1]]; persist(); draw(); }
        if (a === 'del') { sess.itens.splice(idx, 1); persist(); draw(); }
      });
      return;
    }
    if (t.dataset.addex !== undefined) {
      return openPicker({
        exclude: sess.itens.map((x) => x.exId),
        onPick: (id) => {
          const ex = EX_BY_ID[id];
          sess.itens.push(newItem({ exId: id, series: ex.u === 'm' ? 1 : 3, reps: ex.u === 'm' ? '15' : ex.u === 's' ? '30-45' : '8-12', descanso: ex.u === 'm' ? 0 : 60 }));
          persist(); draw();
          setTimeout(() => el.querySelector(`[data-item="${sess.itens.length - 1}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        },
      });
    }
    if (t.dataset.restAdd) {
      if (sess.rest) { sess.rest.until += Number(t.dataset.restAdd) * 1000; sess.rest.total = Math.max(sess.rest.total, (sess.rest.until - Date.now()) / 1000); persist(); tick(); }
      return;
    }
    if (t.dataset.restSkip !== undefined) { sess.rest = null; persist(); tick(); return; }

    if (t.dataset.cancel !== undefined) {
      if (await confirmSheet('Descartar treino?', 'Os registros deste treino serão perdidos.', 'Descartar', true)) {
        store.update((s) => { s.session = null; });
        go('');
      }
      return;
    }
    if (t.dataset.finish !== undefined) {
      const { all, done } = totals();
      if (!done) { toast('Marque pelo menos uma série ✅'); return; }
      if (done < all && !(await confirmSheet('Concluir treino?', `Você fez ${done} de ${all} séries. Tudo bem — cada treino conta! 💖`, 'Concluir'))) return;
      finishSession();
    }
  });

  function finishSession() {
    const h = {
      id: sess.id,
      planId: sess.planId,
      dayId: sess.dayId,
      nome: sess.nome,
      sub: sess.sub,
      inicio: sess.inicio,
      fim: Date.now(),
      itens: sess.itens
        .map((it) => ({ exId: it.exId, reps: it.reps, series: it.series, sets: it.sets.filter((s) => s.done).map(({ kg, reps, done }) => ({ kg, reps, done })) }))
        .filter((it) => it.sets.length),
    };
    store.update((s) => { s.history.unshift(h); s.session = null; });
    go(`resumo/${h.id}`);
  }

  draw();
  return () => {
    clearInterval(iv);
    try { wakeLock?.release(); } catch { /* ignora */ }
  };
}

export function summaryView(el, { id }) {
  const st = store.get();
  const h = st.history.find((x) => x.id === id);
  if (!h) { go(''); return; }
  const prs = sessionPRs(st.history, h);
  const mins = Math.round((h.fim - h.inicio) / 60000);
  const vol = sessionVolume(h);
  const frases = ['Arrasou! 🎉', 'Que treino lindo! 💖', 'Você é incrível! ✨', 'Mais um pra conta! 💪', 'Orgulho define! 🌟'];
  const frase = frases[st.history.length % frases.length];

  render(el, `
    <div class="center mt-l">${mascot('uau', 120)}<h1 class="mt-s">${frase}</h1><p class="muted">${esc(h.nome)}${h.sub ? ' · ' + esc(h.sub) : ''}</p></div>
    <div class="stats mt">
      <div class="stat"><b>${mins}</b><span>minutos</span></div>
      <div class="stat"><b>${doneSets(h)}</b><span>séries</span></div>
      <div class="stat"><b>${fmtNum(vol)}</b><span>kg levantados</span></div>
    </div>
    ${prs.length ? `<div class="card mt" style="background:var(--yellow-soft);box-shadow:none"><h3>🏆 Novos recordes!</h3>
      ${prs.map((p) => `<div class="kv small"><span>${esc(p.nome)}</span><b>${fmtNum(p.kg, 1)} kg × ${esc(p.reps)}</b></div>`).join('')}</div>` : ''}
    <div class="card mt"><h3>Exercícios</h3>
      ${h.itens.map((it) => `<div class="kv small"><span class="grow ellipsis">${esc(EX_BY_ID[it.exId]?.n || it.exId)}</span><span class="bold muted">${it.sets.map((s) => (Number(s.kg) ? `${fmtNum(s.kg, 1)}×${esc(s.reps)}` : esc(s.reps))).join(' · ')}</span></div>`).join('')}
    </div>
    <div class="bottom-cta row gap">
      <button class="btn ghost" data-share>Compartilhar</button>
      <button class="btn grow" data-home>Voltar ao início</button>
    </div>
  `);
  confetti();
  el.querySelector('[data-home]').addEventListener('click', () => go(''));
  el.querySelector('[data-share]').addEventListener('click', async () => {
    const txt = `Treinei hoje com o Fofit! 💪\n${h.nome} · ${mins} min · ${doneSets(h)} séries · ${fmtNum(vol)} kg${prs.length ? `\n🏆 ${prs.length} recorde(s) novo(s)!` : ''}`;
    try {
      if (navigator.share) await navigator.share({ text: txt });
      else { await navigator.clipboard.writeText(txt); toast('Copiado! 📋'); }
    } catch { /* cancelado */ }
  });
}
