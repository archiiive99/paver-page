/* PAVER project page — dependency-free, theme-aware, animated SVG charts.
 *
 * Every series is transcribed from the manuscript tables and from
 * figures/analysis/teaser_layout_variants_20260729/teaser_layout_source.csv,
 * so the charts and the paper report the same numbers.
 */
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* opaque tint: mixes a token colour toward the plot surface instead of using
 * opacity, so grid lines can never read through a bar or a swatch. */
const tint = (col, pct) => `color-mix(in srgb, ${col} ${pct}%, var(--plot-bg))`;

const el = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in (attrs || {})) {
    if (k === 'text') n.textContent = attrs[k];
    else n.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(n);
  return n;
};
const fmt = (v, d) => Number(v).toFixed(d == null ? 2 : d);
const shortParams = p => p === 0 ? '0' : (p >= 1e6 ? fmt(p / 1e6, p >= 1e7 ? 1 : 2) + 'M' : Math.round(p / 1e3) + 'K');

/* ── data ─────────────────────────────────────────────────────────────── */
const D = {
  cost: [
    { label: 'VAD-Tiny',        h: 21.3, ours: false },
    { label: 'VAD-Tiny + PAVER', h: 13.6, ours: true, speedup: 1.57 },
    { label: 'VAD-Base',        h: 103.0, ours: false },
    { label: 'VAD-Base + PAVER', h: 66.1, ours: true, speedup: 1.56 }
  ],
  transfer: [
    { label: 'VAD-Tiny',         l2: 0.6621, col: 0.5133, fam: 'Tiny',  ours: false },
    { label: 'VAD-Tiny + PAVER', l2: 0.6027, col: 0.1867, fam: 'Tiny',  ours: true },
    { label: 'VAD-Base',         l2: 0.7188, col: 0.2167, fam: 'Base',  ours: false },
    { label: 'VAD-Base + PAVER', l2: 0.5611, col: 0.4300, fam: 'Base',  ours: true },
    { label: 'GenAD',            l2: 0.5911, col: 0.3700, fam: 'GenAD', ours: false },
    { label: 'GenAD + PAVER',    l2: 0.5366, col: 0.2100, fam: 'GenAD', ours: true },
    { label: 'VAD-Tiny + UniPAD', l2: 0.7700, col: 0.3200, fam: 'other', reported: true, params: 6411021 },
    { label: 'VAD-Tiny + MIM4D',  l2: 0.7133, col: 0.2900, fam: 'other', reported: true, params: 13430493 },
    { label: 'VAD-Base + MIM4D',  l2: 0.6667, col: 0.1933, fam: 'other', reported: true, params: 13430493 }
  ],
  capacity: {
    ref: 0.3379,
    pts: [
      { label: 'PAVER (10K)',                 p: 10258,   nds: 0.3968, kind: 'paver' },
      { label: 'PAVER (30K)',                 p: 28450,   nds: 0.3828, kind: 'paver' },
      { label: 'PAVER (90K)',                 p: 93986,   nds: 0.3966, kind: 'paver' },
      { label: 'Detection',                   p: 3013983, nds: 0.3652, kind: 'task' },
      { label: 'Map',                         p: 2910001, nds: 0.3312, kind: 'task' },
      { label: 'Occupancy',                   p: 3561600, nds: 0.3357, kind: 'task' },
      { label: 'Detection + Map',             p: 5923984, nds: 0.3614, kind: 'task' },
      { label: 'Detection + Map + Occupancy', p: 9485584, nds: 0.3555, kind: 'task' }
    ]
  },
  horizon: {
    L2:  { unit: 'm', better: 'lower', rows: [
      { model: 'VAD-Tiny', base: [0.35, 0.63, 1.01], paver: [0.32, 0.58, 0.92] },
      { model: 'VAD-Base', base: [0.41, 0.70, 1.05], paver: [0.30, 0.53, 0.85] },
      { model: 'GenAD',    base: [0.33, 0.56, 0.88], paver: [0.28, 0.51, 0.82] }
    ]},
    Collision: { unit: '%', better: 'lower', rows: [
      { model: 'VAD-Tiny', base: [0.38, 0.45, 0.71], paver: [0.09, 0.15, 0.32] },
      { model: 'VAD-Base', base: [0.07, 0.17, 0.41], paver: [0.26, 0.43, 0.61] },
      { model: 'GenAD',    base: [0.21, 0.34, 0.56], paver: [0.09, 0.18, 0.35] }
    ]}
  },
  closed: [
    { model: 'UniAD-Tiny', ds: [48.45, 58.79], rc: [60.96, 79.06] },
    { model: 'GenAD',      ds: [34.53, 49.07], rc: [null, 58.95] }
  ],
  schedule: {
    Tiny: { scratch: { h: 21.3, l2: 0.662, col: 0.510 }, pts: [
      { ft: 10, h: 6.5,  l2: 0.637, col: 0.300 },
      { ft: 20, h: 10.1, l2: 0.647, col: 0.220 },
      { ft: 30, h: 13.6, l2: 0.603, col: 0.187 }
    ]},
    Base: { scratch: { h: 103, l2: 0.719, col: 0.217 }, pts: [
      { ft: 10, h: 31.8, l2: 0.646, col: 0.530 },
      { ft: 20, h: 49.0, l2: 0.757, col: 0.280 },
      { ft: 30, h: 66.1, l2: 0.561, col: 0.430 }
    ]}
  }
};

/* ── shared chrome ────────────────────────────────────────────────────── */
let tip = null;
function tooltip(){
  if (tip) return tip;
  tip = document.createElement('div');
  tip.className = 'tip';
  tip.setAttribute('role', 'status');
  document.body.appendChild(tip);
  return tip;
}
function showTip(html, ev){
  const t = tooltip();
  t.innerHTML = html;
  t.classList.add('on');
  const pad = 14, r = t.getBoundingClientRect();
  let x = ev.clientX + pad, y = ev.clientY + pad;
  if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
  if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - pad;
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
function hideTip(){ if (tip) tip.classList.remove('on'); }

function hoverable(node, html){
  node.addEventListener('pointerenter', e => showTip(html, e));
  node.addEventListener('pointermove', e => showTip(html, e));
  node.addEventListener('pointerleave', hideTip);
  node.setAttribute('tabindex', '0');
  node.addEventListener('focus', e => {
    const b = node.getBoundingClientRect();
    showTip(html, { clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 });
  });
  node.addEventListener('blur', hideTip);
}

function frame(host, w, h, label){
  host.innerHTML = '';
  const svg = el('svg', {
    viewBox: `0 0 ${w} ${h}`, width: '100%', role: 'img',
    'aria-label': label, class: 'chart', preserveAspectRatio: 'xMidYMid meet'
  }, host);
  return svg;
}

/* animate on first scroll into view */
const animObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('run'); animObs.unobserve(e.target); }
}), { rootMargin: '-8% 0px -8% 0px' });
function animate(svg){ if (REDUCED) svg.classList.add('run'); else animObs.observe(svg); }

function dataTable(host, caption, head, rows){
}

