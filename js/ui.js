// Componentes visuais compartilhados: render seguro, mascote, ícones, toast, modal, confete, som.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Converte um template (texto do usuário SEMPRE passado por esc()) em nós DOM.
// DOMParser não executa <script>; o app não usa atributos on* nos templates.
const parser = new DOMParser();
export function toNodes(markup) {
  const doc = parser.parseFromString(`<body>${markup}</body>`, 'text/html');
  return [...doc.body.childNodes].map((n) => document.importNode(n, true));
}
export function render(el, markup) {
  el.replaceChildren(...toNodes(markup));
}

// Mascote "Fofi": uma bolinha rosa com faixa de suor e um halterzinho.
export function mascot(mood = 'feliz', size = 96) {
  const eyes = {
    feliz: '<path d="M38 52q4-5 8 0M62 52q4-5 8 0" stroke="#3b2340" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
    uau: '<circle cx="42" cy="51" r="4.2" fill="#3b2340"/><circle cx="66" cy="51" r="4.2" fill="#3b2340"/><circle cx="43.4" cy="49.6" r="1.4" fill="#fff"/><circle cx="67.4" cy="49.6" r="1.4" fill="#fff"/>',
    forte: '<path d="M37 49l9 3M71 49l-9 3" stroke="#3b2340" stroke-width="3.2" stroke-linecap="round"/><circle cx="42" cy="54" r="3.4" fill="#3b2340"/><circle cx="66" cy="54" r="3.4" fill="#3b2340"/>',
    sono: '<path d="M37 53h9M62 53h9" stroke="#3b2340" stroke-width="3.2" stroke-linecap="round"/>',
    piscando: '<circle cx="42" cy="51" r="4.2" fill="#3b2340"/><circle cx="43.4" cy="49.6" r="1.4" fill="#fff"/><path d="M62 52q4-5 8 0" stroke="#3b2340" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
  }[mood] || '';
  const mouth = {
    uau: '<ellipse cx="54" cy="64" rx="4.5" ry="5.5" fill="#3b2340"/><ellipse cx="54" cy="66" rx="2.6" ry="2.4" fill="#ff7a9c"/>',
    sono: '<path d="M50 64q4 2 8 0" stroke="#3b2340" stroke-width="2.6" fill="none" stroke-linecap="round"/><text x="80" y="30" font-size="13" font-weight="800" fill="#b39ddb">z</text><text x="88" y="20" font-size="10" font-weight="800" fill="#b39ddb">z</text>',
  }[mood] || '<path d="M47 61q7 8 14 0" stroke="#3b2340" stroke-width="3" fill="#ff7a9c" stroke-linecap="round" stroke-linejoin="round"/>';
  const arm = mood === 'forte'
    ? '<path d="M86 66q12-6 8-22" stroke="#ff8fab" stroke-width="8" fill="none" stroke-linecap="round"/><g transform="rotate(-20 94 36)"><rect x="92" y="24" width="5" height="22" rx="2.5" fill="#7c5cff"/><rect x="86" y="18" width="17" height="8" rx="3" fill="#7c5cff"/><rect x="86" y="44" width="17" height="8" rx="3" fill="#7c5cff"/></g><path d="M20 70q-8 4-6 12" stroke="#ff8fab" stroke-width="8" fill="none" stroke-linecap="round"/>'
    : '<path d="M20 70q-8 4-6 12" stroke="#ff8fab" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M88 70q8 4 6 12" stroke="#ff8fab" stroke-width="8" fill="none" stroke-linecap="round"/>';
  return `<svg class="mascot m-${mood}" width="${size}" height="${size}" viewBox="0 0 108 108" aria-hidden="true">
    <ellipse cx="54" cy="101" rx="30" ry="5" fill="rgba(0,0,0,.08)"/>
    ${arm}
    <path d="M54 14c24 0 40 18 40 44s-14 38-40 38S14 84 14 58 30 14 54 14z" fill="#ffb3c7"/>
    <path d="M54 22c18 0 30 10 34 26-8-10-20-15-34-15S28 38 20 48c4-16 16-26 34-26z" fill="#ffd0dc"/>
    <path d="M17 37c21-10 53-10 74 0l-2 9c-21-9-49-9-70 0z" fill="#7c5cff"/>
    <path d="M88 38l11-5-4 10z" fill="#7c5cff"/>
    <circle cx="33" cy="62" r="6" fill="#ff7a9c" opacity=".45"/><circle cx="75" cy="62" r="6" fill="#ff7a9c" opacity=".45"/>
    ${eyes}${mouth}
  </svg>`;
}

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  fire: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-1 2-5 1-9z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11v6M8 15h2M12 15h2"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
};

export function icon(name, size = 22) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

export function toast(msg, ms = 2600) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

// Modal estilo "bottom sheet". Retorna o elemento para ligar eventos.
export function sheet(markup, { onClose } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  const box = document.createElement('div');
  box.className = 'sheet';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  render(box, `<div class="sheet-handle"></div>${markup}`);
  wrap.appendChild(box);
  const close = () => {
    wrap.classList.remove('open');
    setTimeout(() => wrap.remove(), 250);
    onClose?.();
  };
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap || e.target.closest('[data-close]')) close();
  });
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  wrap.close = close;
  return wrap;
}

export function confirmSheet(titulo, texto, okTxt = 'Confirmar', danger = false) {
  return new Promise((resolve) => {
    let done = false;
    const s = sheet(`<h3>${esc(titulo)}</h3><p class="muted">${esc(texto)}</p>
      <div class="row gap mt"><button class="btn ghost grow" data-close>Cancelar</button>
      <button class="btn grow ${danger ? 'danger' : ''}" data-ok>${esc(okTxt)}</button></div>`, {
      onClose: () => { if (!done) resolve(false); },
    });
    s.querySelector('[data-ok]').addEventListener('click', () => { done = true; resolve(true); s.close(); });
  });
}

export function confetti(n = 90) {
  const colors = ['#ff8fab', '#7c5cff', '#8de0c4', '#ffd166', '#a0c4ff', '#ffadad'];
  const box = document.createElement('div');
  box.className = 'confetti';
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.6 + 's';
    p.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    if (i % 3 === 0) p.style.borderRadius = '50%';
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4200);
}

let audioCtx;
export function beep(times = 3) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = i === times - 1 ? 1046 : 784;
      const t = audioCtx.currentTime + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + 0.2);
    }
  } catch { /* sem áudio */ }
}

export const vibrate = (p) => { try { navigator.vibrate?.(p); } catch { /* ignora */ } };

export const fmtTime = (s) => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

export const fmtDate = (ts, opts = { day: '2-digit', month: 'short' }) =>
  new Date(ts).toLocaleDateString('pt-BR', opts);

export const fmtNum = (n, d = 0) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d });

export const go = (path) => { location.hash = '#/' + path; };
