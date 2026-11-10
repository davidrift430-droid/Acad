// Gráficos SVG leves (sem bibliotecas), com cores do tema via CSS.
import { esc, fmtNum } from './ui.js';

// Barras verticais. data: [{ label, value }]
export function barChart(data, { height = 150, unit = '' } = {}) {
  if (!data.length) return '';
  const w = 320;
  const pad = { t: 18, b: 22, l: 4, r: 4 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = (w - pad.l - pad.r) / data.length;
  const bars = data.map((d, i) => {
    const h = (d.value / max) * (height - pad.t - pad.b);
    const x = pad.l + i * bw + bw * 0.18;
    const y = height - pad.b - h;
    const isLast = i === data.length - 1;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(h, 2).toFixed(1)}" rx="6" class="${isLast ? 'bar-hi' : 'bar'}"/>
      ${d.value && (isLast || data.length <= 8) ? `<text x="${(x + bw * 0.32).toFixed(1)}" y="${(y - 5).toFixed(1)}" class="ch-val" text-anchor="middle">${fmtNum(d.value)}${esc(unit)}</text>` : ''}
      <text x="${(x + bw * 0.32).toFixed(1)}" y="${height - 6}" class="ch-lbl" text-anchor="middle">${esc(d.label)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${height}" class="chart" role="img">${bars}</svg>`;
}

// Linha com área. data: [{ label, value }]
export function lineChart(data, { height = 160, unit = '' } = {}) {
  if (data.length < 2) return '<p class="muted small center">Registre pelo menos 2 vezes para ver o gráfico 📈</p>';
  const w = 320;
  const pad = { t: 20, b: 22, l: 8, r: 8 };
  const vals = data.map((d) => d.value);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.15; max += span * 0.15;
  const X = (i) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);
  const pts = data.map((d, i) => [X(i), Y(d.value)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts.at(-1)[0].toFixed(1)},${height - pad.b} L${pts[0][0].toFixed(1)},${height - pad.b} Z`;
  const step = Math.ceil(data.length / 6);
  const labels = data.map((d, i) => (i % step === 0 || i === data.length - 1)
    ? `<text x="${X(i).toFixed(1)}" y="${height - 6}" class="ch-lbl" text-anchor="middle">${esc(d.label)}</text>` : '').join('');
  const last = pts.at(-1);
  return `<svg viewBox="0 0 ${w} ${height}" class="chart" role="img">
    <defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="lg-a"/><stop offset="1" class="lg-b"/></linearGradient></defs>
    <path d="${area}" fill="url(#lg)"/>
    <path d="${line}" class="ln" fill="none"/>
    ${pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" class="dot"/>`).join('')}
    <text x="${Math.min(last[0], w - 30).toFixed(1)}" y="${(last[1] - 9).toFixed(1)}" class="ch-val" text-anchor="middle">${fmtNum(data.at(-1).value, 1)}${esc(unit)}</text>
    ${labels}
  </svg>`;
}

// Anel de progresso.
export function ring(pct, label, size = 84) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, pct)));
  return `<svg viewBox="0 0 84 84" width="${size}" height="${size}" class="ring">
    <circle cx="42" cy="42" r="${r}" class="ring-bg"/>
    <circle cx="42" cy="42" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 42 42)"/>
    <text x="42" y="47" text-anchor="middle" class="ring-txt">${esc(label)}</text>
  </svg>`;
}