/* ── 1. training cost ─────────────────────────────────────────────────── */
function chartCost(host){
  const W = 720, H = 300, L = 142, R = 96, T = 22, B = 56;
  const svg = frame(host, W, H, 'Total training time in hours for VAD-Tiny and VAD-Base, with and without PAVER pretraining');
  const max = 120, x = v => L + (W - L - R) * v / max;
  const bh = 30, gap = 16, y = i => T + i * (bh + gap);

  for (let t = 0; t <= max; t += 20) {
    el('line', { x1: x(t), x2: x(t), y1: T - 6, y2: H - B + 4, class: 'grid' }, svg);
    el('text', { x: x(t), y: H - B + 26, class: 'tick mid', text: String(t) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 8, class: 'axis mid', text: 'Total training time (hours)' }, svg);

  D.cost.forEach((d, i) => {
    const g = el('g', { class: 'bar' + (d.ours ? ' ours' : '') }, svg);
    el('text', { x: L - 16, y: y(i) + bh / 2 + 4, class: 'tick end', text: d.label }, g);
    const rect = el('rect', { x: L, y: y(i), width: x(d.h) - L, height: bh, rx: 7, class: 'fill' }, g);
    rect.style.setProperty('--w', (x(d.h) - L) + 'px');
    el('text', { x: x(d.h) - 10, y: y(i) + bh / 2 + 4, class: 'val end', text: fmt(d.h, 1) + 'h' }, g);
    if (d.speedup) el('text', { x: x(d.h) + 10, y: y(i) + bh / 2 + 4, class: 'gain', text: `${fmt(d.speedup, 2)}× faster` }, g);
    hoverable(g, `<b>${d.label}</b><br>${fmt(d.h, 2)}h total on 4×RTX 5090${d.speedup ? `<br>${fmt(d.speedup, 2)}× faster than its baseline` : ''}`);
  });
  animate(svg);
}

/* ── 2. planning transfer ─────────────────────────────────────────────── */
/* an advance-width estimate good enough to keep text inside its box */
const CHAR_W = 0.57;
function textWidth(str, size){ return String(str).length * size * CHAR_W; }
function fitText(str, maxPx, size){
  str = String(str);
  if (textWidth(str, size) <= maxPx) return str;
  const keep = Math.max(3, Math.floor(maxPx / (size * CHAR_W)) - 1);
  return str.slice(0, keep) + '\u2026';
}

function spines(svg, L, R, T, B, W, H){
  el('line', { x1: L, y1: T, x2: L, y2: H - B, class: 'spine' }, svg);
  el('line', { x1: L, y1: H - B, x2: W - R, y2: H - B, class: 'spine' }, svg);
}

function halo(g, cx, cy, r, colour){
  el('circle', { cx, cy, r: r * 2.9, fill: colour, opacity: 0.10 }, g);
  el('circle', { cx, cy, r: r * 1.9, fill: colour, opacity: 0.16 }, g);
}

function chartTransfer(host){
  const W = 760, H = 500, L = 80, R = 34, T = 34, B = 74;
  const svg = frame(host, W, H, 'Planning L2 against collision rate; every arrow runs from a baseline to the same architecture pretrained with PAVER');
  const xd = [0.50, 0.80], yd = [0.10, 0.58];
  const x = v => L + (W - L - R) * (v - xd[0]) / (xd[1] - xd[0]);
  const y = v => (H - B) - (H - B - T) * (v - yd[0]) / (yd[1] - yd[0]);

  const defs = el('defs', {}, svg);
  /* the good corner is lit, so the reader knows which way is better without reading */
  const wash = el('radialGradient', { id: 'tw-good', cx: '0%', cy: '100%', r: '95%' }, defs);
  el('stop', { offset: '0%', 'stop-color': 'var(--paver)', 'stop-opacity': '0.16' }, wash);
  el('stop', { offset: '65%', 'stop-color': 'var(--paver)', 'stop-opacity': '0.03' }, wash);
  el('stop', { offset: '100%', 'stop-color': 'var(--paver)', 'stop-opacity': '0' }, wash);
  const mk = el('marker', { id: 'tw-head', viewBox: '0 0 12 12', refX: 9, refY: 6,
    markerWidth: 5.5, markerHeight: 5.5, orient: 'auto-start-reverse' }, defs);
  el('path', { d: 'M0,1 L11,6 L0,11 L3,6 z', fill: 'var(--paver)' }, mk);

  el('rect', { x: L, y: T, width: W - L - R, height: H - B - T, fill: 'url(#tw-good)' }, svg);

  for (let v = 0.50; v <= 0.801; v += 0.05) {
    el('line', { x1: x(v), x2: x(v), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: x(v), y: H - B + 26, class: 'tick mid', text: fmt(v, 2) }, svg);
  }
  for (let v = 0.1; v <= 0.581; v += 0.1) {
    el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: y(v) + 4, class: 'tick end', text: fmt(v, 1) }, svg);
  }
  spines(svg, L, R, T, B, W, H);
  el('text', { x: (L + W - R) / 2, y: H - 12, class: 'axis mid', text: 'Planning L2 (m) ↓' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`,
    text: 'Collision rate (%) ↓' }, svg);
  el('text', { x: L + 12, y: H - B - 14, class: 'goodlab start', text: 'better' }, svg);
  el('path', { d: `M${L + 12},${H - B - 34} l0,-14 m0,14 l-5,-6 m5,6 l5,-6`, class: 'goodarrow' }, svg);

  /* the transfer arrows are the message, so they are heavy and coloured */
  ['Tiny', 'Base', 'GenAD'].forEach(fam => {
    const a = D.transfer.find(p => p.fam === fam && !p.ours);
    const b = D.transfer.find(p => p.fam === fam && p.ours);
    if (!a || !b) return;
    const dx = x(b.l2) - x(a.l2), dy = y(b.col) - y(a.col), len = Math.hypot(dx, dy) || 1;
    const pad = 17;
    const x1 = x(a.l2) + dx / len * pad, y1 = y(a.col) + dy / len * pad;
    const x2 = x(b.l2) - dx / len * pad, y2 = y(b.col) - dy / len * pad;
    el('line', { x1, y1, x2, y2, class: 'twarrow-glow' }, svg);
    el('line', { x1, y1, x2, y2, class: 'twarrow', 'marker-end': 'url(#tw-head)' }, svg);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dcol = b.col - a.col, dl2 = b.l2 - a.l2;
    const txt = `${dl2 < 0 ? '−' : '+'}${fmt(Math.abs(dl2), 2)} m  ${dcol < 0 ? '−' : '+'}${fmt(Math.abs(dcol), 2)}%`;
    el('text', { x: mx + 10, y: my - 8, class: 'twdelta start', text: txt }, svg);
  });

  D.transfer.forEach(p => {
    const g = el('g', { class: 'pt' + (p.ours ? ' ours' : '') + (p.reported ? ' rep' : '') }, svg);
    if (p.ours) halo(g, x(p.l2), y(p.col), 9, 'var(--paver)');
    const r = p.ours ? 9 : (p.reported ? 6 : 6.5);
    if (p.ours) {
      el('circle', { cx: x(p.l2), cy: y(p.col), r, fill: 'var(--paver)', stroke: '#fff', 'stroke-width': 2.4 }, g);
    } else if (p.reported) {
      el('circle', { cx: x(p.l2), cy: y(p.col), r, fill: 'none', stroke: 'var(--accent-2)', 'stroke-width': 2 }, g);
    } else {
      el('circle', { cx: x(p.l2), cy: y(p.col), r, fill: 'none', stroke: 'var(--fg-3)', 'stroke-width': 2 }, g);
    }
    const anchor = p.l2 > 0.72 ? 'end' : 'start';
    el('text', { x: x(p.l2) + (anchor === 'end' ? -16 : 16), y: y(p.col) + 4,
      class: (p.ours ? 'plab strong ' : 'plab dim ') + anchor, text: p.label }, g);
    hoverable(g, `<b>${p.label}</b><br>L2 ${fmt(p.l2, 3)} m · collision ${fmt(p.col, 3)}%` +
      (p.reported ? `<br><i>reported result, ${shortParams(p.params)} auxiliary parameters</i>` : ''));
  });
  animate(svg);
}

/* ── 3. auxiliary capacity ────────────────────────────────────────────── */
function chartCapacity(host){
  const W = 760, H = 480, L = 80, R = 34, T = 44, B = 74;
  const svg = frame(host, W, H, 'Detection NDS against the number of auxiliary pretraining parameters on a logarithmic axis');
  const lo = 4e3, hi = 2.6e7;
  const x = v => L + (W - L - R) * (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
  const yd = [0.315, 0.412];
  const y = v => (H - B) - (H - B - T) * (v - yd[0]) / (yd[1] - yd[0]);

  const defs = el('defs', {}, svg);
  const band = el('linearGradient', { id: 'cap-band', x1: '0', x2: '1' }, defs);
  el('stop', { offset: '0%', 'stop-color': 'var(--paver)', 'stop-opacity': '0.16' }, band);
  el('stop', { offset: '100%', 'stop-color': 'var(--paver)', 'stop-opacity': '0' }, band);

  /* PAVER's whole budget lives in this band: three decades to the left of the rest */
  el('rect', { x: L, y: T, width: x(1.4e5) - L, height: H - B - T, fill: 'url(#cap-band)' }, svg);

  [1e4, 1e5, 1e6, 1e7].forEach(t => {
    el('line', { x1: x(t), x2: x(t), y1: T, y2: H - B, class: 'grid' }, svg);
    const g = el('text', { x: x(t), y: H - B + 26, class: 'tick mid' }, svg);
    g.append(document.createTextNode('10'));
    el('tspan', { dy: -6, 'font-size': '10', text: String(Math.round(Math.log10(t))) }, g);
  });
  for (let v = 0.32; v <= 0.4051; v += 0.02) {
    el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: y(v) + 4, class: 'tick end', text: fmt(v, 2) }, svg);
  }
  spines(svg, L, R, T, B, W, H);
  el('text', { x: (L + W - R) / 2, y: H - 12, class: 'axis mid', text: 'Auxiliary pretraining parameters ↓' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`,
    text: 'Detection NDS ↑' }, svg);

  el('line', { x1: L, x2: W - R, y1: y(D.capacity.ref), y2: y(D.capacity.ref), class: 'ref' }, svg);
  el('text', { x: W - R - 6, y: y(D.capacity.ref) - 9, class: 'reflab end', text: 'no pretraining' }, svg);

  /* the gap that matters: same NDS, three orders of magnitude apart */
  const head = D.capacity.pts.find(p => p.label === 'PAVER (10K)');
  const rival = D.capacity.pts.reduce((a, b) => (b.kind === 'task' && b.nds > a.nds) ? b : a,
    { nds: -1, p: 1, kind: 'task' });
  if (head && rival.p > 1) {
    const yy = T + 16;
    el('path', { d: `M${x(head.p)},${yy} L${x(rival.p)},${yy}`, class: 'gapline' }, svg);
    el('path', { d: `M${x(head.p)},${yy - 5} L${x(head.p)},${yy + 5}`, class: 'gapline' }, svg);
    el('path', { d: `M${x(rival.p)},${yy - 5} L${x(rival.p)},${yy + 5}`, class: 'gapline' }, svg);
    el('text', { x: (x(head.p) + x(rival.p)) / 2, y: yy - 10, class: 'gaplab mid',
      text: `${Math.round(rival.p / head.p)}× fewer parameters, higher NDS` }, svg);
  }

  D.capacity.pts.forEach(p => {
    const isPaver = p.kind === 'paver';
    const headline = p.label === 'PAVER (10K)';
    const g = el('g', { class: 'pt ' + p.kind + (headline ? ' ours' : '') }, svg);
    if (isPaver) halo(g, x(p.p), y(p.nds), headline ? 9.5 : 7, 'var(--paver)');
    if (isPaver) {
      el('circle', { cx: x(p.p), cy: y(p.nds), r: headline ? 9.5 : 7,
        fill: 'var(--paver)', stroke: '#fff', 'stroke-width': headline ? 2.4 : 1.8 }, g);
    } else {
      el('circle', { cx: x(p.p), cy: y(p.nds), r: 6, fill: 'none', stroke: 'var(--fg-3)', 'stroke-width': 2 }, g);
    }
    const anchor = p.p > 2e6 ? 'end' : 'start';
    el('text', { x: x(p.p) + (anchor === 'end' ? -16 : 16), y: y(p.nds) + 4,
      class: (isPaver ? 'plab strong ' : 'plab dim ') + anchor, text: p.label }, g);
    hoverable(g, `<b>${p.label}</b><br>NDS ${fmt(p.nds, 4)}<br>${p.p.toLocaleString()} auxiliary parameters` +
      `<br>${fmt((p.nds - D.capacity.ref) / D.capacity.ref * 100, 1)}% against no pretraining`);
  });
  animate(svg);
}

/* ── 4. per-horizon grouped bars ──────────────────────────────────────── */
function chartHorizon(host, metric){
  const spec = D.horizon[metric];
  const W = 700, H = 330, L = 68, R = 18, T = 30, B = 74;
  const svg = frame(host, W, H, `${metric} at the 1, 2 and 3 second horizons for each architecture, without and with PAVER`);
  const max = Math.max(...spec.rows.flatMap(r => [...r.base, ...r.paver])) * 1.16;
  const y = v => (H - B) - (H - B - T) * v / max;
  const groups = spec.rows.length, gw = (W - L - R) / groups;

  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4;
    el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: y(v) + 4, class: 'tick end', text: fmt(v, 2) }, svg);
  }
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`,
    text: `${metric} (${spec.unit}) ↓` }, svg);

  spec.rows.forEach((row, gi) => {
    const x0 = L + gi * gw;
    el('text', { x: x0 + gw / 2, y: H - B + 26, class: 'tick mid', text: row.model }, svg);
    [0, 1, 2].forEach(hz => {
      const slot = x0 + 14 + hz * ((gw - 28) / 3);
      const bw = (gw - 28) / 3 / 2 - 4;
      [['base', row.base[hz], false], ['paver', row.paver[hz], true]].forEach(([kind, v, ours], k) => {
        const g = el('g', { class: 'bar v' + (ours ? ' ours' : '') }, svg);
        const rect = el('rect', { x: slot + k * (bw + 3), y: y(v), width: bw, height: (H - B) - y(v), rx: 4, class: 'fill' }, g);
        rect.style.setProperty('--h', ((H - B) - y(v)) + 'px');
        rect.style.setProperty('--y0', (H - B) + 'px');
        hoverable(g, `<b>${row.model}${ours ? ' + PAVER' : ''}</b><br>${metric} at ${hz + 1}s: ${fmt(v, 2)} ${spec.unit}`);
      });
      el('text', { x: slot + (bw * 2 + 3) / 2, y: H - B + 44, class: 'hint mid', text: `${hz + 1}s` }, svg);
    });
    if (gi) el('line', { x1: x0, x2: x0, y1: T, y2: H - B + 6, class: 'sepline' }, svg);
  });
  el('g', { class: 'legend' }, svg);
  const lg = svg.querySelector('.legend');
  el('rect', { x: W - R - 150, y: 8, width: 10, height: 10, rx: 2, class: 'swatch base' }, lg);
  el('text', { x: W - R - 134, y: 17, class: 'hint start', text: 'baseline' }, lg);
  el('rect', { x: W - R - 74, y: 8, width: 10, height: 10, rx: 2, class: 'swatch ours' }, lg);
  el('text', { x: W - R - 58, y: 17, class: 'hint start', text: '+ PAVER' }, lg);
  animate(svg);
}

/* ── 5. closed-loop ───────────────────────────────────────────────────── */
function chartClosed(host){
  const W = 700, H = 300, L = 68, R = 18, T = 30, B = 70;
  const svg = frame(host, W, H, 'Driving Score and Route Completion on Bench2Drive Town05 Long, baseline against PAVER');
  const max = 100, y = v => (H - B) - (H - B - T) * v / max;
  const blocks = [['Driving Score', 'ds'], ['Route Completion', 'rc']];
  const bw = (W - L - R) / 2;

  for (let v = 0; v <= 100; v += 25) {
    el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: y(v) + 4, class: 'tick end', text: String(v) }, svg);
  }
  blocks.forEach(([title, key], bi) => {
    const x0 = L + bi * bw;
    el('text', { x: x0 + bw / 2, y: T - 12, class: 'axis mid', text: title + ' ↑' }, svg);
    D.closed.forEach((m, mi) => {
      const slot = x0 + 26 + mi * ((bw - 52) / 2);
      const w = ((bw - 52) / 2) / 2 - 6;
      m[key].forEach((v, k) => {
        if (v == null) {
          el('text', { x: slot + k * (w + 4) + w / 2, y: y(0) - 8, class: 'hint mid', text: 'n/r' }, svg);
          return;
        }
        const g = el('g', { class: 'bar v' + (k ? ' ours' : '') }, svg);
        const rect = el('rect', { x: slot + k * (w + 4), y: y(v), width: w, height: (H - B) - y(v), rx: 4, class: 'fill' }, g);
        rect.style.setProperty('--h', ((H - B) - y(v)) + 'px');
        rect.style.setProperty('--y0', (H - B) + 'px');
        el('text', { x: slot + k * (w + 4) + w / 2, y: y(v) - 7, class: 'val mid', text: fmt(v, 2) }, g);
        hoverable(g, `<b>${m.model}${k ? ' + PAVER' : ''}</b><br>${title}: ${fmt(v, 2)}`);
      });
      el('text', { x: slot + (w * 2 + 4) / 2, y: H - B + 26, class: 'tick mid', text: m.model }, svg);
    });
    if (bi) el('line', { x1: x0, x2: x0, y1: T - 20, y2: H - B + 6, class: 'sepline' }, svg);
  });
  el('text', { x: W - R, y: H - 12, class: 'hint end', text: 'n/r: not reported by the source' }, svg);
  animate(svg);
}

/* ── 6. schedule frontier ─────────────────────────────────────────────── */
function chartSchedule(host, family){
  const s = D.schedule[family];
  const W = 660, H = 360, L = 76, R = 62, T = 26, B = 70;
  const svg = frame(host, W, H, `Total training time against planning L2 and collision rate for ${family} fine-tuning budgets`);
  const hmax = family === 'Tiny' ? 24 : 112;
  const x = v => L + (W - L - R) * v / hmax;
  const l2d = family === 'Tiny' ? [0.58, 0.68] : [0.54, 0.78];
  const cod = family === 'Tiny' ? [0.15, 0.55] : [0.18, 0.56];
  const yl = v => (H - B) - (H - B - T) * (v - l2d[0]) / (l2d[1] - l2d[0]);
  const yc = v => (H - B) - (H - B - T) * (v - cod[0]) / (cod[1] - cod[0]);

  for (let t = 0; t <= hmax; t += hmax / 4) {
    el('line', { x1: x(t), x2: x(t), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: x(t), y: H - B + 26, class: 'tick mid', text: fmt(t, 0) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 18, class: 'axis mid', text: 'Total training time (hours) ↓' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid l2', transform: `rotate(-90 13 ${(T + H - B) / 2})`, text: 'Planning L2 (m) ↓' }, svg);
  el('text', { x: W - 12, y: (T + H - B) / 2, class: 'axis mid col', transform: `rotate(90 ${W - 12} ${(T + H - B) / 2})`, text: 'Collision (%) ↓' }, svg);

  el('line', { x1: x(s.scratch.h), x2: x(s.scratch.h), y1: T, y2: H - B, class: 'ref' }, svg);
  el('text', { x: x(s.scratch.h) - 8, y: T + 12, class: 'reflab end', text: `scratch, ${fmt(s.scratch.h, 1)} h` }, svg);

  ['l2', 'col'].forEach(key => {
    const yf = key === 'l2' ? yl : yc;
    const path = s.pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.h)},${yf(p[key])}`).join(' ');
    const line = el('path', { d: path, class: 'series ' + key }, svg);
    const len = line.getTotalLength ? line.getTotalLength() : 400;
    line.style.setProperty('--len', len);
    s.pts.forEach(p => {
      const g = el('g', { class: 'pt ' + key }, svg);
      el('circle', { cx: x(p.h), cy: yf(p[key]), r: 6, class: 'dot' }, g);
      hoverable(g, `<b>${family}, 20 + ${p.ft} epochs</b><br>${fmt(p.h, 1)} h · L2 ${fmt(p.l2, 3)} m · collision ${fmt(p.col, 3)}%`);
    });
    const sc = el('g', { class: 'pt scratch ' + key }, svg);
    el('circle', { cx: x(s.scratch.h), cy: yf(s.scratch[key]), r: 6, class: 'dot' }, sc);
    hoverable(sc, `<b>${family} from scratch</b><br>${fmt(s.scratch.h, 1)} h · L2 ${fmt(s.scratch.l2, 3)} m · collision ${fmt(s.scratch.col, 3)}%`);
  });
  s.pts.forEach(p => el('text', { x: x(p.h), y: H - B - 6, class: 'hint mid', text: `+${p.ft}` }, svg));
  animate(svg);
}

