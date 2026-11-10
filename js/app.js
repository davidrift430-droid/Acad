// Fofit — app de academia fofo com treino personalizado.
import * as store from './store.js';
import { render, icon, go } from './ui.js';
import { homeView } from './views/home.js';
import { onboardingView } from './views/onboarding.js';
import { plansView, dayView, editorView } from './views/plans.js';
import { libraryView, exerciseView } from './views/library.js';
import { sessionView, summaryView } from './views/session.js';
import { progressView } from './views/progress.js';
import { learnView, guideView, calcView } from './views/learn.js';
import { profileView } from './views/profile.js';

const app = document.getElementById('app');

const ROUTES = [
  ['', homeView, 'home'],
  ['onboarding', onboardingView, null],
  ['treinos', plansView, 'treinos'],
  ['dia/:planId/:dayId', dayView, 'treinos'],
  ['editor/:planId', editorView, null],
  ['exercicios', libraryView, 'exercicios'],
  ['ex/:id', exerciseView, 'exercicios'],
  ['sessao', sessionView, null],
  ['resumo/:id', summaryView, null],
  ['progresso', progressView, 'progresso'],
  ['aprender', learnView, 'aprender'],
  ['guia/:id', guideView, 'aprender'],
  ['calc/:id', calcView, 'aprender'],
  ['perfil', profileView, null],
];

const TABS = [
  ['', 'home', 'Início'],
  ['treinos', 'dumbbell', 'Treinos'],
  ['exercicios', 'book', 'Exercícios'],
  ['progresso', 'chart', 'Progresso'],
  ['aprender', 'bulb', 'Aprender'],
];

function match(path) {
  for (const [pattern, view, tab] of ROUTES) {
    const pp = pattern.split('/');
    const parts = path.split('/');
    if (pp.length !== parts.length) continue;
    const params = {};
    if (pp.every((p, i) => (p.startsWith(':') ? ((params[p.slice(1)] = decodeURIComponent(parts[i])), true) : p === parts[i]))) {
      return { view, tab, params };
    }
  }
  return null;
}

let cleanup = null;

function route() {
  const path = location.hash.replace(/^#\/?/, '');
  const st = store.get();
  if (!st.profile && path !== 'onboarding') return go('onboarding');

  const m = match(path) || match('');
  cleanup?.();
  cleanup = null;

  const view = document.createElement('main');
  view.className = 'view' + (m.tab === null ? ' no-tabs' : '');
  app.replaceChildren(view);
  cleanup = m.view(view, m.params) || null;

  if (m.tab !== null) {
    const nav = document.createElement('nav');
    nav.className = 'tabbar';
    render(nav, TABS.map(([p, ic, label]) =>
      `<a href="#/${p}" class="${m.tab === (p || 'home') ? 'on' : ''}">${icon(ic, 24)}<span>${label}</span></a>`).join(''));
    app.appendChild(nav);
  }
  window.scrollTo(0, 0);
}

function applyTheme() {
  const t = store.get().settings.tema;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

window.addEventListener('hashchange', route);
store.onChange(applyTheme);
applyTheme();
route();

// Instala como app (PWA) e funciona offline.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
