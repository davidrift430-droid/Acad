// Progresso: gráficos, calendário, peso corporal, recordes, conquistas e histórico.
import * as store from '../store.js';
import { render, esc, icon, go, sheet, toast, confirmSheet, fmtDate, fmtNum, mascot } from '../ui.js';
import { EX_BY_ID } from '../data/exercises.js';
import { barChart, lineChart } from '../charts.js';
import { weekStart, sessionVolume, doneSets, personalRecords, badges, dayKey, DAY, weekStreak } from '../stats.js';

export function progressView(el) {
  let tab = 'geral';

  function draw() {
    const st = store.get();
    const h = st.history;
    const totalMin = h.reduce((a, x) => a + (x.fim - x.inicio) / 60000, 0);
    const totalVol = h.reduce((a, x) => a + sessionVolume(x), 0);

    // Volume das últimas 8 semanas
    const ws = weekStart();
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = weekStart(ws - (7 - i) * 7 * DAY + DAY);
      const end = start + 7 * DAY;
      const list = h.filter((x) => x.fim >= start && x.fim < end);
      return { label: fmtDate(start, { day: '2-digit', month: '2-digit' }), vol: list.reduce((a, x) => a + sessionVolume(x), 0), n: list.length };
    });

    // Calendário do mês atual
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const trained = new Set(h.map((x) => dayKey(x.fim)));
    const cal = [
      ...['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<div class="empty tiny">${d}</div>`),
      ...Array.from({ length: offset }, () => '<div class="empty"></div>'),
      ...Array.from({ length: daysInMonth }, (_, i) => {
        const ts = new Date(now.getFullYear(), now.getMonth(), i + 1).getTime();
        const k = dayKey(ts);
        return `<div class="${trained.has(k) ? 'on' : ''} ${k === dayKey(Date.now()) ? 'today' : ''}">${i + 1}</div>`;
      }),
    ].join('');

    const prs = Object.entries(personalRecords(h)).sort((a, b) => b[1].data - a[1].data);
    const bw = [...st.bodyLog].sort((a, b) => a.data - b.data);
    const bdg = badges(st);
    const p = st.profile;

    const tabs = `<div class="seg mb">${[['geral', 'Geral'], ['corpo', 'Corpo'], ['historico', 'Histórico']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;

    let body = '';
    if (!h.length && tab !== 'corpo') {
      body = `<div class="empty-state card">${mascot('sono', 100)}<h3>Nada por aqui ainda</h3><p class="muted">Faça seu primeiro treino e acompanhe sua evolução com gráficos e recordes! 📈</p><a class="btn" href="#/">Ir treinar</a></div>`;
    } else if (tab === 'geral') {
      body = `
        <div class="stats">
          <div class="stat"><b>${h.length}</b><span>treinos</span></div>
          <div class="stat"><b>${fmtNum(totalMin / 60, 1)}h</b><span>treinando</span></div>
          <div class="stat"><b>${fmtNum(totalVol / 1000, 1)}t</b><span>levantadas</span></div>
        </div>
        <div class="card mt"><div class="row between"><h3 style="margin:0">Volume semanal</h3><span class="pill pink">🔥 ${weekStreak(h)} sem. seguidas</span></div>
          <p class="tiny muted">Carga × repetições (kg) — mais volume ao longo do tempo = evolução</p>
          ${barChart(weeks.map((w) => ({ label: w.label, value: Math.round(w.vol) })))}
        </div>
        <div class="card mt"><h3>Treinos por semana</h3>
          ${barChart(weeks.map((w) => ({ label: w.label, value: w.n })), { height: 120 })}
          <p class="tiny muted center">Meta: ${p.dias} por semana</p>
        </div>
        <div class="card mt"><h3>${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3><div class="cal">${cal}</div></div>
        <div class="section-title"><h3>🏆 Recordes pessoais</h3></div>
        ${prs.length ? `<div class="card">${prs.slice(0, 8).map(([id, r]) => `
          <a class="kv small" href="#/ex/${encodeURIComponent(id)}" style="text-decoration:none;color:inherit">
            <span class="grow ellipsis">${esc(EX_BY_ID[id]?.n || id)}</span><b>${fmtNum(r.kg, 1)} kg × ${r.reps}</b></a>`).join('')}</div>`
          : '<p class="muted small">Registre cargas nos exercícios para ver seus recordes.</p>'}
        <div class="section-title"><h3>🎖️ Conquistas</h3><span class="small muted bold">${bdg.filter((b) => b.on).length}/${bdg.length}</span></div>
        <div class="card"><div class="badges">${bdg.map((b) => `<div class="badge ${b.on ? 'on' : ''}"><div class="b">${b.emoji}</div>${esc(b.nome)}</div>`).join('')}</div></div>`;
    } else if (tab === 'corpo') {
      const peso = bw.at(-1)?.peso;
      const alt = parseFloat(p.altura) / 100;
      const imc = peso && alt ? peso / (alt * alt) : null;
      const diff = bw.length > 1 ? bw.at(-1).peso - bw[0].peso : 0;
      body = `
        <div class="stats">
          <div class="stat"><b>${peso ? fmtNum(peso, 1) : '—'}</b><span>kg atual</span></div>
          <div class="stat"><b>${bw.length > 1 ? (diff > 0 ? '+' : '') + fmtNum(diff, 1) : '—'}</b><span>kg desde o início</span></div>
          <div class="stat"><b>${imc ? fmtNum(imc, 1) : '—'}</b><span>IMC</span></div>
        </div>
        <div class="card mt"><div class="row between"><h3 style="margin:0">Peso corporal</h3><button class="btn sm" data-addw>${icon('plus', 16)} Registrar</button></div>
          <div class="mt">${lineChart(bw.slice(-20).map((x) => ({ label: fmtDate(x.data, { day: '2-digit', month: '2-digit' }), value: x.peso })), { unit: 'kg' })}</div>
        </div>
        ${bw.length ? `<div class="card mt">${[...bw].reverse().slice(0, 10).map((x) => `<div class="kv small"><span class="muted">${fmtDate(x.data, { day: '2-digit', month: 'short', year: 'numeric' })}</span><span class="row gap-s"><b>${fmtNum(x.peso, 1)} kg</b><button class="link" data-delw="${x.data}" aria-label="Apagar">${icon('x', 14)}</button></span></div>`).join('')}</div>` : ''}
        <p class="tip mt">💡 Pese-se sempre no mesmo horário (de manhã, em jejum) e olhe a tendência, não o número de um dia.</p>`;
    } else {
      body = h.map((x) => {
        const d = new Date(x.fim);
        return `<div class="card tight click hist-item" data-open="${x.id}" style="margin-top:10px">
          <div class="date">${d.getDate()}<small>${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small></div>
          <div class="grow"><b>${esc(x.nome)}</b><div class="small muted">${Math.round((x.fim - x.inicio) / 60000)} min · ${doneSets(x)} séries · ${fmtNum(sessionVolume(x))} kg</div></div>
          <button class="icon-btn soft" data-delh="${x.id}" aria-label="Apagar">${icon('trash', 18)}</button>
        </div>`;
      }).join('');
    }

    render(el, `<div class="topbar"><h1>Progresso</h1></div>${tabs}${body}`);
  }

  el.addEventListener('click', async (e) => {
    const t = e.target.closest('button, [data-open]');
    if (!t) return;
    if (t.dataset.tab) { tab = t.dataset.tab; return draw(); }
    if (t.dataset.delh) {
      e.stopPropagation();
      if (await confirmSheet('Apagar treino do histórico?', 'Isso não pode ser desfeito.', 'Apagar', true)) {
        store.update((s) => { s.history = s.history.filter((x) => x.id !== t.dataset.delh); });
        draw();
      }
      return;
    }
    if (t.dataset.open) return go(`resumo/${t.dataset.open}`);
    if (t.dataset.delw) {
      store.update((s) => { s.bodyLog = s.bodyLog.filter((x) => String(x.data) !== t.dataset.delw); });
      return draw();
    }
    if (t.dataset.addw !== undefined) {
      const last = store.get().bodyLog.at(-1)?.peso || store.get().profile.peso || '';
      const s = sheet(`<h2>Registrar peso ⚖️</h2>
        <label class="field"><span>Peso (kg)</span><input class="input" inputmode="decimal" data-w value="${esc(last)}"></label>
        <button class="btn block" data-save>Salvar</button>`);
      const inp = s.querySelector('[data-w]');
      setTimeout(() => inp.select(), 300);
      s.querySelector('[data-save]').addEventListener('click', () => {
        const v = parseFloat(inp.value.replace(',', '.'));
        if (!v || v < 20 || v > 400) return toast('Peso inválido');
        store.update((st) => {
          st.bodyLog.push({ data: Date.now(), peso: v });
          if (st.profile) st.profile.peso = String(v);
        });
        s.close(); toast('Peso registrado ✅'); draw();
      });
    }
  });

  draw();
}