window.PAVER_CHARTS = { chartCost, chartTransfer, chartCapacity, chartHorizon, chartClosed, chartSchedule, D };

/* ══ analysis charts driven by data.js ════════════════════════════════════
 * Values follow the checkpoint provenance recorded for the paper.
 */
const DATA = () => window.PAVER_DATA || null;
const SERIES_COLOR = [
  '--accent', '--accent-3', '--accent-2', '--muted', '--ours'
];
const PAVER_RUN = /PAVER/i;
function seriesStroke(i, ours){
  if (ours) return 'var(--paver)';
  /* muted greys and desaturated hues so the PAVER runs stay dominant */
  /* muted greys so the PAVER runs stay dominant */
  return ['#8d95a3', '#7d8898', '#9aa3b1', '#6f7a89', '#848d9c', '#98a2b0', '#727c8b', '#8a93a1'][i % 8];
}
const PAVER_TONE = ['#209EFF', '#0d7fd6', '#5cb8ff', '#1b6fb5'];

/* ── 7. learning trajectories ─────────────────────────────────────────── */
function chartTrajectories(host, metric, hidden){
  const d = DATA(); if (!d) return;
  const S = d.traj.series[metric] || {};
  const names = Object.keys(S).sort((a, b) => (a.includes('PAVER') ? -1 : 1) - (b.includes('PAVER') ? -1 : 1) || a.localeCompare(b));
  const vis = names.filter(n => !hidden.has(n));
  const W = 720, H = 400, L = 76, R = 150, T = 20, B = 62;
  const svg = frame(host, W, H, `${metric} against downstream epoch for every VAD-Tiny experiment`);
  const pts = vis.flatMap(n => S[n]);
  if (!pts.length) return;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = (y1 - y0) * 0.12 || 0.02; y0 -= pad; y1 += pad;
  const X = v => L + (W - L - R) * (v - x0) / ((x1 - x0) || 1);
  const Y = v => (H - B) - (H - B - T) * (v - y0) / ((y1 - y0) || 1);

  for (let i = 0; i <= 4; i++) {
    const v = y0 + (y1 - y0) * i / 4;
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, 3) }, svg);
  }
  const step = x1 > 30 ? 10 : 5;
  for (let e = Math.ceil(x0 / step) * step; e <= x1; e += step) {
    el('line', { x1: X(e), x2: X(e), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: X(e), y: H - B + 26, class: 'tick mid', text: String(e) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 12, class: 'axis mid', text: 'Downstream epoch' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`, text: metric }, svg);

  /* baselines first, PAVER runs last so they paint on top */
  const order = names.map((n, i) => [n, i]).sort((a, b) =>
    (PAVER_RUN.test(a[0]) ? 1 : 0) - (PAVER_RUN.test(b[0]) ? 1 : 0));
  let paverSeen = 0;
  order.forEach(([n, i]) => {
    if (hidden.has(n)) return;
    const isPaver = PAVER_RUN.test(n);
    const colour = isPaver ? PAVER_TONE[paverSeen++ % PAVER_TONE.length] : seriesStroke(i, false);
    const path = S[n].map((p, k) => `${k ? 'L' : 'M'}${X(p[0])},${Y(p[1])}`).join(' ');
    const line = el('path', { d: path, class: 'series', fill: 'none' }, svg);
    line.setAttribute('stroke', colour);
    line.setAttribute('stroke-width', isPaver ? 3.4 : 1.5);
    line.setAttribute('opacity', isPaver ? 1 : 0.5);
    const len = line.getTotalLength ? line.getTotalLength() : 600;
    line.style.setProperty('--len', len);
    /* no markers: a transparent wide copy of the path carries the hover instead */
    const best = S[n].reduce((a, b) => (/L2|Collision|ADE|FDE|MR/.test(metric) ? (b[1] < a[1] ? b : a) : (b[1] > a[1] ? b : a)));
    const last = S[n][S[n].length - 1];
    const hit = el('path', { d: path, fill: 'none', stroke: 'transparent', 'stroke-width': 12 }, svg);
    hoverable(hit, `<b>${n}</b><br>${metric}<br>best ${fmt(best[1], 4)} at epoch ${best[0]}` +
      `<br>final ${fmt(last[1], 4)} at epoch ${last[0]}`);
  });

  const lg = el('g', { class: 'legend' }, svg);
  let legendPaver = 0;
  names.forEach((n, i) => {
    const isPaver = PAVER_RUN.test(n);
    const colour = isPaver ? PAVER_TONE[legendPaver++ % PAVER_TONE.length] : seriesStroke(i, false);
    const yy = T + 6 + i * 15;
    const row = el('g', { class: 'lgrow', style: 'cursor:pointer' }, lg);
    el('rect', { x: W - R + 8, y: yy - 7, width: 18, height: isPaver ? 5 : 3, rx: 2,
      fill: hidden.has(n) ? 'rgba(140,150,165,.35)' : colour }, row);
    el('text', { x: W - R + 31, y: yy - 1, class: 'hint start',
      text: fitText(n, R - 39, 12.5),
      'font-weight': isPaver ? 700 : 400,
      opacity: hidden.has(n) ? .4 : (isPaver ? 1 : .72) }, row);
    row.addEventListener('click', () => {
      hidden.has(n) ? hidden.delete(n) : hidden.add(n);
      chartTrajectories(host, metric, hidden);
    });
    hoverable(row, `<b>${n}</b><br>${hidden.has(n) ? 'hidden, select to show' : 'select to hide'}`);
  });
  animate(svg);
}

/* ── 8. paired tail safety ────────────────────────────────────────────── */
/* ── 9. harder-against-easier scene gains with bootstrap intervals ────── */
/* ── 10. route command × horizon ──────────────────────────────────────── */
function chartRoute(host){
  const d = DATA(); if (!d) return;
  const rows = d.route;
  const cmds = ['straight', 'left', 'right'].filter(c => rows.some(r => r.cmd === c));
  const W = 700, H = 340, L = 72, R = 20, T = 34, B = 72;
  const svg = frame(host, W, H, 'Planning L2 by route command and horizon, baseline against PAVER, with bootstrap intervals on the gain');
  const max = Math.max(...rows.flatMap(r => [r.base, r.paver, r.hi])) * 1.12;
  const Y = v => (H - B) - (H - B - T) * v / max;
  const gw = (W - L - R) / cmds.length;

  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4;
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, 2) }, svg);
  }
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`, text: 'Planning L2 (m) ↓' }, svg);

  cmds.forEach((cmd, ci) => {
    const x0 = L + ci * gw;
    el('text', { x: x0 + gw / 2, y: H - B + 26, class: 'tick mid', text: cmd }, svg);
    [1, 2, 3].forEach((hz, hi) => {
      const r = rows.find(x => x.cmd === cmd && x.h === hz); if (!r) return;
      const slot = x0 + 14 + hi * ((gw - 28) / 3);
      const bw = ((gw - 28) / 3) / 2 - 4;
      [['base', r.base, false], ['paver', r.paver, true]].forEach(([k, v, ours], j) => {
        const g = el('g', { class: 'bar v' + (ours ? ' ours' : '') }, svg);
        const rect = el('rect', { x: slot + j * (bw + 3), y: Y(v), width: bw, height: (H - B) - Y(v), rx: 4, class: 'fill' }, g);
        rect.style.setProperty('--h', ((H - B) - Y(v)) + 'px');
        hoverable(g, `<b>${cmd}, ${hz}s ${ours ? '· PAVER' : '· baseline'}</b><br>L2 ${fmt(v, 3)} m<br>` +
          `gain ${fmt(r.gain, 3)} m, 95% CI [${fmt(r.lo, 3)}, ${fmt(r.hi, 3)}]<br><i>${r.n} samples</i>`);
      });
      el('text', { x: slot + bw + 1.5, y: H - B + 44, class: 'hint mid', text: `${hz}s` }, svg);
    });
    if (ci) el('line', { x1: x0, x2: x0, y1: T, y2: H - B + 6, class: 'sepline' }, svg);
  });
  const lg = el('g', {}, svg);
  el('rect', { x: W - R - 150, y: 10, width: 10, height: 10, rx: 2, class: 'swatch base' }, lg);
  el('text', { x: W - R - 134, y: 19, class: 'hint start', text: 'baseline' }, lg);
  el('rect', { x: W - R - 74, y: 10, width: 10, height: 10, rx: 2, class: 'swatch ours' }, lg);
  el('text', { x: W - R - 58, y: 19, class: 'hint start', text: '+ PAVER' }, lg);
  animate(svg);
}

Object.assign(window.PAVER_CHARTS, { chartTrajectories, chartRoute });

