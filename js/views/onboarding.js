// Questionário inicial: coleta o perfil e gera o primeiro treino personalizado.
import * as store from '../store.js';
import { render, esc, mascot, icon, go, confetti } from '../ui.js';
import { GOALS, PLACES, PAINS, generatePlan } from '../generator.js';
import { GROUPS, EX_BY_ID } from '../data/exercises.js';

const LEVELS = {
  1: { nome: 'Iniciante', emoji: '🐣', desc: 'Nunca treinei ou treino há menos de 6 meses' },
  2: { nome: 'Intermediário', emoji: '🐥', desc: 'Treino de 6 meses a 2 anos' },
  3: { nome: 'Avançado', emoji: '🦅', desc: 'Treino há mais de 2 anos, com constância' },
};

export function onboardingView(el) {
  const prev = store.get().profile;
  const editing = !!prev;
  const p = prev ? structuredClone(prev) : { nome: '', objetivo: null, nivel: null, local: null, dias: 3, duracao: 60, foco: [], dores: [], sexo: '', idade: '', peso: '', altura: '' };
  let step = editing ? 1 : 0;
  const TOTAL = 8;

  const canNext = () => ({
    1: p.nome.trim().length > 0,
    2: !!p.objetivo,
    3: !!p.nivel,
    4: !!p.local,
  }[step] ?? true);

  function shell(inner, { title, sub, mood = 'feliz', next = 'Continuar' } = {}) {
    return `<div class="onb">
      <div class="row gap">
        <button class="icon-btn soft" data-back aria-label="Voltar">${icon('back')}</button>
        <div class="onb-dots grow">${Array.from({ length: TOTAL }, (_, i) => `<i class="${i < step ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <div class="body">
        <div class="row gap mt-l mb">${mascot(mood, 64)}<div class="bubble grow">${title}</div></div>
        ${sub ? `<p class="muted small">${sub}</p>` : ''}
        ${inner}
      </div>
      <button class="btn lg block mt" data-next ${canNext() ? '' : 'disabled'}>${next}</button>
    </div>`;
  }

  const opts = (obj, key, { multi = false, two = false } = {}) => `<div class="options ${two ? 'two' : ''}">${Object.entries(obj).map(([k, o]) => {
    const on = multi ? p[key].includes(k) : String(p[key]) === String(k);
    return `<button class="opt ${on ? 'on' : ''}" data-opt="${key}" data-val="${k}" data-multi="${multi ? 1 : ''}">
      <span class="emo">${o.emoji}</span><span><b>${esc(o.nome)}</b>${o.desc ? `<span class="d">${esc(o.desc)}</span>` : ''}</span></button>`;
  }).join('')}</div>`;

  function draw() {
    let html = '';
    if (step === 0) {
      html = `<div class="onb"><div class="body welcome">
        ${mascot('piscando', 140)}
        <h1>Oi! Eu sou a <span class="brand">Fofi</span></h1>
        <p class="muted">Sua parceira de treino. Vou montar um treino <b>feito pra você</b>, mostrar como fazer cada exercício e comemorar cada conquista! 🎉</p>
        <div class="mt-l">
          <div class="feature"><span class="emo">🧠</span><div><b>Treino personalizado</b><div class="small muted">Baseado no seu objetivo, nível e tempo</div></div></div>
          <div class="feature"><span class="emo">📸</span><div><b>Como fazer, com fotos</b><div class="small muted">Passo a passo, dicas e erros comuns</div></div></div>
          <div class="feature"><span class="emo">⏱️</span><div><b>Registro e cronômetro</b><div class="small muted">Séries, cargas e descanso automático</div></div></div>
          <div class="feature"><span class="emo">📈</span><div><b>Evolução</b><div class="small muted">Gráficos, recordes e conquistas</div></div></div>
        </div>
      </div><button class="btn lg block mt" data-next>Vamos começar! ✨</button></div>`;
    } else if (step === 1) {
      html = shell(`<label class="field"><input class="input" id="nome" maxlength="30" placeholder="Seu nome ou apelido" value="${esc(p.nome)}" autocomplete="given-name"></label>`,
        { title: 'Como posso te chamar? 😊' });
    } else if (step === 2) {
      html = shell(opts(GOALS, 'objetivo'), { title: `Prazer, ${esc(p.nome)}! Qual é seu <b>principal objetivo</b>?`, mood: 'uau' });
    } else if (step === 3) {
      html = shell(opts(LEVELS, 'nivel'), { title: 'Qual é sua <b>experiência</b> com musculação?' });
    } else if (step === 4) {
      html = shell(opts(PLACES, 'local'), { title: 'Onde você vai <b>treinar</b>?' });
    } else if (step === 5) {
      html = shell(`
        <h3>Dias por semana</h3>
        <div class="seg mb">${[2, 3, 4, 5, 6].map((d) => `<button data-dias="${d}" class="${p.dias === d ? 'on' : ''}">${d}</button>`).join('')}</div>
        <h3 class="mt">Tempo por treino</h3>
        <div class="seg">${[30, 45, 60, 75].map((d) => `<button data-dur="${d}" class="${p.duracao === d ? 'on' : ''}">${d} min</button>`).join('')}</div>
        <p class="tip mt">💡 Seja realista: 3 dias que você cumpre valem mais que 6 que você não consegue manter.</p>`,
        { title: 'Quanto <b>tempo</b> você tem?', mood: 'forte' });
    } else if (step === 6) {
      const focusable = Object.fromEntries(Object.entries(GROUPS).filter(([k]) => k !== 'cardio'));
      html = shell(`<div class="options two">${Object.entries(focusable).map(([k, g]) => `
        <button class="opt ${p.foco.includes(k) ? 'on' : ''}" data-opt="foco" data-val="${k}" data-multi="1"><span class="emo">${g.emoji}</span><b>${g.nome}</b></button>`).join('')}</div>`,
        { title: 'Quer dar <b>ênfase</b> a algum músculo?', sub: 'Opcional. Escolha até 2 para ficar equilibrado.', next: p.foco.length ? 'Continuar' : 'Pular' });
    } else if (step === 7) {
      html = shell(`<div class="options two">${Object.entries(PAINS).map(([k, n]) => `
        <button class="opt ${p.dores.includes(k) ? 'on' : ''}" data-opt="dores" data-val="${k}" data-multi="1"><span class="emo">🩹</span><b>${n}</b></button>`).join('')}</div>
        <p class="tip mt">⚠️ Se você tem uma lesão, procure um profissional de saúde. Vamos evitar exercícios que costumam incomodar essas regiões.</p>`,
        { title: 'Sente <b>dor ou desconforto</b> em alguma região?', sub: 'Opcional.', next: p.dores.length ? 'Continuar' : 'Não tenho' });
    } else if (step === 8) {
      html = shell(`
        <div class="seg mb">${[['f', 'Feminino'], ['m', 'Masculino'], ['', 'Prefiro não dizer']].map(([v, n]) => `<button data-sexo="${v}" class="${p.sexo === v ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="grid2">
          <label class="field"><span>Idade</span><input class="input" inputmode="numeric" data-f="idade" value="${esc(p.idade)}" placeholder="anos"></label>
          <label class="field"><span>Peso (kg)</span><input class="input" inputmode="decimal" data-f="peso" value="${esc(p.peso)}" placeholder="kg"></label>
          <label class="field"><span>Altura (cm)</span><input class="input" inputmode="numeric" data-f="altura" value="${esc(p.altura)}" placeholder="cm"></label>
        </div>
        <p class="muted small">Opcional. Usado nas calculadoras (IMC, calorias, água) e fica salvo só no seu celular. 🔒</p>`,
        { title: 'Por último: me conta um pouco <b>sobre você</b>', next: editing ? 'Salvar e gerar novo treino ✨' : 'Gerar meu treino ✨', mood: 'piscando' });
    } else if (step === 9) {
      html = `<div class="onb"><div class="body welcome">${mascot('forte', 130)}<h2 class="mt">Montando seu treino...</h2>
        <p class="muted" id="gen-msg">Analisando seu objetivo 🎯</p><div class="progress mt"><i id="gen-bar" style="width:5%"></i></div></div></div>`;
    } else if (step === 10) {
      const plan = store.activePlan();
      html = `<div class="onb"><div class="body">
        <div class="center">${mascot('uau', 100)}<h2>Seu treino está pronto! 🎉</h2><p class="muted">${esc(plan.nome)}</p></div>
        ${plan.dias.map((d) => `<div class="card tight mt-s"><div class="row between"><b>${esc(d.nome)}</b><span class="pill lilac">${d.itens.length} exercícios</span></div>
          <div class="small muted">${esc(d.sub)}</div>
          <div class="small mt-s">${d.itens.map((i) => esc(EX_BY_ID[i.exId]?.n)).join(' · ')}</div></div>`).join('')}
        <div class="card mt"><h3>Por que esse treino?</h3>${plan.explicacao.map((t) => `<p class="small">${esc(t)}</p>`).join('')}</div>
      </div><button class="btn lg block mt" data-finish>Bora treinar! 💪</button></div>`;
    }
    render(el, html);
    el.className = 'view no-tabs';
    el.style.padding = '0';
    el.querySelector('#nome')?.focus();
  }

  function finish() {
    const plan = generatePlan(p);
    store.update((s) => {
      s.profile = { ...p, criadoEm: s.profile?.criadoEm || Date.now() };
      s.plans = s.plans.filter((x) => !x.gerado || x.editado); // mantém treinos montados/editados
      s.plans.unshift(plan);
      s.activePlanId = plan.id;
      const peso = parseFloat(String(p.peso).replace(',', '.'));
      if (peso && !s.bodyLog.length) s.bodyLog.push({ data: Date.now(), peso });
    });
    step = 9;
    draw();
    const msgs = ['Escolhendo a melhor divisão 🗓️', 'Selecionando exercícios 🏋️', 'Ajustando séries e descanso ⏱️', 'Deixando tudo fofinho 💖'];
    let i = 0;
    const iv = setInterval(() => {
      const bar = el.querySelector('#gen-bar');
      const msg = el.querySelector('#gen-msg');
      if (!bar) return clearInterval(iv);
      bar.style.width = `${25 * (i + 1)}%`;
      if (msgs[i]) msg.textContent = msgs[i];
      if (++i > 4) {
        clearInterval(iv);
        step = 10;
        draw();
        confetti();
      }
    }, 550);
  }

  el.addEventListener('input', (e) => {
    if (e.target.id === 'nome') {
      p.nome = e.target.value;
      el.querySelector('[data-next]').disabled = !canNext();
    }
    if (e.target.dataset.f) p[e.target.dataset.f] = e.target.value;
  });

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'nome' && canNext()) { step++; draw(); }
  });

  el.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.back !== undefined) {
      if (step <= (editing ? 1 : 0)) { if (editing) go('perfil'); return; }
      step--; return draw();
    }
    if (t.dataset.next !== undefined) {
      if (!canNext()) return;
      if (step === 8) return finish();
      step++; return draw();
    }
    if (t.dataset.finish !== undefined) return go('');
    if (t.dataset.opt) {
      const { opt, val, multi } = t.dataset;
      if (multi) {
        const arr = p[opt];
        const i = arr.indexOf(val);
        if (i >= 0) arr.splice(i, 1);
        else { if (opt === 'foco' && arr.length >= 2) arr.shift(); arr.push(val); }
      } else {
        p[opt] = opt === 'nivel' ? Number(val) : val;
        draw();
        setTimeout(() => { step++; draw(); }, 220);
        return;
      }
      return draw();
    }
    if (t.dataset.dias) { p.dias = Number(t.dataset.dias); return draw(); }
    if (t.dataset.dur) { p.duracao = Number(t.dataset.dur); return draw(); }
    if (t.dataset.sexo !== undefined) { p.sexo = t.dataset.sexo; return draw(); }
  });

  draw();
}
