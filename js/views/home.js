// Tela inicial: saudação, treino de hoje, semana e dica do dia.
import * as store from '../store.js';
import { render, esc, mascot, icon, go, fmtNum, fmtTime } from '../ui.js';
import { EX_BY_ID, exImg } from '../data/exercises.js';
import { TIPS } from '../data/guides.js';
import { GOALS } from '../generator.js';
import { thisWeek, weekStart, weekStreak, sessionVolume, dayKey, DAY } from '../stats.js';
import { startSession } from './session.js';

export function estimateMinutes(day) {
  let s = 0;
  for (const it of day.itens) {
    const ex = EX_BY_ID[it.exId];
    if (ex?.u === 'm') { s += (parseInt(it.reps) || 15) * 60; continue; }
    s += it.series * (45 + (Number(it.descanso) || 60));
  }
  return Math.max(10, Math.round(s / 60 / 5) * 5);
}

export function homeView(el) {
  const st = store.get();
  const p = st.profile;
  const plan = store.activePlan();
  const day = store.nextDay(plan);
  const h = new Date().getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const week = thisWeek(st.history);
  const ws = weekStart();
  const doneDays = new Set(st.history.map((x) => dayKey(x.fim)));
  const todayKey = dayKey(Date.now());
  const trainedToday = doneDays.has(todayKey);
  const tip = TIPS[Math.floor(Date.now() / DAY) % TIPS.length];
  const streak = weekStreak(st.history);
  const volWeek = week.reduce((a, x) => a + sessionVolume(x), 0);
  const mood = st.session ? 'forte' : trainedToday ? 'piscando' : week.length >= p.dias ? 'uau' : 'feliz';
  const bubble = st.session
    ? 'Seu treino está te esperando! Bora terminar? 💪'
    : trainedToday ? 'Treino de hoje concluído! Orgulho de você 💖'
    : week.length >= p.dias ? 'Meta da semana batida! Descanse se precisar 🌸'
    : `${GOALS[p.objetivo]?.emoji || '✨'} ${esc(tip)}`;

  const heroDay = day ? `
    <div class="hero">
      <div class="row between"><span class="pill">🗓️ Próximo treino</span><span class="pill">⏱️ ~${estimateMinutes(day)} min</span></div>
      <h2 class="mt-s" style="font-size:1.5rem">${esc(day.nome)}</h2>
      <p class="muted" style="margin:0">${day.sub ? esc(day.sub) + ' · ' : ''}${day.itens.length} ${day.itens.length === 1 ? 'exercício' : 'exercícios'}</p>
      <div class="row gap-s mt" style="position:relative;z-index:1">
        ${day.itens.slice(0, 4).map((i) => `<img src="${exImg(i.exId, 1)}" alt="" style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,.6)">`).join('')}
        ${day.itens.length > 4 ? `<span class="pill">+${day.itens.length - 4}</span>` : ''}
      </div>
      <div class="row gap mt" style="position:relative;z-index:1">
        <button class="btn white grow" data-start>${icon('play', 18)} ${st.session ? 'Continuar treino' : 'Começar treino'}</button>
        <a class="icon-btn" style="background:rgba(255,255,255,.25);color:#fff;box-shadow:none" href="#/dia/${plan.id}/${day.id}" aria-label="Ver treino">${icon('info')}</a>
      </div>
    </div>` : `
    <div class="hero center">
      <h2>Nenhum treino ainda</h2><p class="muted">Gere um treino personalizado ou monte o seu!</p>
      <a class="btn white" href="#/treinos">Ver treinos</a>
    </div>`;

  const dows = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const weekHtml = dows.map((d, i) => {
    const ts = ws + i * DAY;
    const k = dayKey(ts);
    return `<div><div class="d">${d}</div><div class="dot ${doneDays.has(k) ? 'done' : ''} ${k === todayKey ? 'today' : ''}">${doneDays.has(k) ? '✓' : new Date(ts).getDate()}</div></div>`;
  }).join('');

  render(el, `
    <div class="row between">
      <div class="small muted bold">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <a class="icon-btn" href="#/perfil" aria-label="Perfil">${icon('user')}</a>
    </div>
    <div class="greet mt-s">
      ${mascot(mood, 82)}
      <div class="grow"><h1 style="margin:0 0 6px">${hello}, ${esc(p.nome)}!</h1><div class="bubble">${bubble}</div></div>
    </div>
    ${st.session ? `<div class="tip up mb">⏱️ Treino em andamento há ${fmtTime((Date.now() - st.session.inicio) / 1000)}</div>` : ''}
    ${heroDay}

    <div class="section-title"><h3>Sua semana</h3><span class="small muted bold">${week.length}/${p.dias} treinos</span></div>
    <div class="card"><div class="week">${weekHtml}</div>
      <div class="progress mt"><i style="width:${Math.min(100, (week.length / p.dias) * 100)}%"></i></div>
    </div>

    <div class="stats mt">
      <div class="stat"><b>${st.history.length}</b><span>treinos</span></div>
      <div class="stat"><b>${streak}🔥</b><span>semanas seguidas</span></div>
      <div class="stat"><b>${fmtNum(volWeek / 1000, 1)}t</b><span>volume na semana</span></div>
    </div>

    <div class="section-title"><h3>Atalhos</h3></div>
    <div class="grid2">
      <a class="card click" href="#/treinos" style="text-decoration:none;color:inherit"><div style="font-size:1.6rem">🧩</div><b>Montar treino</b><div class="small muted">Crie do seu jeito</div></a>
      <a class="card click" href="#/exercicios" style="text-decoration:none;color:inherit"><div style="font-size:1.6rem">📸</div><b>Como fazer</b><div class="small muted">${Object.keys(EX_BY_ID).length} exercícios</div></a>
      <a class="card click" href="#/guia/montar-treino" style="text-decoration:none;color:inherit"><div style="font-size:1.6rem">🎓</div><b>Aprenda a treinar</b><div class="small muted">Guias rápidos</div></a>
      <a class="card click" href="#/aprender" style="text-decoration:none;color:inherit"><div style="font-size:1.6rem">🧮</div><b>Calculadoras</b><div class="small muted">IMC, calorias, 1RM</div></a>
    </div>

    <div class="card mt row gap" style="background:var(--yellow-soft);box-shadow:none">
      <div style="font-size:1.6rem">💡</div><div><b>Dica do dia</b><div class="small">${esc(tip)}</div></div>
    </div>
  `);

  el.querySelector('[data-start]')?.addEventListener('click', () => {
    if (!store.get().session) startSession(plan, day);
    go('sessao');
  });
}