/* ── 11. layerwise CKA ────────────────────────────────────────────────── */
function chartCKA(host){
  const d = DATA(); if (!d || !d.cka) return;
  const layers = d.cka.layers, pairs = d.cka.pairs;
  const W = 720, H = 360, L = 74, R = 178, T = 22, B = 86;
  const svg = frame(host, W, H, 'Linear CKA between model pairs at each encoder layer');
  const X = i => L + (W - L - R) * (layers.length === 1 ? .5 : i / (layers.length - 1));
  const Y = v => (H - B) - (H - B - T) * (v - 0) / 1;
  for (let v = 0; v <= 1.001; v += 0.25) {
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, 2) }, svg);
  }
  layers.forEach((lay, i) => el('text', {
    x: X(i), y: H - B + 24, class: 'tick end',
    transform: `rotate(-38 ${X(i)} ${H - B + 24})`, text: lay.replace(/_/g, ' ')
  }, svg));
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`, text: 'Linear CKA' }, svg);
  pairs.forEach((p, k) => {
    const pts = d.cka.series[p];
    const path = pts.map((r, i) => `${i ? 'L' : 'M'}${X(layers.indexOf(r[0]))},${Y(r[1])}`).join(' ');
    const line = el('path', { d: path, fill: 'none', class: 'series' }, svg);
    line.setAttribute('stroke', seriesStroke(k, /paver/i.test(p)));
    line.setAttribute('stroke-width', /paver/i.test(p) ? 2.6 : 1.8);
    line.style.setProperty('--len', line.getTotalLength ? line.getTotalLength() : 500);
    pts.forEach(r => {
      const g = el('g', { class: 'pt' }, svg);
      const c = el('circle', { cx: X(layers.indexOf(r[0])), cy: Y(r[1]), r: 4, class: 'dot' }, g);
      c.setAttribute('fill', seriesStroke(k, /paver/i.test(p)));
      hoverable(g, `<b>${p}</b><br>${r[0].replace(/_/g, ' ')}<br>CKA ${fmt(r[1], 4)}`);
    });
    el('rect', { x: W - R + 8, y: T + 6 + k * 16 - 7, width: 18, height: 3, rx: 1.5, fill: seriesStroke(k, /paver/i.test(p)) }, svg);
    el('text', { x: W - R + 31, y: T + 6 + k * 16 - 1, class: 'hint start',
      text: fitText(p.replace(/_epoch(\d+)/g, ' e$1'), R - 39, 12.5) }, svg);
  });
  animate(svg);
}

/* ── 12. region-wise linear probe ─────────────────────────────────────── */
function chartProbe(host){
  const d = DATA(); if (!d || !d.probe) return;
  const rows = d.probe;
  const models = Array.from(new Set(rows.map(r => r.model)));
  const regions = Array.from(new Set(rows.map(r => r.region)));
  const W = 700, H = 320, L = 72, R = 20, T = 34, B = 72;
  const svg = frame(host, W, H, 'Balanced accuracy of a linear probe on the BEV features, by region and model');
  const Y = v => (H - B) - (H - B - T) * (v - 0.45) / (1.0 - 0.45);
  for (let v = 0.5; v <= 1.001; v += 0.1) {
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, 2) }, svg);
  }
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`, text: 'Balanced accuracy ↑' }, svg);
  const gw = (W - L - R) / regions.length;
  regions.forEach((reg, ri) => {
    const x0 = L + ri * gw;
    el('text', { x: x0 + gw / 2, y: H - B + 26, class: 'tick mid', text: reg }, svg);
    models.forEach((m, mi) => {
      const r = rows.find(x => x.model === m && x.region === reg); if (!r) return;
      const bw = (gw - 30) / models.length - 5;
      const x = x0 + 15 + mi * (bw + 5);
      const ours = /paver/i.test(m);
      const g = el('g', { class: 'bar v' + (ours ? ' ours' : '') }, svg);
      const rect = el('rect', { x, y: Y(r.ba), width: bw, height: (H - B) - Y(r.ba), rx: 4, class: 'fill' }, g);
      rect.style.setProperty('--h', ((H - B) - Y(r.ba)) + 'px');
      el('line', { x1: x + bw / 2, x2: x + bw / 2, y1: Y(r.lo), y2: Y(r.hi), stroke: 'var(--fg)', 'stroke-width': 1.4, opacity: .55 }, g);
      hoverable(g, `<b>${m}</b> · ${reg}<br>balanced accuracy ${fmt(r.ba, 4)}<br>95% CI [${fmt(r.lo, 3)}, ${fmt(r.hi, 3)}]<br>macro ROC AUC ${fmt(r.auc, 3)}`);
    });
    if (ri) el('line', { x1: x0, x2: x0, y1: T, y2: H - B + 6, class: 'sepline' }, svg);
  });
  const swatchW = Math.min(150, (W - L - R) / models.length);
  models.forEach((m, mi) => {
    const sx = L + mi * swatchW;
    el('rect', { x: sx, y: 10, width: 10, height: 10, rx: 2,
      class: 'swatch ' + (/paver/i.test(m) ? 'ours' : 'base') }, svg);
    el('text', { x: sx + 16, y: 19, class: 'hint start',
      text: fitText(m.replace(/_epoch(\d+)/, ' e$1'), swatchW - 22, 12.5) }, svg);
  });
  animate(svg);
}

