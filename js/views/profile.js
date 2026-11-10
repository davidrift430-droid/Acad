// Perfil e configurações: dados, tema, som, backup e restauração.
import * as store from '../store.js';
import { render, esc, icon, go, toast, confirmSheet, mascot } from '../ui.js';
import { GOALS, PLACES, PAINS } from '../generator.js';
import { GROUPS } from '../data/exercises.js';

const LV = ['', 'Iniciante', 'Intermediário', 'Avançado'];

export function profileView(el) {
  function draw() {
    const st = store.get();
    const p = st.profile;
    const s = st.settings;
    render(el, `
      <div class="topbar"><button class="icon-btn" data-back aria-label="Voltar">${icon('back')}</button><h2>Perfil</h2></div>
      <div class="center">${mascot('feliz', 90)}<h2 class="mt-s">${esc(p.nome)}</h2>
        <p class="muted small">Treinando com o Fofit desde ${new Date(p.criadoEm || Date.now()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p></div>

      <div class="card mt">
        <div class="kv"><span class="muted">Objetivo</span><b>${GOALS[p.objetivo]?.emoji} ${GOALS[p.objetivo]?.nome}</b></div>
        <div class="kv"><span class="muted">Nível</span><b>${LV[p.nivel]}</b></div>
        <div class="kv"><span class="muted">Local</span><b>${PLACES[p.local]?.nome}</b></div>
        <div class="kv"><span class="muted">Frequência</span><b>${p.dias}x por semana · ${p.duracao} min</b></div>
        <div class="kv"><span class="muted">Ênfase</span><b>${p.foco?.length ? p.foco.map((g) => GROUPS[g].nome).join(', ') : '—'}</b></div>
        <div class="kv"><span class="muted">Cuidados</span><b>${p.dores?.length ? p.dores.map((d) => PAINS[d]).join(', ') : '—'}</b></div>
        <button class="btn block mt" data-redo>✨ Atualizar e gerar novo treino</button>
      </div>

      <div class="section-title"><h3>Preferências</h3></div>
      <div class="card">
        <div class="kv"><span>Tema</span>
          <div class="seg" style="width:210px">${[['auto', 'Auto'], ['light', '☀️'], ['dark', '🌙']].map(([k, n]) => `<button data-tema="${k}" class="${s.tema === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
        <div class="kv"><span>Som no fim do descanso</span><label class="switch"><input type="checkbox" data-set="som" ${s.som ? 'checked' : ''}><span></span></label></div>
        <div class="kv"><span>Vibrar no fim do descanso</span><label class="switch"><input type="checkbox" data-set="vibrar" ${s.vibrar ? 'checked' : ''}><span></span></label></div>
      </div>

      <div class="section-title"><h3>Seus dados</h3></div>
      <div class="card">
        <p class="small muted">🔒 Tudo fica salvo só neste aparelho. Faça backup para trocar de celular.</p>
        <div class="row gap"><button class="btn ghost grow" data-export>⬇️ Backup</button>
          <label class="btn ghost grow" style="cursor:pointer">⬆️ Restaurar<input type="file" accept="application/json,.json" data-import hidden></label></div>
        <button class="btn ghost block mt-s" data-reset style="color:var(--danger)">Apagar todos os dados</button>
      </div>

      <div class="section-title"><h3>Instalar no celular</h3></div>
      <div class="card small">
        <p><b>Android (Chrome):</b> menu ⋮ → <i>Instalar app</i> ou <i>Adicionar à tela inicial</i>.</p>
        <p style="margin:0"><b>iPhone (Safari):</b> botão compartilhar ⬆️ → <i>Adicionar à Tela de Início</i>.</p>
      </div>
      <p class="tiny muted center mt-l">Fofit v1.0 · Fotos dos exercícios: Free Exercise DB (domínio público).<br>Ferramenta educativa — não substitui orientação profissional.</p>
    `);
  }

  el.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.back !== undefined) return go('');
    if (t.dataset.redo !== undefined) return go('onboarding');
    if (t.dataset.tema) { store.update((s) => { s.settings.tema = t.dataset.tema; }); return draw(); }
    if (t.dataset.export !== undefined) {
      const blob = new Blob([JSON.stringify(store.get(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `fofit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Backup baixado 💾');
    }
    if (t.dataset.reset !== undefined) {
      if (await confirmSheet('Apagar tudo?', 'Perfil, treinos e histórico serão apagados deste aparelho. Isso não pode ser desfeito.', 'Apagar tudo', true)) {
        store.resetAll();
        go('onboarding');
      }
    }
  });

  el.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.dataset.set) { store.update((s) => { s.settings[t.dataset.set] = t.checked; }); return; }
    if (t.matches('[data-import]') && t.files[0]) {
      try {
        const data = JSON.parse(await t.files[0].text());
        if (!data || typeof data !== 'object' || !Array.isArray(data.history) || !Array.isArray(data.plans)) throw new Error('formato');
        if (!(await confirmSheet('Restaurar backup?', 'Os dados atuais serão substituídos.', 'Restaurar'))) return;
        store.replaceAll(data);
        toast('Backup restaurado ✅');
        go('');
      } catch {
        toast('Arquivo inválido 😕');
      }
    }
  });

  draw();
}