/* ── 13. intervention deltas on the PAVER head ────────────────────────── */
function chartPathways(host){
  const d = DATA(); if (!d || !d.pathways) return;
  const kinds = Array.from(new Set(d.pathways.map(r => r.k)));
  const hs = Array.from(new Set(d.pathways.map(r => r.h))).sort();
  const W = 700, L = 182, R = 34, T = 26, B = 62;
  const rh = 18, H = T + kinds.length * hs.length * rh + kinds.length * 8 + B;
  const svg = frame(host, W, H, 'Change in PAVER head loss under each input intervention, with bootstrap intervals');
  const lim = Math.max(...d.pathways.map(r => Math.max(r.hi, Math.abs(r.lo)))) * 1.05;
  const X = v => L + (W - L - R) * v / lim;
  for (let i = 0; i <= 4; i++) {
    const v = lim * i / 4;
    el('line', { x1: X(v), x2: X(v), y1: T - 6, y2: H - B + 4, class: 'grid' }, svg);
    el('text', { x: X(v), y: H - B + 26, class: 'tick mid', text: fmt(v, 2) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 12, class: 'axis mid', text: 'Loss increase when the input is removed or shuffled' }, svg);
  let y = T;
  kinds.forEach(k => {
    el('text', { x: L - 16, y: y + 12, class: 'plab end', text: k }, svg);
    hs.forEach(hz => {
      const r = d.pathways.find(x => x.k === k && x.h === hz); if (!r) return;
      const yy = y + 9;
      const sig = r.lo > 0;
      const g = el('g', { class: 'pt' + (sig ? ' ours' : '') }, svg);
      el('text', { x: L - 8, y: yy + 4, class: 'hint start', text: `${hz}s`, opacity: 0.85 }, g);
      el('line', { x1: X(Math.max(0, r.lo)), x2: X(r.hi), y1: yy, y2: yy,
        stroke: sig ? 'var(--paver)' : 'var(--fg-3)', 'stroke-width': 2, opacity: sig ? .9 : .45 }, g);
      const dot = el('circle', { cx: X(r.v), cy: yy, r: 4, class: 'dot' }, g);
      dot.setAttribute('fill', sig ? 'var(--paver)' : 'var(--fg-3)');

      hoverable(g, `<b>${k}</b> at ${hz}s<br>Δloss ${fmt(r.v, 4)}<br>95% CI [${fmt(r.lo, 4)}, ${fmt(r.hi, 4)}]` +
        `<br><i>${sig ? 'the head demonstrably uses this input' : 'no measurable dependence'}</i>`);
      y += rh;
    });
    y += 8;
  });
  animate(svg);
}

/* ── 14. calibration of the two targets ───────────────────────────────── */
function chartCalib(host){
  const d = DATA(); if (!d || !d.calib) return;
  const comps = Array.from(new Set(d.calib.map(r => r.c)));
  const hs = Array.from(new Set(d.calib.map(r => r.h))).sort();
  const W = 660, H = 300, L = 72, R = 20, T = 34, B = 68;
  const svg = frame(host, W, H, 'Expected calibration error of the risk and unknown targets at each horizon');
  const max = Math.max(...d.calib.map(r => r.hi)) * 1.12;
  const Y = v => (H - B) - (H - B - T) * v / max;
  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4;
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, 3) }, svg);
  }
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`, text: 'Expected calibration error ↓' }, svg);
  const gw = (W - L - R) / hs.length;
  hs.forEach((hz, hi) => {
    const x0 = L + hi * gw;
    el('text', { x: x0 + gw / 2, y: H - B + 26, class: 'tick mid', text: `${hz}s` }, svg);
    comps.forEach((c, ci) => {
      const r = d.calib.find(x => x.c === c && x.h === hz); if (!r) return;
      const bw = (gw - 34) / comps.length - 6;
      const x = x0 + 17 + ci * (bw + 6);
      const g = el('g', { class: 'bar v' + (ci ? '' : ' ours') }, svg);
      const rect = el('rect', { x, y: Y(r.ece), width: bw, height: (H - B) - Y(r.ece), rx: 4, class: 'fill' }, g);
      rect.style.setProperty('--h', ((H - B) - Y(r.ece)) + 'px');
      el('line', { x1: x + bw / 2, x2: x + bw / 2, y1: Y(r.lo), y2: Y(r.hi), stroke: 'var(--fg)', 'stroke-width': 1.4, opacity: .5 }, g);
      hoverable(g, `<b>${c} target</b> at ${hz}s<br>ECE ${fmt(r.ece, 4)}<br>95% CI [${fmt(r.lo, 4)}, ${fmt(r.hi, 4)}]<br>Brier ${fmt(r.brier, 4)}`);
    });
    if (hi) el('line', { x1: x0, x2: x0, y1: T, y2: H - B + 6, class: 'sepline' }, svg);
  });
  comps.forEach((c, ci) => {
    el('rect', { x: W - R - 150 + ci * 78, y: 10, width: 10, height: 10, rx: 2, class: 'swatch ' + (ci ? 'base' : 'ours') }, svg);
    el('text', { x: W - R - 134 + ci * 78, y: 19, class: 'hint start', text: c }, svg);
  });
  animate(svg);
}

/* ── 15. camera dropout robustness ────────────────────────────────────── */
/* ── 16. environment conditions ───────────────────────────────────────── */
/* ── 17. learning-curve area under the curve ──────────────────────────── */
function chartAUC(host){
  const d = DATA(); if (!d || !d.auc) return;
  const rows = d.auc.filter(r => r.series === 'Ours');
  const W = 700, L = 210, R = 40, T = 26, B = 62;
  const rh = 24, H = T + rows.length * rh + B;
  const svg = frame(host, W, H, 'Signed advantage in the epoch 1 to 30 area under the learning curve, per metric');
  const lim = Math.max(...rows.map(r => Math.abs(r.adv))) * 1.15;
  const X = v => L + (W - L - R) * (v + lim) / (2 * lim);
  for (let i = 0; i <= 4; i++) {
    const v = -lim + 2 * lim * i / 4;
    el('line', { x1: X(v), x2: X(v), y1: T - 6, y2: H - B + 4, class: 'grid' }, svg);
    el('text', { x: X(v), y: H - B + 26, class: 'tick mid', text: fmt(v, 2) }, svg);
  }
  el('line', { x1: X(0), x2: X(0), y1: T - 6, y2: H - B + 4, class: 'ref' }, svg);
  el('text', { x: (L + W - R) / 2, y: H - 12, class: 'axis mid', text: 'Signed AUC advantage over the scratch baseline, epochs 1 to 30' }, svg);
  rows.forEach((r, i) => {
    const y = T + i * rh + 4;
    const g = el('g', { class: 'bar' + (r.adv > 0 ? ' ours' : '') }, svg);
    el('text', { x: L - 16, y: y + 12, class: 'tick end', text: r.metric }, g);
    const x = Math.min(X(0), X(r.adv)), w = Math.abs(X(r.adv) - X(0));
    const rect = el('rect', { x, y, width: w, height: rh - 9, rx: 4, class: 'fill' }, g);
    rect.style.setProperty('--w', w + 'px');
    hoverable(g, `<b>${r.metric}</b><br>PAVER mean ${fmt(r.mean, 4)}<br>baseline ${fmt(r.base, 4)}<br>` +
      `signed AUC advantage ${fmt(r.adv, 4)}`);
  });
  animate(svg);
}

/* ── 18. gradient routing ─────────────────────────────────────────────── */
function chartRouting(host){
  const d = DATA(); if (!d || !d.routing) return;
  const rows = d.routing;
  const W = 700, L = 130, R = 30, T = 34, B = 58;
  const rh = 34, H = T + rows.length * rh + B;
  const svg = frame(host, W, H, 'Share of each task gradient reaching the image backbone, the BEV encoder, and other transferred parameters');
  const X = v => L + (W - L - R) * v;
  for (let v = 0; v <= 1.001; v += 0.25) {
    el('line', { x1: X(v), x2: X(v), y1: T - 8, y2: H - B + 4, class: 'grid' }, svg);
    el('text', { x: X(v), y: H - B + 26, class: 'tick mid', text: Math.round(v * 100) + '%' }, svg);
  }
  const parts = [['img', 'image backbone', 'var(--fg-3)', 55], ['bev', 'BEV encoder and ego', 'var(--paver)', 95], ['other', 'other transferred', 'var(--accent-2)', 80]];
  rows.forEach((r, i) => {
    const y = T + i * rh;
    el('text', { x: L - 16, y: y + 20, class: 'tick end', text: r.task }, svg);
    let acc = 0;
    parts.forEach(([k, lab, col, op]) => {
      const g = el('g', { class: 'bar' }, svg);
      const w = X(acc + r[k]) - X(acc);
      const rect = el('rect', { x: X(acc), y: y + 4, width: w, height: rh - 14, rx: 3, fill: tint(col, op) }, g);
      rect.style.setProperty('--w', w + 'px');
      hoverable(g, `<b>${r.task}</b><br>${lab}: ${fmt(r[k] * 100, 1)}% of the gradient norm`);
      if (w > 40) el('text', { x: X(acc) + w / 2, y: y + rh / 2 + 2, class: 'val mid', text: fmt(r[k] * 100, 0) + '%' }, g);
      acc += r[k];
    });
  });
  parts.forEach(([k, lab, col, op], i) => {
    el('rect', { x: L + i * 190, y: 8, width: 10, height: 10, rx: 2, fill: tint(col, op) }, svg);
    el('text', { x: L + i * 190 + 16, y: 17, class: 'hint start', text: lab }, svg);
  });
  animate(svg);
}

/* ── 19. target composition by region ─────────────────────────────────── */
function chartTargets(host){
  const d = DATA(); if (!d || !d.targets) return;
  const rows = d.targets.filter(r => r.type === 'angular' || r.region === 'all');
  const regions = Array.from(new Set(rows.map(r => r.region)));
  const states = ['free', 'occupied', 'unknown'];
  const W = 700, L = 130, R = 30, T = 34, B = 58;
  const rh = 26, H = T + regions.length * rh + B;
  const svg = frame(host, W, H, 'Fraction of queried cells that are free, occupied or unknown, by bearing');
  const X = v => L + (W - L - R) * v;
  for (let v = 0; v <= 1.001; v += 0.25) {
    el('line', { x1: X(v), x2: X(v), y1: T - 8, y2: H - B + 4, class: 'grid' }, svg);
    el('text', { x: X(v), y: H - B + 26, class: 'tick mid', text: Math.round(v * 100) + '%' }, svg);
  }
  const col = { free: 'var(--accent-3)', occupied: 'var(--paver)', unknown: 'var(--fg-3)' };
  regions.forEach((reg, i) => {
    const y = T + i * rh;
    el('text', { x: L - 16, y: y + 16, class: 'tick end', text: reg === 'all' ? 'whole BEV' : reg }, svg);
    let acc = 0;
    states.forEach(s => {
      const r = rows.find(x => x.region === reg && x.state === s); if (!r) return;
      const g = el('g', { class: 'bar' }, svg);
      const w = X(acc + r.frac) - X(acc);
      const rect = el('rect', { x: X(acc), y: y + 3, width: w, height: rh - 11, rx: 3, fill: col[s], opacity: s === 'unknown' ? .45 : .9 }, g);
      rect.style.setProperty('--w', w + 'px');
      hoverable(g, `<b>${reg === 'all' ? 'whole BEV' : reg}</b><br>${s}: ${fmt(r.frac * 100, 2)}%<br>95% CI [${fmt(r.lo * 100, 2)}%, ${fmt(r.hi * 100, 2)}%]`);
      acc += r.frac;
    });
  });
  states.forEach((s, i) => {
    el('rect', { x: L + i * 120, y: 8, width: 10, height: 10, rx: 2, fill: col[s], opacity: s === 'unknown' ? .45 : .9 }, svg);
    el('text', { x: L + i * 120 + 16, y: 17, class: 'hint start', text: s }, svg);
  });
  animate(svg);
}

/* ── 20. metric correlation matrix ────────────────────────────────────── */
function chartCorr(host, scope){
  const d = DATA(); if (!d || !d.corr) return;
  const mets = d.corr.metrics;
  const cells = d.corr.cells.filter(c => c.s === scope);
  const n = mets.length;
  const L = 190, T = 176, cell = 42, R = 24, B = 36;
  const W = L + n * cell + R, H = T + n * cell + B;
  const svg = frame(host, W, H, `Correlation between downstream metrics, ${scope}`);
  mets.forEach((m, i) => {
    el('text', { x: L - 14, y: T + i * cell + cell / 2 + 4, class: 'tick end', text: m }, svg);
    const cx = L + i * cell + cell / 2;
    el('text', { x: cx, y: T - 10, class: 'tick start', transform: `rotate(-45 ${cx} ${T - 10})`, text: m }, svg);
  });
  cells.forEach(c => {
    const i = mets.indexOf(c.b), j = mets.indexOf(c.a);
    if (i < 0 || j < 0) return;
    const g = el('g', { class: 'pt' }, svg);
    const pos = c.v >= 0;
    el('rect', {
      x: L + i * cell + 2, y: T + j * cell + 2, width: cell - 4, height: cell - 4, rx: 5,
      fill: pos ? 'var(--paver)' : 'var(--accent-2)', opacity: 0.1 + 0.8 * Math.abs(c.v)
    }, g);
    el('text', { x: L + i * cell + cell / 2, y: T + j * cell + cell / 2 + 4,
      class: 'val mid', text: fmt(c.v, 2).replace('0.', '.') , 'font-size': 11 }, g);
    hoverable(g, `<b>${c.a}</b> vs <b>${c.b}</b><br>correlation ${fmt(c.v, 4)}<br><i>${scope}</i>`);
  });
  animate(svg);
}

Object.assign(window.PAVER_CHARTS, { chartCKA, chartProbe, chartPathways, chartCalib,
  chartAUC, chartRouting, chartTargets, chartCorr });

/* ── 21. multi-task radar ─────────────────────────────────────────────── */
const RADAR = {
  axes: [
    { key: 'l2',  label: 'Planning L2',  unit: ' m', lower: true },
    { key: 'col', label: 'Collision',    unit: '%',  lower: true },
    { key: 'ade', label: 'Motion ADE',   unit: ' m', lower: true },
    { key: 'mr',  label: 'Motion MR',    unit: '',   lower: true },
    { key: 'nds', label: 'Detection NDS', unit: '',  lower: false },
    { key: 'map', label: 'Map mAP',      unit: '',   lower: false }
  ],
  models: {
    'VAD-Tiny': {
      base: { l2: 0.66, col: 0.51, ade: 0.91, mr: 0.13, nds: 0.34, map: 0.42 },
      ours: { l2: 0.60, col: 0.19, ade: 0.80, mr: 0.12, nds: 0.40, map: 0.44 }
    },
    'VAD-Base': {
      base: { l2: 0.72, col: 0.22, ade: 0.69, mr: 0.09, nds: 0.46, map: 0.48 },
      ours: { l2: 0.56, col: 0.43, ade: 0.69, mr: 0.09, nds: 0.45, map: 0.50 }
    },
    'GenAD': {
      base: { l2: 0.59, col: 0.37, ade: 0.90, mr: 0.13, nds: 0.26, map: 0.46 },
      ours: { l2: 0.54, col: 0.21, ade: 0.80, mr: 0.11, nds: 0.28, map: 0.44 }
    }
  }
};

function chartRadar(host, model) {
  const spec = RADAR.models[model] || RADAR.models['VAD-Tiny'];
  const axes = RADAR.axes;
  const W = 620, H = 480, cx = W / 2, cy = H / 2 + 4, R = 156;
  const svg = frame(host, W, H,
    `Multi-task profile of ${model} without and with PAVER, six normalized axes where outward is better`);

  /* normalize each axis across every model so the shape is comparable */
  const range = {};
  axes.forEach(a => {
    const vals = Object.values(RADAR.models).flatMap(m => [m.base[a.key], m.ours[a.key]]);
    range[a.key] = { lo: Math.min(...vals), hi: Math.max(...vals) };
  });
  const norm = (a, v) => {
    const { lo, hi } = range[a.key];
    const t = hi === lo ? 1 : (v - lo) / (hi - lo);
    return 0.18 + 0.82 * (a.lower ? 1 - t : t);
  };
  const angle = i => -Math.PI / 2 + i * 2 * Math.PI / axes.length;
  const px = (i, r) => cx + R * r * Math.cos(angle(i));
  const py = (i, r) => cy + R * r * Math.sin(angle(i));

  [0.25, 0.5, 0.75, 1].forEach(ring => {
    el('polygon', {
      points: axes.map((_, i) => `${px(i, ring)},${py(i, ring)}`).join(' '), class: 'web'
    }, svg);
  });
  axes.forEach((a, i) => {
    el('line', { x1: cx, y1: cy, x2: px(i, 1), y2: py(i, 1), class: 'spoke' }, svg);
    const lx = cx + (R + 34) * Math.cos(angle(i));
    const ly = cy + (R + 34) * Math.sin(angle(i));
    const anchor = Math.abs(Math.cos(angle(i))) < 0.2 ? 'mid'
                 : (Math.cos(angle(i)) > 0 ? 'start' : 'end');
    el('text', { x: lx, y: ly, class: 'rlab ' + anchor, text: a.label }, svg);
    el('text', {
      x: lx, y: ly + 17, class: 'rsub ' + anchor,
      text: `${fmt(spec.base[a.key], 2)} → ${fmt(spec.ours[a.key], 2)}${a.unit}`
    }, svg);
  });

  [['base', spec.base, model], ['ours', spec.ours, model + ' + PAVER']].forEach(([cls, row, name]) => {
    const pts = axes.map((a, i) => [px(i, norm(a, row[a.key])), py(i, norm(a, row[a.key]))]);
    const poly = el('polygon', { points: pts.map(p => p.join(',')).join(' '), class: 'poly ' + cls }, svg);
    poly.style.transformOrigin = `${cx}px ${cy}px`;
    pts.forEach((p, i) => {
      const a = axes[i];
      const g = el('g', { class: 'pt' + (cls === 'ours' ? ' ours' : '') }, svg);
      el('circle', { cx: p[0], cy: p[1], r: cls === 'ours' ? 5 : 4, class: 'dot' }, g);
      const better = a.lower ? row[a.key] < spec.base[a.key] : row[a.key] > spec.base[a.key];
      hoverable(g, `<b>${name}</b><br>${a.label}: ${fmt(row[a.key], 3)}${a.unit}` +
        (cls === 'ours'
          ? `<br>baseline ${fmt(spec.base[a.key], 3)}${a.unit}<br><i>${better ? 'improved' : 'not improved'}</i>`
          : ''));
    });
  });

  el('rect', { x: W - 176, y: 12, width: 12, height: 4, rx: 2, class: 'swatch base' }, svg);
  el('text', { x: W - 158, y: 18, class: 'hint start', text: model }, svg);
  el('rect', { x: W - 176, y: 32, width: 12, height: 4, rx: 2, class: 'swatch ours' }, svg);
  el('text', { x: W - 158, y: 38, class: 'hint start', text: model + ' + PAVER' }, svg);
  el('text', { x: cx, y: H - 6, class: 'hint mid', text: 'each axis normalized across all three architectures, outward is better' }, svg);
  animate(svg);
}

Object.assign(window.PAVER_CHARTS, { chartRadar, RADAR, hoverable, showTip, hideTip });

/* ── 22. generic metric-row bars, one metric at a time ────────────────── */
const ROWSETS = {
  pseudo: {
    metrics: [['l2', 'Planning L2 (m)', true], ['col', 'Collision (%)', true],
              ['ade', 'Motion ADE (m)', true], ['fde', 'Motion FDE (m)', true],
              ['mr', 'Motion MR', true], ['nds', 'Detection NDS', false], ['map', 'Map mAP', false]],
    rows: [
      { label: 'No pretraining', l2: 0.662, col: 0.513, ade: 0.905, fde: 1.250, mr: 0.135, nds: 0.338, map: 0.419 },
      { label: 'Pseudo-LiDAR', l2: 0.563, col: 0.560, ade: 0.831, fde: 1.101, mr: 0.121, nds: 0.386, map: 0.439 },
      { label: 'LiDAR', ours: true, l2: 0.603, col: 0.187, ade: 0.803, fde: 1.086, mr: 0.121, nds: 0.397, map: 0.439 }
    ]
  },
  map: {
    metrics: [['divider', 'Divider AP', false], ['ped', 'Ped. crossing AP', false],
              ['boundary', 'Boundary AP', false], ['map', 'Map mAP', false]],
    rows: [
      { label: 'VAD-Tiny', fam: 'VAD-Tiny', divider: 0.42, ped: 0.31, boundary: 0.46, map: 0.40 },
      { label: 'VAD-Tiny + PAVER', fam: 'VAD-Tiny', ours: true, divider: 0.48, ped: 0.34, boundary: 0.49, map: 0.44 },
      { label: 'VAD-Base', fam: 'VAD-Base', divider: 0.52, ped: 0.41, boundary: 0.51, map: 0.48 },
      { label: 'VAD-Base + PAVER', fam: 'VAD-Base', ours: true, divider: 0.53, ped: 0.44, boundary: 0.52, map: 0.50 },
      { label: 'GenAD', fam: 'GenAD', divider: 0.50, ped: 0.38, boundary: 0.49, map: 0.46 },
      { label: 'GenAD + PAVER', fam: 'GenAD', ours: true, divider: 0.47, ped: 0.35, boundary: 0.48, map: 0.44 }
    ]
  },
  methods: {
    metrics: [['l2a', 'Planning L2, 3 s (m)', true], ['cola', 'Collision, 3 s (%)', true],
              ['params', 'Auxiliary parameters (M)', true]],
    rows: [
      { label: 'VAD-Tiny', fam: 'VAD-Tiny', l2a: 1.12, cola: 0.58, params: 0.00 },
      { label: 'VAD-Tiny + UniPAD', fam: 'VAD-Tiny', l2a: 1.11, cola: 0.46, params: 6.41 },
      { label: 'VAD-Tiny + MIM4D', fam: 'VAD-Tiny', l2a: 1.06, cola: 0.38, params: 13.43 },
      { label: 'VAD-Tiny + PAVER', fam: 'VAD-Tiny', ours: true, l2a: 0.92, cola: 0.32, params: 0.01 },
      { label: 'VAD-Base', fam: 'VAD-Base', l2a: 1.05, cola: 0.41, params: 0.00 },
      { label: 'VAD-Base + MIM4D', fam: 'VAD-Base', l2a: 1.00, cola: 0.36, params: 13.43 },
      { label: 'VAD-Base + PAVER', fam: 'VAD-Base', ours: true, l2a: 0.85, cola: 0.61, params: 0.01 }
    ]
  },
  strategy: {
    metrics: [['col', 'Collision (%)', true], ['l2', 'Planning L2 (m)', true],
              ['nds', 'Detection NDS', false], ['ade', 'Motion ADE (m)', true],
              ['map', 'Map mAP', false], ['params', 'Auxiliary parameters (M)', true]],
    rows: [
      { label: 'No pretraining', l2: 0.662, col: 0.513, ade: 0.905, nds: 0.338, map: 0.419, params: 0.00 },
      { label: 'Detection', l2: 0.515, col: 0.240, ade: 0.798, nds: 0.365, map: 0.406, params: 3.01 },
      { label: 'Map', l2: 0.694, col: 0.333, ade: 0.857, nds: 0.331, map: 0.391, params: 2.91 },
      { label: 'Occupancy', l2: 0.646, col: 0.320, ade: 0.905, nds: 0.336, map: 0.393, params: 3.56 },
      { label: 'Detection + Map', l2: 0.504, col: 0.190, ade: 0.805, nds: 0.361, map: 0.397, params: 5.92 },
      { label: 'Det. + Map + Occ.', l2: 0.577, col: 0.270, ade: 0.798, nds: 0.356, map: 0.420, params: 9.49 },
      { label: 'Sparse actions, 10K', ours: true, l2: 0.603, col: 0.187, ade: 0.803, nds: 0.397, map: 0.439, params: 0.01 },
      { label: 'Sparse actions, 30K', l2: 0.514, col: 0.320, ade: 0.800, nds: 0.383, map: 0.447, params: 0.03 },
      { label: 'Sparse actions, 90K', l2: 0.596, col: 0.220, ade: 0.782, nds: 0.397, map: 0.433, params: 0.09 }
    ]
  },
  components: {
    metrics: [['col', 'Collision (%)', true], ['l2', 'Planning L2 (m)', true],
              ['ade', 'Motion ADE (m)', true], ['fde', 'Motion FDE (m)', true],
              ['mr', 'Motion MR', true], ['nds', 'Detection NDS', false], ['map', 'Map mAP', false]],
    rows: [
      { label: 'Neither', l2: 0.662, col: 0.513, ade: 0.905, fde: 1.250, mr: 0.135, nds: 0.338, map: 0.419 },
      { label: 'Mask only', l2: 0.655, col: 0.520, ade: 0.808, fde: 1.084, mr: 0.115, nds: 0.396, map: 0.443 },
      { label: 'Action state only', l2: 0.705, col: 0.550, ade: 0.797, fde: 1.080, mr: 0.123, nds: 0.388, map: 0.445 },
      { label: 'Both, PAVER', ours: true, l2: 0.603, col: 0.187, ade: 0.803, fde: 1.086, mr: 0.121, nds: 0.397, map: 0.439 }
    ]
  }
};

function chartRows(host, setKey, metricKey) {
  const set = ROWSETS[setKey];
  const meta = set.metrics.find(m => m[0] === metricKey) || set.metrics[0];
  const [key, label, lower] = meta;
  const rows = set.rows;
  const W = 760, L = 210, R = 132, T = 30, B = 58;
  const rh = 32, H = T + rows.length * rh + B;
  const svg = frame(host, W, H, `${label} for each configuration, read against the baseline`);
  const max = Math.max(...rows.map(r => r[key])) * 1.16 || 1;
  const x = v => L + (W - L - R) * (v / max);
  const plot = W - L - R;

  /* every row is measured against the baseline of its own architecture, so a
   * VAD-Base configuration is never compared against a VAD-Tiny number */
  const famOf = r => r.fam || 'all';
  const refOf = new Map();
  rows.forEach(r => { if (!refOf.has(famOf(r))) refOf.set(famOf(r), r); });
  const refFor = r => refOf.get(famOf(r));
  const fams = [...refOf.keys()];
  const best = rows.reduce((a, b) => (lower ? b[key] < a[key] : b[key] > a[key]) ? b : a);
  const decimals = max < 1 ? 3 : 2;

  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4;
    el('line', { x1: x(v), x2: x(v), y1: T - 8, y2: H - B + 4, class: 'grid' }, svg);
    el('text', { x: x(v), y: H - B + 26, class: 'tick mid', text: fmt(v, max < 1 ? 2 : (max < 20 ? 1 : 0)) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid',
    text: label + (lower ? ' ↓' : ' ↑') }, svg);
  el('text', { x: W - R + 12, y: T - 10, class: 'hint start', text: 'vs baseline' }, svg);

  /* each reference is a line spanning only the rows it governs, so a chart with
   * several architectures shows several baselines without ambiguity */
  fams.forEach((f, fi) => {
    const idx = rows.map((r, i) => [r, i]).filter(([r]) => famOf(r) === f).map(([, i]) => i);
    const top = T + idx[0] * rh, bot = T + (idx[idx.length - 1] + 1) * rh;
    const rx = x(refOf.get(f)[key]);
    el('line', { x1: rx, x2: rx, y1: fi === 0 ? T - 8 : top + 2,
      y2: fi === fams.length - 1 ? H - B + 4 : bot - 2, class: 'ref' }, svg);
    /* a divider makes the block boundary explicit */
    if (fi > 0) el('line', { x1: L - 200, x2: W - R + 84, y1: top, y2: top, class: 'blockrule' }, svg);
  });
  /* the label sits above the first block's line; the gutter header is right of it */
  const ref0 = refOf.get(fams[0]);
  const refRight = x(ref0[key]) > (L + W - R) / 2;
  el('text', { x: x(ref0[key]) + (refRight ? -8 : 8), y: T - 10,
    class: 'reflab ' + (refRight ? 'end' : 'start'),
    text: 'baseline' }, svg);

  rows.forEach((r, i) => {
    const y = T + i * rh;
    const ref = refFor(r);
    const isRef = r === ref;
    const isBest = r === best && !isRef;
    const g = el('g', { class: 'bar' + (r.ours ? ' ours' : '') + (isBest ? ' best' : '') }, svg);

    /* the winner is marked by weight and a leading tick, not by a floating word */
    if (isBest) el('path', { d: `M${L - 202},${y + rh / 2 - 4} l4,4 l-4,4`, class: 'bestmark' }, g);
    el('text', { x: L - 16, y: y + rh / 2 + 4,
      class: 'tick end' + (isBest ? ' beststrong' : ''), text: r.label }, g);

    const w = Math.max(2, x(r[key]) - L);
    const rect = el('rect', { x: L, y: y + 6, width: w, height: rh - 14, rx: 6, class: 'fill' }, g);
    rect.style.setProperty('--w', w + 'px');
    /* a long bar would push its value into the delta gutter, so it carries it inside */
    if (w > plot * 0.84) {
      el('text', { x: L + w - 10, y: y + rh / 2 + 4, class: 'val end inbar', text: fmt(r[key], decimals) }, g);
    } else {
      el('text', { x: L + w + 10, y: y + rh / 2 + 4, class: 'val start', text: fmt(r[key], decimals) }, g);
    }

    /* delta against the reference, informative on every row rather than only the winner */
    if (!isRef) {
      const raw = r[key] - ref[key];
      const rel = ref[key] === 0 ? null : raw / ref[key] * 100;
      const better = lower ? raw < 0 : raw > 0;
      const txt = rel === null
        ? (raw > 0 ? '+' : '') + fmt(raw, decimals)
        : (rel > 0 ? '+' : '') + fmt(rel, 0) + '%';
      el('text', { x: W - R + 12, y: y + rh / 2 + 4,
        class: 'delta start ' + (better ? 'up' : 'down'), text: txt }, g);
    } else {
      el('text', { x: W - R + 12, y: y + rh / 2 + 4, class: 'delta start flat', text: '—' }, g);
    }

    const others = set.metrics.filter(m => m[0] !== key)
      .map(m => `${m[1]}: ${fmt(r[m[0]], 3)}`).join('<br>');
    hoverable(g, `<b>${r.label}</b><br>${label}: ${fmt(r[key], 3)}` +
      (isRef ? `<br><i>the ${famOf(r) === 'all' ? '' : famOf(r) + ' '}baseline</i>`
             : `<br>${fmt(r[key] - ref[key], 3)} against ${famOf(r) === 'all' ? 'the baseline' : famOf(r)}`) +
      `<br><i>${others}</i>`);
  });
  animate(svg);
}

Object.assign(window.PAVER_CHARTS, { chartRows, ROWSETS });

/* ── 23. closed-loop route timelines and behaviour traces ─────────────── */
const POLICY_COLOR = {
  'UniAD-Tiny': 'var(--fg-3)',
  'UniAD-Tiny + PAVER': 'var(--paver)',
  'GenAD + PAVER': 'var(--accent-3)'
};
const EVENT_TONE = { blocked: 'var(--warn)', timeout: 'var(--warn)', collision: 'var(--bad)' };
const eventTone = kind => EVENT_TONE[kind] || 'var(--accent-2)';

function chartRouteTimeline(host, routeId) {
  const d = DATA(); if (!d || !d.closedloop) return;
  const route = d.closedloop[routeId]; if (!route) return;
  /* several runs have no reconstructed ego track, so they cannot be drawn */
  const policies = Object.keys(route.policies)
    .filter(p => (route.policies[p].completion || []).length > 1);
  const missing = Object.keys(route.policies)
    .filter(p => !(route.policies[p].completion || []).length);
  if (!policies.length) {
    const empty = frame(host, 720, 140, 'No reconstructed ego track for this route');
    el('text', { x: 360, y: 76, class: 'axis mid',
      text: 'No reconstructed ego track for this route' }, empty);
    return;
  }
  const W = 780, H = 380, L = 76, R = 196, T = 22, B = 58;
  const svg = frame(host, W, H,
    `Route completion over simulated time on route ${routeId}, one line per policy`);
  const tmax = Math.max(...policies.flatMap(p => route.policies[p].completion.map(c => c[0]))) * 1.02;
  const X = t => L + (W - L - R) * t / tmax;
  const Y = v => (H - B) - (H - B - T) * v / 100;

  for (let v = 0; v <= 100; v += 25) {
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: v + '%' }, svg);
  }
  const step = tmax > 150 ? 50 : (tmax > 60 ? 20 : 10);
  for (let t = 0; t <= tmax; t += step) {
    el('line', { x1: X(t), x2: X(t), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: X(t), y: H - B + 26, class: 'tick mid', text: String(t) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid', text: 'Simulated time (s)' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid',
    transform: `rotate(-90 13 ${(T + H - B) / 2})`, text: 'Route completion ↑' }, svg);
  el('line', { x1: L, x2: W - R, y1: Y(100), y2: Y(100), class: 'ref' }, svg);

  policies.forEach((p, i) => {
    const r = route.policies[p];
    const path = r.completion.map((c, k) => `${k ? 'L' : 'M'}${X(c[0])},${Y(c[1])}`).join(' ');
    const line = el('path', { d: path, fill: 'none', class: 'series' }, svg);
    line.setAttribute('stroke', POLICY_COLOR[p] || 'var(--fg-3)');
    line.setAttribute('stroke-width', p.includes('PAVER') ? 2.6 : 1.8);
    line.style.setProperty('--len', line.getTotalLength ? line.getTotalLength() : 700);
    r.events.forEach(ev => {
      const g = el('g', { class: 'pt' }, svg);
      const c = el('circle', { cx: X(ev.t), cy: Y(ev.c), r: 6, class: 'dot' }, g);
      c.setAttribute('fill', eventTone(ev.kind));
      hoverable(g, `<b>${p}</b><br>${ev.detail}<br>at ${fmt(ev.t, 1)} s, ${fmt(ev.c, 1)}% complete`);
    });
    const end = r.completion[r.completion.length - 1];
    const g = el('g', { class: 'pt' + (p.includes('PAVER') ? ' ours' : '') }, svg);
    const dot = el('circle', { cx: X(end[0]), cy: Y(end[1]), r: 4.5, class: 'dot' }, g);
    dot.setAttribute('fill', POLICY_COLOR[p] || 'var(--fg-3)');
    hoverable(g, `<b>${p}</b><br>${r.status}<br>Driving Score ${fmt(r.ds, 2)} · Route Completion ${fmt(r.rc, 2)}` +
      `<br>${fmt(r.dur, 1)} s of simulated time over ${fmt(r.len, 1)} m`);
    el('rect', { x: W - R + 8, y: T + 6 + i * 20 - 7, width: 18, height: 3, rx: 1.5,
      fill: POLICY_COLOR[p] || 'var(--fg-3)' }, svg);
    el('text', { x: W - R + 31, y: T + 6 + i * 20 - 1, class: 'hint start',
      text: fitText(p.replace('UniAD-Tiny', 'UniAD-T'), R - 39, 12.5) }, svg);
  });
  el('text', { x: W - R + 8, y: T + 6 + policies.length * 20 + 14, class: 'hint start',
    text: fitText(`route ${routeId}`, R - 16, 12.5) }, svg);
  el('text', { x: W - R + 8, y: T + 6 + policies.length * 20 + 32, class: 'hint start',
    text: fitText(route.scenario, R - 16, 12.5) }, svg);
  missing.forEach((p, i) => el('text', { x: W - R + 8, y: T + 6 + policies.length * 20 + 54 + i * 17,
    class: 'hint start', text: fitText('no track: ' + p.replace('UniAD-Tiny', 'UniAD-T'), R - 16, 12.5),
    opacity: 0.7 }, svg));
  animate(svg);
}

function chartRouteTrace(host, routeId, channel) {
  const d = DATA(); if (!d || !d.closedloop) return;
  const route = d.closedloop[routeId]; if (!route) return;
  const policies = Object.keys(route.policies)
    .filter(p => (route.policies[p][channel === 'brake' ? 'brake' : 'speed'] || []).length > 1);
  const key = channel === 'brake' ? 'brake' : 'speed';
  const W = 720, H = 330, L = 76, R = 168, T = 22, B = 58;
  const svg = frame(host, W, H, `${key} over simulated time on route ${routeId}`);
  const rows = policies.flatMap(p => route.policies[p][key]);
  const tmax = Math.max(...rows.map(r => r[0])) * 1.02;
  const vmax = Math.max(...rows.map(r => r[1])) * 1.12 || 1;
  const X = t => L + (W - L - R) * t / tmax;
  const Y = v => (H - B) - (H - B - T) * v / vmax;

  for (let i = 0; i <= 4; i++) {
    const v = vmax * i / 4;
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, vmax < 2 ? 2 : 1) }, svg);
  }
  const step = tmax > 150 ? 50 : (tmax > 60 ? 20 : 10);
  for (let t = 0; t <= tmax; t += step) {
    el('line', { x1: X(t), x2: X(t), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: X(t), y: H - B + 26, class: 'tick mid', text: String(t) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid', text: 'Simulated time (s)' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid',
    transform: `rotate(-90 13 ${(T + H - B) / 2})`,
    text: key === 'brake' ? 'Brake command' : 'Speed (m/s)' }, svg);

  policies.forEach((p, i) => {
    const r = route.policies[p];
    const path = r[key].map((c, k) => `${k ? 'L' : 'M'}${X(c[0])},${Y(c[1])}`).join(' ');
    const line = el('path', { d: path, fill: 'none', class: 'series' }, svg);
    line.setAttribute('stroke', POLICY_COLOR[p] || 'var(--fg-3)');
    line.setAttribute('stroke-width', p.includes('PAVER') ? 2.2 : 1.6);
    line.setAttribute('opacity', 0.92);
    line.style.setProperty('--len', line.getTotalLength ? line.getTotalLength() : 700);
    r.events.forEach(ev => {
      el('line', { x1: X(ev.t), x2: X(ev.t), y1: T, y2: H - B, stroke: eventTone(ev.kind),
        'stroke-width': 1.4, 'stroke-dasharray': '4 3', opacity: 0.75 }, svg);
    });
    const mean = r[key].reduce((a, c) => a + c[1], 0) / r[key].length;
    el('rect', { x: W - R + 8, y: T + 6 + i * 20 - 7, width: 18, height: 3, rx: 1.5,
      fill: POLICY_COLOR[p] || 'var(--fg-3)' }, svg);
    el('text', { x: W - R + 31, y: T + 6 + i * 20 - 1, class: 'hint start',
      text: fitText(`${p.replace('UniAD-Tiny', 'UniAD-T')} · ${fmt(mean, 2)}`, R - 39, 12.5) }, svg);
  });
  el('text', { x: W - R + 8, y: T + 6 + policies.length * 20 + 12, class: 'hint start',
    text: fitText('dashed: event', R - 16, 12.5) }, svg);
  animate(svg);
}

Object.assign(window.PAVER_CHARTS, { chartRouteTimeline, chartRouteTrace });

/* ── 24. parameter drift during downstream training ───────────────────── */
function chartDrift(host){
  const d = DATA(); if (!d || !d.drift) return;
  const comps = Array.from(new Set(d.drift.map(r => r.comp)));
  const W = 720, H = 380, L = 76, R = 176, T = 22, B = 62;
  const svg = frame(host, W, H, 'Relative parameter change of each component across downstream epochs');
  const epochs = Array.from(new Set(d.drift.map(r => r.epoch))).sort((a, b) => a - b);
  const vmax = Math.max(...d.drift.map(r => r.rel)) * 1.08;
  const X = e => L + (W - L - R) * (e - epochs[0]) / ((epochs[epochs.length - 1] - epochs[0]) || 1);
  const Y = v => (H - B) - (H - B - T) * v / vmax;
  for (let i = 0; i <= 4; i++) {
    const v = vmax * i / 4;
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, 2) }, svg);
  }
  for (let e = epochs[0]; e <= epochs[epochs.length - 1]; e += 5) {
    el('line', { x1: X(e), x2: X(e), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: X(e), y: H - B + 26, class: 'tick mid', text: String(e) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid', text: 'Downstream epoch' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid',
    transform: `rotate(-90 13 ${(T + H - B) / 2})`, text: 'Relative L2 parameter change' }, svg);
  comps.forEach((c, i) => {
    const series = d.drift.filter(r => r.comp === c).sort((a, b) => a.epoch - b.epoch);
    const transferred = /bev|encoder|ego/i.test(c);
    const colour = transferred ? 'var(--paver)' : seriesStroke(i, false);
    const line = el('path', {
      d: series.map((r, k) => `${k ? 'L' : 'M'}${X(r.epoch)},${Y(r.rel)}`).join(' '),
      fill: 'none', class: 'series'
    }, svg);
    line.setAttribute('stroke', colour);
    line.setAttribute('stroke-width', transferred ? 3 : 1.6);
    line.setAttribute('opacity', transferred ? 1 : 0.6);
    line.style.setProperty('--len', line.getTotalLength ? line.getTotalLength() : 600);
    const last = series[series.length - 1];
    const g = el('g', { class: 'pt' + (transferred ? ' ours' : '') }, svg);
    const dot = el('circle', { cx: X(last.epoch), cy: Y(last.rel), r: transferred ? 6 : 4, class: 'dot' }, g);
    dot.setAttribute('fill', colour);
    hoverable(g, `<b>${c.replace(/_/g, ' ')}</b><br>epoch ${last.epoch}<br>` +
      `relative change ${fmt(last.rel, 4)}<br>cosine to the pretrained weights ${fmt(last.cos, 5)}`);
    el('rect', { x: W - R + 8, y: T + 6 + i * 18 - 7, width: 18, height: transferred ? 5 : 3, rx: 2, fill: colour }, svg);
    el('text', { x: W - R + 31, y: T + 6 + i * 18 - 1, class: 'hint start',
      text: fitText(c.replace(/_/g, ' '), R - 39, 12.5), 'font-weight': transferred ? 700 : 400 }, svg);
  });
  animate(svg);
}

/* ── 25. mask-token trajectory during pretraining ─────────────────────── */
function chartMask(host){
  const d = DATA(); if (!d || !d.mask) return;
  const rows = d.mask;
  const W = 720, H = 360, L = 76, R = 168, T = 22, B = 62;
  const svg = frame(host, W, H, 'Mask-token norm, direction and readout probabilities across pretraining epochs');
  const emax = rows[rows.length - 1].epoch;
  const X = e => L + (W - L - R) * e / (emax || 1);
  const series = [
    ['norm', 'mask-token norm', 'var(--paver)', r => r.norm],
    ['risk', 'mask-only risk probability', 'var(--accent-3)', r => r.risk],
    ['unk', 'mask-only unknown probability', 'var(--accent-2)', r => r.unk]
  ];
  const vmax = Math.max(...rows.flatMap(r => series.map(s => s[3](r)))) * 1.1 || 1;
  const Y = v => (H - B) - (H - B - T) * v / vmax;
  for (let i = 0; i <= 4; i++) {
    const v = vmax * i / 4;
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, 2) }, svg);
  }
  for (let e = 0; e <= emax; e += 5) {
    el('line', { x1: X(e), x2: X(e), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: X(e), y: H - B + 26, class: 'tick mid', text: String(e) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid', text: 'Pretraining epoch' }, svg);
  series.forEach(([key, label, colour, get], i) => {
    const line = el('path', {
      d: rows.map((r, k) => `${k ? 'L' : 'M'}${X(r.epoch)},${Y(get(r))}`).join(' '), fill: 'none', class: 'series'
    }, svg);
    line.setAttribute('stroke', colour);
    line.setAttribute('stroke-width', i ? 1.8 : 3);
    line.style.setProperty('--len', line.getTotalLength ? line.getTotalLength() : 500);
    rows.forEach(r => {
      const g = el('g', { class: 'pt' + (i ? '' : ' ours') }, svg);
      const c = el('circle', { cx: X(r.epoch), cy: Y(get(r)), r: i ? 3 : 4.5, class: 'dot' }, g);
      c.setAttribute('fill', colour);
      hoverable(g, `<b>${label}</b><br>epoch ${r.epoch}: ${fmt(get(r), 4)}<br>` +
        `<i>cosine to the initial token ${fmt(r.cos, 3)} · projector effective rank ${fmt(r.rank, 1)}</i>`);
    });
    el('rect', { x: W - R + 8, y: T + 6 + i * 18 - 7, width: 18, height: i ? 3 : 5, rx: 2, fill: colour }, svg);
    el('text', { x: W - R + 31, y: T + 6 + i * 18 - 1, class: 'hint start',
      text: fitText(label, R - 39, 12.5) }, svg);
  });
  animate(svg);
}

/* ── 26. checkpoint selection rules ───────────────────────────────────── */

/* ── 27. pretraining-proxy shortcut audit ─────────────────────────────── */
function chartShortcut(host){
  const d = DATA(); if (!d || !d.shortcutRank) return;
  const rows = d.shortcutRank.filter(r => r.outcome && r.predictor);
  const outcomes = Array.from(new Set(rows.map(r => r.outcome)));
  const preds = Array.from(new Set(rows.map(r => r.predictor)));
  const cell = 44, L = 232, T = 168, R = 24, B = 24;
  const W = L + outcomes.length * cell + R, H = T + preds.length * cell + B;
  const svg = frame(host, W, H, 'Rank correlation between each pretraining proxy and each downstream outcome');
  preds.forEach((p, i) => el('text', { x: L - 16, y: T + i * cell + cell / 2 + 4, class: 'tick end',
    text: p.replace(/_/g, ' ') }, svg));
  outcomes.forEach((o, j) => {
    const cx = L + j * cell + cell / 2;
    el('text', { x: cx, y: T - 10, class: 'tick start',
      transform: `rotate(-45 ${cx} ${T - 10})`, text: o.replace(/_/g, ' ') }, svg);
  });
  rows.forEach(r => {
    const i = preds.indexOf(r.predictor), j = outcomes.indexOf(r.outcome);
    const rho = Number(r.spearman_rho);
    const g = el('g', { class: 'pt' }, svg);
    el('rect', { x: L + j * cell + 2, y: T + i * cell + 2, width: cell - 4, height: cell - 4, rx: 6,
      fill: rho >= 0 ? 'var(--paver)' : 'var(--accent-2)', opacity: 0.12 + 0.78 * Math.abs(rho) }, g);
    el('text', { x: L + j * cell + cell / 2, y: T + i * cell + cell / 2 + 4, class: 'val mid',
      text: fmt(rho, 2).replace('0.', '.') }, g);
    hoverable(g, `<b>${r.predictor.replace(/_/g, ' ')}</b> vs <b>${r.outcome.replace(/_/g, ' ')}</b><br>` +
      `Spearman &rho; ${fmt(rho, 3)}<br>exact two-sided p ${fmt(Number(r.exact_two_sided_p), 3)}<br>` +
      `<i>leave-one-out ${fmt(Number(r.loo_min_rho), 2)} to ${fmt(Number(r.loo_max_rho), 2)}, ` +
      `sign ${r.loo_sign_consistent === 'True' ? 'stable' : 'flips'}</i>`);
  });
  animate(svg);
}

Object.assign(window.PAVER_CHARTS, { chartDrift, chartMask, chartShortcut });

/* ── 28. per-task loss and encoder gradient ───────────────────────────── */
function chartTaskGrad(host, channel){
  const d = DATA(); if (!d || !d.taskgrad) return;
  const key = channel === 'grad' ? 'grad' : 'loss';
  const tasks = Array.from(new Set(d.taskgrad.map(r => r.task)));
  const W = 760, H = 380, L = 76, R = 168, T = 26, B = 70;
  const svg = frame(host, W, H, `Per-task ${key === 'grad' ? 'encoder gradient' : 'loss'} across downstream epochs`);
  const epochs = d.taskgrad.map(r => r.epoch);
  const e0 = Math.min(...epochs), e1 = Math.max(...epochs);
  const vmax = Math.max(...d.taskgrad.map(r => r[key])) * 1.08;
  const X = e => L + (W - L - R) * (e - e0) / ((e1 - e0) || 1);
  const Y = v => (H - B) - (H - B - T) * v / vmax;
  for (let i = 0; i <= 4; i++) {
    const v = vmax * i / 4;
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v, vmax < 5 ? 2 : 0) }, svg);
  }
  for (let e = e0; e <= e1; e += 5) {
    el('line', { x1: X(e), x2: X(e), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: X(e), y: H - B + 26, class: 'tick mid', text: String(e) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid', text: 'Downstream epoch' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`,
    text: key === 'grad' ? 'RMS gradient on the transferred encoder' : 'Mean task loss' }, svg);
  tasks.forEach((t, i) => {
    const series = d.taskgrad.filter(r => r.task === t).sort((a, b) => a.epoch - b.epoch);
    const colour = t === 'planning' ? 'var(--paver)' : seriesStroke(i, false);
    const line = el('path', { d: series.map((r, k) => `${k ? 'L' : 'M'}${X(r.epoch)},${Y(r[key])}`).join(' '),
      fill: 'none', class: 'series' }, svg);
    line.setAttribute('stroke', colour);
    line.setAttribute('stroke-width', t === 'planning' ? 3 : 1.8);
    line.setAttribute('opacity', t === 'planning' ? 1 : 0.65);
    line.style.setProperty('--len', line.getTotalLength ? line.getTotalLength() : 600);
    const hit = el('path', { d: line.getAttribute('d'), fill: 'none', stroke: 'transparent', 'stroke-width': 12 }, svg);
    const dec = (d.decay || []).find(x => x.task === t);
    hoverable(hit, `<b>${t}</b><br>loss ${fmt(series[0].loss, 2)} → ${fmt(series[series.length - 1].loss, 2)}` +
      (dec ? `<br>${fmt(dec.per10, 3)} per 10 epochs, 95% CI [${fmt(dec.lo, 3)}, ${fmt(dec.hi, 3)}]` : ''));
    el('rect', { x: W - R + 8, y: T + 6 + i * 20 - 7, width: 18, height: t === 'planning' ? 5 : 3, rx: 2, fill: colour }, svg);
    el('text', { x: W - R + 31, y: T + 6 + i * 20 - 1, class: 'hint start', text: t,
      'font-weight': t === 'planning' ? 700 : 400 }, svg);
  });
  animate(svg);
}

/* ── 29. gradient energy by component ─────────────────────────────────── */
function chartGradEnergy(host){
  const d = DATA(); if (!d || !d.gradenergy) return;
  const tasks = Array.from(new Set(d.gradenergy.map(r => r.task)));
  const comps = Array.from(new Set(d.gradenergy.map(r => r.comp)));
  const W = 760, L = 132, R = 30, T = 44, B = 52;
  const rh = 38, H = T + tasks.length * rh + B;
  const svg = frame(host, W, H, 'Share of each task gradient energy landing in each parameter group');
  const X = v => L + (W - L - R) * v;
  for (let v = 0; v <= 1.001; v += 0.25) {
    el('line', { x1: X(v), x2: X(v), y1: T - 10, y2: H - B + 4, class: 'grid' }, svg);
    el('text', { x: X(v), y: H - B + 26, class: 'tick mid', text: Math.round(v * 100) + '%' }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid', text: 'Share of the task gradient energy' }, svg);
  const tone = c => /bev|ego|query|position/i.test(c) ? 'var(--paver)'
    : (/image|neck|backbone/i.test(c) ? 'var(--fg-3)' : 'var(--accent-2)');
  tasks.forEach((t, i) => {
    const y = T + i * rh;
    el('text', { x: L - 14, y: y + rh / 2 + 4, class: 'tick end', text: t }, svg);
    let acc = 0;
    comps.forEach(cmp => {
      const r = d.gradenergy.find(z => z.task === t && z.comp === cmp);
      if (!r || r.share <= 0) return;
      const g = el('g', { class: 'bar' }, svg);
      const w = X(acc + r.share) - X(acc);
      const rect = el('rect', { x: X(acc), y: y + 6, width: w, height: rh - 16, rx: 4,
        fill: tint(tone(cmp), /bev|ego|query|position/i.test(cmp) ? 95 : 50) }, g);
      rect.style.setProperty('--w', w + 'px');
      hoverable(g, `<b>${t}</b><br>${cmp.replace(/_/g, ' ')}: ${fmt(r.share * 100, 1)}% of the gradient energy`);
      if (w > 46) el('text', { x: X(acc) + w / 2, y: y + rh / 2 + 4, class: 'val mid',
        text: fmt(r.share * 100, 0) + '%' }, g);
      acc += r.share;
    });
  });
  [['BEV encoder and queries', 'var(--paver)', 95], ['image backbone and neck', 'var(--fg-3)', 50],
   ['other transferred', 'var(--accent-2)', 60]].forEach(([lab, col, op], i) => {
    el('rect', { x: L + i * 220, y: 14, width: 11, height: 11, rx: 2, fill: tint(col, op) }, svg);
    el('text', { x: L + i * 220 + 18, y: 24, class: 'hint start', text: lab }, svg);
  });
  animate(svg);
}

/* ── 30. corridor coverage of the sampled action set ──────────────────── */
function chartCoverage(host){
  const d = DATA(); if (!d || !d.coverage) return;
  /* the calibration groups are replicates, so they are averaged rather than
     overplotted, which previously produced thousands of colliding tick labels */
  const byDraw = new Map();
  d.coverage.forEach(r => {
    const e = byDraw.get(r.draws) || { draws: r.draws, corridor: 0, endpoint: 0, n: 0 };
    e.corridor += r.corridor; e.endpoint += r.endpoint; e.n += 1;
    byDraw.set(r.draws, e);
  });
  const series = Array.from(byDraw.values())
    .map(e => ({ draws: e.draws, corridor: e.corridor / e.n, endpoint: e.endpoint / e.n }))
    .sort((a, b) => a.draws - b.draws);
  const W = 720, H = 350, L = 76, R = 156, T = 26, B = 66;
  const svg = frame(host, W, H, 'Fraction of the BEV plane covered as more candidate actions are drawn');
  const dmax = Math.max(...series.map(r => r.draws));
  const vmax = Math.max(...series.map(r => r.corridor)) * 1.1;
  const X = n => L + (W - L - R) * (n - 1) / ((dmax - 1) || 1);
  const Y = v => (H - B) - (H - B - T) * v / vmax;
  for (let i = 0; i <= 4; i++) {
    const v = vmax * i / 4;
    el('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }, svg);
    el('text', { x: L - 14, y: Y(v) + 4, class: 'tick end', text: fmt(v * 100, 1) + '%' }, svg);
  }
  const tickStep = Math.max(1, Math.ceil(dmax / 8));
  for (let n = 1; n <= dmax; n += tickStep) {
    el('line', { x1: X(n), x2: X(n), y1: T, y2: H - B, class: 'grid' }, svg);
    el('text', { x: X(n), y: H - B + 26, class: 'tick mid', text: String(n) }, svg);
  }
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid', text: 'Candidate draws' }, svg);
  el('text', { x: 13, y: (T + H - B) / 2, class: 'axis mid', transform: `rotate(-90 13 ${(T + H - B) / 2})`,
    text: 'Fraction of the BEV plane' }, svg);
  [['corridor', 'corridor cells', 'var(--paver)', 3],
   ['endpoint', 'measured endpoints', 'var(--accent-3)', 2]].forEach(([key, lab, col, wdt], i) => {
    const line = el('path', { d: series.map((r, k) => `${k ? 'L' : 'M'}${X(r.draws)},${Y(r[key])}`).join(' '),
      fill: 'none', class: 'series' }, svg);
    line.setAttribute('stroke', col);
    line.setAttribute('stroke-width', wdt);
    line.style.setProperty('--len', line.getTotalLength ? line.getTotalLength() : 500);
    series.forEach(r => {
      const g = el('g', { class: 'pt' }, svg);
      const c = el('circle', { cx: X(r.draws), cy: Y(r[key]), r: 3.5, class: 'dot' }, g);
      c.setAttribute('fill', col);
      hoverable(g, `<b>${lab}</b><br>${r.draws} draw${r.draws > 1 ? 's' : ''}: ` +
        `${fmt(r[key] * 100, 2)}% of the plane, averaged over the calibration groups`);
    });
    el('rect', { x: W - R + 8, y: T + 6 + i * 20 - 7, width: 18, height: 3, rx: 2, fill: col }, svg);
    el('text', { x: W - R + 31, y: T + 6 + i * 20 - 1, class: 'hint start',
      text: fitText(lab, R - 39, 12.5) }, svg);
  });
  animate(svg);
}

/* ── 31. do the task gains move together ──────────────────────────────── */
function chartCoupling(host){
  const d = DATA(); if (!d || !d.coupling) return;
  const rows = d.coupling;
  const W = 720, L = 268, R = 60, T = 30, B = 56;
  const rh = 40, H = T + rows.length * rh + B;
  const svg = frame(host, W, H, 'Correlation between per-epoch task improvements');
  const lim = 1;
  const X = v => L + (W - L - R) * (v + lim) / (2 * lim);
  for (let i = 0; i <= 4; i++) {
    const v = -lim + 2 * lim * i / 4;
    el('line', { x1: X(v), x2: X(v), y1: T - 10, y2: H - B + 4, class: 'grid' }, svg);
    el('text', { x: X(v), y: H - B + 26, class: 'tick mid', text: fmt(v, 1) }, svg);
  }
  el('line', { x1: X(0), x2: X(0), y1: T - 10, y2: H - B + 4, class: 'ref' }, svg);
  el('text', { x: (L + W - R) / 2, y: H - 10, class: 'axis mid',
    text: 'Correlation of per-epoch changes' }, svg);
  rows.forEach((r, i) => {
    const y = T + i * rh + rh / 2;
    el('text', { x: L - 14, y: y + 4, class: 'tick end',
      text: r.pair.replace(/_delta_vs_/g, ' vs ').replace(/_delta/g, '').replace(/_/g, ' ') }, svg);
    [['pearson', 'var(--paver)', 5.5], ['spearman', 'var(--accent-2)', 4]].forEach(([k, col, rad]) => {
      const g = el('g', { class: 'pt' }, svg);
      const c = el('circle', { cx: X(r[k]), cy: y, r: rad, class: 'dot' }, g);
      c.setAttribute('fill', col);
      hoverable(g, `<b>${r.pair.replace(/_/g, ' ')}</b><br>${k} ${fmt(r[k], 3)}` +
        `<br><i>near zero means the two tasks improve independently rather than trading off</i>`);
    });
  });
  [['Pearson', 'var(--paver)'], ['Spearman', 'var(--accent-2)']].forEach(([lab, col], i) => {
    el('circle', { cx: L + i * 110 + 6, cy: 18, r: 5, fill: col }, svg);
    el('text', { x: L + i * 110 + 18, y: 22, class: 'hint start', text: lab }, svg);
  });
  animate(svg);
}

Object.assign(window.PAVER_CHARTS, { chartTaskGrad, chartGradEnergy, chartCoverage, chartCoupling });
