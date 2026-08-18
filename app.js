/* ============================================================================
   PAVER project page — behaviour. No dependencies.
   ========================================================================== */
'use strict';

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const root = document.documentElement;
/* Restored before the query string is parsed: doing it on DOMContentLoaded was
   too late, because every switch had already read its value. */
(function restoreState() {
  if (location.search) return;                 /* an explicit link always wins */
  try {
    const saved = localStorage.getItem('paver-state');
    if (saved) history.replaceState(null, '', location.pathname + '?' + saved + location.hash);
  } catch (e) {}
})();
const params = new URL(location.href).searchParams;
/* Shared links used to read ?as=..&ch=..&cs=..&fc=..&wa=..&wc=.., which tells a
   reader nothing about what was selected. Each switch now writes a readable name
   and still answers to the short one, so links already sent out keep working. */
const PARAM_ALIAS = {
  as: 'action-state', ch: 'channel', cs: 'coverage', fc: 'focus', hz: 'horizon',
  tm: 'target-metric', wa: 'view-arch', wc: 'view-camera', wf: 'view-frame',
  ws: 'view-scene', cap: 'capacity-metric', pm: 'metric', sched: 'schedule',
  supp: 'tables', cm: 'component-metric', mm: 'map-metric', mtm: 'method-metric',
  sm: 'strategy-metric'
};
/* the first value a switch asks for is its default, and a default never needs
   to appear in a shared link */
const PARAM_DEFAULT = {};
const getParam = (k, d) => {
  if (PARAM_DEFAULT[k] === undefined) PARAM_DEFAULT[k] = d;
  return params.get(PARAM_ALIAS[k] || k) || params.get(k) || d;
};
/* 33: the theme survived a reload and nothing else did. Selections live in the
   URL so they can be shared; mirroring them locally means returning to the page
   without a link still restores what was being looked at. */
const REMEMBER = 'paver-state';
function saveState() {
  try {
    const u = new URL(location.href);
    localStorage.setItem(REMEMBER, u.searchParams.toString());
  } catch (e) {}
}
function setParam(k, v) {
  const u = new URL(location.href);
  const name = PARAM_ALIAS[k] || k;
  /* a switch left on its default adds nothing to a shared link, and seventeen of
     them turned a clean URL into a wall of text after a few clicks */
  if (PARAM_DEFAULT[k] !== undefined && String(PARAM_DEFAULT[k]) === String(v)) {
    u.searchParams.delete(name);
  } else {
    u.searchParams.set(name, v);
  }
  if (name !== k) u.searchParams.delete(k);      /* never carry both spellings */
  history.replaceState(null, '', u);
  saveState();
}


/* ── theme ────────────────────────────────────────────────────────────── */
(function theme() {
  const btn = $('#theme'), icon = $('#themeIcon');
  function paint() {
    const dark = root.dataset.theme === 'dark';
    /* glyphs for the sun and moon are missing from the bundled face, so the
     * button fell back to whatever the system offered; these always draw */
    const SUN = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2' +
      'M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/></svg>';
    const MOON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/></svg>';
    icon.innerHTML = dark ? MOON : SUN;
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.setAttribute('aria-pressed', String(!dark));
  }
  btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('paver-theme', root.dataset.theme); } catch (e) {}
    paint();
  });
  paint();
})();

/* ── navigation ───────────────────────────────────────────────────────── */
(function nav() {
  const btn = $('#menu'), el = $('#nav');
  btn.addEventListener('click', () => {
    const open = el.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  el.addEventListener('click', e => {
    if (e.target.tagName !== 'A') return;
    el.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
  const links = $$('#nav a');
  const owner = new Map();
  links.forEach(a => (a.dataset.covers || a.hash.slice(1)).split(/\s+/).forEach(id => owner.set(id, a)));
  function mark(link) {
    links.forEach(a => a.setAttribute('aria-current', String(a === link)));
    moveThumb(el);
    requestAnimationFrame(() => moveThumb(el));
  }
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const link = owner.get(e.target.id);
      if (link) mark(link);
    });
  }, { rootMargin: '-25% 0px -65% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));
  addEventListener('resize', () => moveThumb(el));
})();

/* ── chrome: glass blur budget, aurora idling, back to top ────────────── */
const nearObserver = new IntersectionObserver(
  es => es.forEach(e => e.target.classList.toggle('near', e.isIntersecting)),
  { rootMargin: '300px 0px' });
function observeCards(scope) { $$('.card', scope || document).forEach(c => nearObserver.observe(c)); }
observeCards();

(function chrome() {
  const aurora = $('#aurora'), top = $('#top');
  let t = null;
  addEventListener('scroll', () => {
    aurora.classList.add('paused');
    clearTimeout(t);
    t = setTimeout(() => aurora.classList.remove('paused'), 220);
    top.classList.toggle('on', scrollY > 900);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => aurora.classList.toggle('paused', document.hidden));
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* the single card-header component: every card, hand written or generated,
   renders exactly this structure so the type and spacing cannot drift. */
function cardHeader(opts) {
  const head = document.createElement('div');
  head.className = 'chead';
  const titles = document.createElement('div');
  titles.className = 'titles';
  if (opts.kicker) {
    const k = document.createElement('span');
    k.className = 'kicker';
    k.textContent = opts.kicker;
    titles.appendChild(k);
  }
  const h = document.createElement('h3');
  h.textContent = opts.title;
  titles.appendChild(h);
  head.appendChild(titles);
  const actions = document.createElement('div');
  actions.className = 'actions';
  (opts.actions || []).forEach(el => actions.appendChild(el));
  head.appendChild(actions);
  return head;
}

/* ── images: display derivative in the page, original in the viewer ───── */
const DIMS = () => window.PAVER_DIMS || {};
/* a figure that fails to load says so instead of leaving an empty frame */
/* a failure that leaves the pane blank is indistinguishable from a slow load,
 * so it says what happened where the content would have been */
function clearViewerBusy() {
  const st = document.getElementById('wvStage');
  if (st) st.removeAttribute('aria-busy');
}

function showViewerError(message) {
  const stage = document.getElementById('wvStage');
  if (!stage) return;
  stage.removeAttribute('aria-busy');
  stage.innerHTML = `<p class="empty">${message}</p>`;
}

function onImgError(im) {
  im.addEventListener('error', () => {
    im.dataset.failed = '1';
    im.alt = (im.alt || 'figure') + ' — image could not be loaded';
  }, { once: true });
  return im;
}
function img(original, alt, note, pdf) {
  const d = DIMS()[original];
  const el = document.createElement('img');
  el.src = d ? d.d : original;
  if (d) { el.width = d.dw; el.height = d.dh; el.dataset.px = d.w + '×' + d.h; }
  el.loading = 'lazy';
  el.decoding = 'async';
  el.alt = alt || '';
  el.dataset.full = original;
  if (note) el.dataset.note = note;
  if (pdf) el.dataset.pdf = pdf;
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', (alt || 'figure') + ', open viewer');
  el.draggable = false;
  return onImgError(el);
}
function framed(original, alt, note, pdf) {
  const f = document.createElement('div');
  f.className = 'frame';
  const d = DIMS()[original];
  if (d) {
    const glow = document.createElement('img');
    glow.className = 'ambient';
    glow.src = d.d;
    glow.alt = '';
    glow.setAttribute('aria-hidden', 'true');
    glow.loading = 'lazy';
    glow.draggable = false;
    f.appendChild(glow);
  }
  const plate = document.createElement('div');
  plate.className = 'plate';
  plate.appendChild(img(original, alt, note, pdf));
  f.appendChild(plate);
  return f;
}

/* one glass bar per tab group, with a thumb that slides to the selection */
function chipTabs(host, items, onPick) {
  host.classList.remove('chips');
  host.classList.add('segbar');
  host.innerHTML = '';
  const thumb = document.createElement('span');
  thumb.className = 'thumb hidden';
  thumb.setAttribute('aria-hidden', 'true');
  host.appendChild(thumb);
  items.forEach(([key, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', 'false');
    b.tabIndex = -1;
    b.dataset.k = key;
    b.textContent = label;
    const card = host.closest && host.closest('.card');
    const panel = card && card.id && document.getElementById(`${card.id}-${key}`);
    if (panel) {
      b.setAttribute('aria-controls', panel.id);
    } else {
      /* a metric selector redraws one figure rather than swapping panels */
      b.setAttribute('role', 'radio');
      b.removeAttribute('aria-selected');
      b.setAttribute('aria-checked', 'false');
      const live = card && (card.querySelector('[data-live]') ||
                            card.querySelector('.chart-host, .plot, .stack') || card);
      if (live) {
        if (!live.id) live.id = `${(card && card.id) || 'plot'}-view`;
        b.setAttribute('aria-controls', live.id);
      }
    }
    b.addEventListener('click', () => { onPick(key, true); announceSwitch(host, key); });
    host.appendChild(b);
  });
  host.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const tabs = $$('[role="tab"], [role="radio"]', host);
    let i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') i = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'ArrowRight') i = (i + 1) % tabs.length;
    if (e.key === 'Home') i = 0;
    if (e.key === 'End') i = tabs.length - 1;
    tabs[i].focus(); tabs[i].click();
  });
}
function moveThumb(host) {
  const thumb = $('.thumb', host);
  const active = $('[aria-selected="true"], [aria-checked="true"], [aria-current="true"]', host);
  if (!thumb) return;
  if (!active) { thumb.classList.add('hidden'); return; }
  thumb.style.width = active.offsetWidth + 'px';
  thumb.style.height = active.offsetHeight + 'px';
  thumb.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
  thumb.classList.remove('hidden');
}
/* the browser restores the scroll position on its own; the page was letting
 * a hash jump override it on back navigation */
if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

function announce(msg) {
  const live = $('#live');
  if (live) live.textContent = msg;
}
/* 34: a switch that redraws a figure produced no spoken feedback, so a screen
   reader user could not tell that anything had changed. */
function announceSwitch(host, key) {
  const btn = $$('[role="tab"], [role="radio"]', host).find(b => b.dataset.k === key);
  const group = host.getAttribute('aria-label');
  if (btn) announce(`${group ? group + ': ' : ''}${btn.textContent.trim()}`);
}

function markTabs(host, key) {
  const radios = $$('[role="radio"]', host);
  host.setAttribute('role', radios.length ? 'radiogroup' : 'tablist');
  $$('[role="tab"], [role="radio"]', host).forEach(b => {
    const on = b.dataset.k === key;
    b.setAttribute(b.getAttribute('role') === 'radio' ? 'aria-checked' : 'aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  moveThumb(host);
  requestAnimationFrame(() => moveThumb(host));
}
addEventListener('resize', () => $$('.segbar').forEach(moveThumb));

/* 41: an in-page link moved the view and not the focus, so the next Tab went
   back to the top of the document. */
addEventListener('DOMContentLoaded', () => {
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    const t = document.getElementById(a.getAttribute('href').slice(1));
    if (!t) return;
    t.setAttribute('tabindex', '-1');
    setTimeout(() => t.focus({ preventScroll: true }), 0);
  }));
}, { once: true });

/* 40, 43: the nav showed the current section with a thumb and told a screen
   reader nothing; a rule across the top says how far down the page is. */
(function progressAndCurrent() {
  const bar = document.createElement('div');
  bar.className = 'readbar';
  bar.setAttribute('aria-hidden', 'true');
  addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(bar);
    const links = $$('nav#nav a[href^="#"]');
    const paint = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0).toFixed(2) + '%';
      let active = null;
      links.forEach(a => {
        const covers = (a.dataset.covers || a.getAttribute('href').slice(1)).split(/\s+/);
        if (covers.some(id => {
          const s = document.getElementById(id);
          if (!s) return false;
          const b = s.getBoundingClientRect();
          return b.top <= innerHeight * 0.35 && b.bottom > innerHeight * 0.35;
        })) active = a;
      });
      links.forEach(a => {
        if (a === active) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    addEventListener('scroll', paint, { passive: true });
    paint();
  }, { once: true });
})();

/* chart / table switches use the identical component as every other tab group */
function bindSegments(scope) {
  $$('.seg[role="tablist"]', scope || document).forEach(seg => {
    if (seg.dataset.bound) return;
    const items = $$('button[data-pane]', seg).map(b => [b.dataset.pane, b.textContent.trim()]);
    if (!items.length) return;
    const base = (seg.closest('.card') || {}).id || 'panel';
    $$('.pane', seg.closest('.card')).forEach(p => {
      p.setAttribute('role', 'tabpanel');
      p.id = `${base}-${p.dataset.pane}`;
      p.setAttribute('tabindex', '0');
    });
    seg.dataset.bound = '1';
    seg.classList.remove('seg', 'wide');
    const card = seg.closest('.card');
    chipTabs(seg, items, key => {
      $$('.pane', card).forEach(p => { p.hidden = p.dataset.pane !== key; });
      markTabs(seg, key);
      announce(key === 'table' ? 'Showing the table' : 'Showing the chart');
      /* move the reading position to what was just revealed */
      const shown = $$('.pane', card).find(p => !p.hidden);
      if (shown) { shown.setAttribute('tabindex', '-1'); shown.focus({ preventScroll: true }); }
    });
    markTabs(seg, items[0][0]);
  });
}
addEventListener('DOMContentLoaded', () => bindSegments());

/* ── viewer ───────────────────────────────────────────────────────────── */
const viewer = (function () {
  const box = $('#viewer'), stage = $('#vstage'), im = $('#vimg'), note = $('#vnote'), zl = $('#vzoom');
  let zoom = 1, fitZoom = 1, panX = 0, panY = 0, group = [], index = 0, restore = null, drag = null;

  const apply = () => {
    im.style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`;
    zl.textContent = Math.abs(zoom - fitZoom) < 1e-3 ? 'fit' : Math.round(zoom * 100) + '%';
  };
  function fit() {
    const r = stage.getBoundingClientRect();
    const w = im.naturalWidth || 1, h = im.naturalHeight || 1;
    fitZoom = Math.min((r.width - 48) / w, (r.height - 120) / h, 1);
    zoom = fitZoom;
    panX = (r.width - w * zoom) / 2;
    panY = (r.height - h * zoom) / 2;
    apply();
  }
  function setZoom(z, cx, cy) {
    const r = stage.getBoundingClientRect();
    cx = cx == null ? r.width / 2 : cx;
    cy = cy == null ? r.height / 2 : cy;
    const nz = Math.max(fitZoom, Math.min(8, z));
    panX = cx - (cx - panX) * (nz / zoom);
    panY = cy - (cy - panY) * (nz / zoom);
    zoom = nz;
    apply();
  }
  function show(i) {
    if (!group.length) return;
    index = (i + group.length) % group.length;
    const el = group[index];
    if (!el) return;
    im.alt = el.alt || '';
    im.src = el.dataset.full;
    note.innerHTML = [
      el.dataset.note || el.alt || '',
      el.dataset.px ? 'original ' + el.dataset.px : '',
      `<a href="${el.dataset.full}" target="_blank" rel="noopener">open original</a>`,
      el.dataset.pdf ? `<a href="${el.dataset.pdf}" download>save vector PDF</a>` : '',
      group.length > 1 ? `${index + 1} / ${group.length}` : '',
      group.length > 1 ? 'arrow keys to move, Esc to close' : 'Esc to close'
    ].filter(Boolean).join(' &middot; ');
    if (im.complete) fit(); else im.onload = fit;
  }
  function open(el) {
    const scope = el.closest('.frame, .strip, .grid-figure') || document;
    group = $$('img[data-full]', scope);
    if (!group.length) group = [el];
    restore = document.activeElement;
    box.classList.add('open');
    box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    show(group.indexOf(el));
    $('#vclose').focus();
  }
  function close() {
    box.classList.remove('open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    im.src = '';
    if (restore) restore.focus();
  }

  $('#vclose').addEventListener('click', close);
  $('#vin').addEventListener('click', () => setZoom(zoom * 1.4));
  $('#vout').addEventListener('click', () => setZoom(zoom / 1.4));
  $('#vfit').addEventListener('click', fit);
  $('#vprev').addEventListener('click', () => show(index - 1));
  $('#vnext').addEventListener('click', () => show(index + 1));
  stage.addEventListener('click', e => { if (e.target === stage) close(); });
  stage.addEventListener('dblclick', e => setZoom(zoom > fitZoom * 1.01 ? fitZoom : fitZoom * 3, e.offsetX, e.offsetY));
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    setZoom(zoom * (e.deltaY < 0 ? 1.12 : 0.89), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  stage.addEventListener('pointerdown', e => {
    if (e.target !== im) return;
    drag = { x: e.clientX - panX, y: e.clientY - panY };
    stage.classList.add('drag');
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    panX = e.clientX - drag.x;
    panY = e.clientY - drag.y;
    im.style.transition = 'none';
    apply();
  });
  stage.addEventListener('pointerup', () => {
    drag = null;
    stage.classList.remove('drag');
    im.style.transition = '';
  });
  addEventListener('resize', () => { if (box.classList.contains('open')) fit(); });
  document.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') return close();
    if (e.key === 'ArrowRight') return show(index + 1);
    if (e.key === 'ArrowLeft') return show(index - 1);
    if (e.key === '+' || e.key === '=') return setZoom(zoom * 1.4);
    if (e.key === '-') return setZoom(zoom / 1.4);
    if (e.key === '0') return fit();
    if (e.key === 'Tab') {
      const f = $$('button, a[href]', box);
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  return { open };
})();

document.addEventListener('click', e => {
  if (e.target.closest('a, button')) return;
  const el = e.target.closest('img[data-full]');
  if (el) { e.preventDefault(); viewer.open(el); }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = document.activeElement;
  if (el && el.matches && el.matches('img[data-full]')) { e.preventDefault(); viewer.open(el); }
});


/* ── select ───────────────────────────────────────────────────────────────
 * A shadcn-style select: the native <select> stays in the DOM as the source of
 * truth and keeps firing `change`, while a button trigger and a popover
 * listbox render the visible control. Rebuilt whenever its options change. */
function enhanceSelect(sel) {
  const wrap = sel.closest('.select');
  if (!wrap || !sel.options.length) return;
  wrap.classList.add('sselect');
  sel.classList.add('sr');

  let trigger = $('.strigger', wrap), pop = $('.spop', wrap);
  if (!trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'strigger';
    trigger.innerHTML = '<span class="slabel"></span><span class="schev" aria-hidden="true"></span>';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const lab = sel.labels && sel.labels[0];
    if (lab) trigger.setAttribute('aria-label', lab.textContent.trim());
    pop = document.createElement('div');
    pop.className = 'spop';
    pop.setAttribute('role', 'listbox');
    pop.hidden = true;
    pop.id = (sel.id || 'sel') + '-list';
    trigger.setAttribute('aria-controls', pop.id);
    wrap.append(trigger, pop);
  }

  const label = $('.slabel', trigger);
  const paint = () => { label.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : ''; };

  pop.innerHTML = '';
  [...sel.options].forEach((o, i) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'sitem';
    item.setAttribute('role', 'option');
    item.dataset.i = String(i);
    item.setAttribute('aria-selected', String(i === sel.selectedIndex));
    item.innerHTML = '<span class="scheck" aria-hidden="true"></span><span class="stext"></span>';
    $('.stext', item).textContent = o.text;
    item.addEventListener('click', () => {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      paint();
      $$('.sitem', pop).forEach((n, k) => n.setAttribute('aria-selected', String(k === i)));
      close(true);
    });
    pop.appendChild(item);
  });
  paint();

  function open() {
    if (!pop.hidden) return;
    /* only one popover at a time */
    $$('.spop').forEach(p => { if (p !== pop) p.hidden = true; });
    $$('.strigger[aria-expanded="true"]').forEach(t => t.setAttribute('aria-expanded', 'false'));
    pop.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    /* the panel opens upward when the viewport below is too shallow */
    const r = trigger.getBoundingClientRect();
    wrap.classList.toggle('up', innerHeight - r.bottom < Math.min(pop.scrollHeight + 24, 320));
    const cur = $$('.sitem', pop)[sel.selectedIndex] || $('.sitem', pop);
    if (cur) cur.focus();
  }
  function close(refocus) {
    if (pop.hidden) return;
    pop.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (refocus) trigger.focus();
  }
  if (!trigger.dataset.bound) {
    trigger.dataset.bound = '1';
    trigger.addEventListener('click', () => (pop.hidden ? open() : close(true)));
    trigger.addEventListener('keydown', e => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); }
    });
    pop.addEventListener('keydown', e => {
      const items = $$('.sitem', pop);
      let i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); return close(true); }
      if (e.key === 'Tab') { e.preventDefault(); return close(true); }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'ArrowDown') i = (i + 1) % items.length;
      else if (e.key === 'ArrowUp') i = (i - 1 + items.length) % items.length;
      else if (e.key === 'Home') i = 0;
      else i = items.length - 1;
      items[i].focus();
    });
    document.addEventListener('pointerdown', e => { if (!wrap.contains(e.target)) close(false); });
    sel.addEventListener('change', paint);
  }
}
function enhanceSelects(scope) { $$('.select > select', scope || document).forEach(enhanceSelect); }

/* ── static content ───────────────────────────────────────────────────── */
/* Figure 2 is featured in the idea section, so the method walkthrough starts at Figure 3. */
const METHOD_FIGURES = [
  ['fig3', 'Paper figure 3', 'PAVER overview', 'overview5',
   'A single LiDAR sweep is rasterized into free, occupied and unknown cells, and rule-based ego motions are rolled out over it. The camera-derived BEV features along each corridor are replaced by a shared mask token before the head predicts the two target ratios.',
   'PAVER constructs sparse action targets from a LiDAR sweep, masks the action corridors in the camera-derived BEV features with a shared learnable token, and predicts the targets conditioned on the corresponding action state.'],
  ['fig4', 'Paper figure 4', 'Two-stage training protocol', 'training_method',
   'Stage 1 trains only the BEV encoder and the auxiliary head. Stage 2 discards the head, reinitializes every task decoder, and runs the downstream recipe unchanged, so the comparison isolates initialization.',
   'Only the pretrained BEV encoder transfers; every task decoder is reinitialized.'],
  ['fig5', 'Paper figure 5', 'Sparse action-target construction', 'soft_labels5',
   'Each candidate state is queried at K lateral positions across the vehicle width. Risk is the fraction of those queries on measured returns and Unknown the fraction on cells no ray supports, so both targets describe only what the sensor observed.',
   'LiDAR rays provide Risk and Unknown targets for action-indexed queries; \u201cSafe\u201d denotes free space.']
];

(function featureFigure2() {
  const host = document.getElementById('fig2frame');
  if (!host) return;
  const f = framed('assets/fig/figure2_v3.png', 'Driving pretraining paradigms',
    'Driving pretraining paradigms', 'assets/pdf/figure2_v3.pdf');
  host.replaceWith(f);
})();

/* KPI plot: two thick bars, baseline above and PAVER below, both hoverable. */
(function kpiPlots() {
  const SPEC = [
    { metric: 'Average collision rate', unit: '%', base: 0.51, ours: 0.19, max: 0.60, lower: true,
      note: 'VAD-Tiny, averaged over the 1, 2 and 3 second horizons' },
    { metric: 'Total training time', unit: 'h', base: 21.3, ours: 13.6, max: 24.0, lower: true,
      note: 'four RTX 5090 GPUs, including the 20 pretraining epochs' },
    { metric: 'Driving Score', unit: '', base: 48.5, ours: 58.8, max: 100, lower: false,
      note: 'UniAD-Tiny on Bench2Drive Town05 Long, nine routes' }
  ];
  const NS = 'http://www.w3.org/2000/svg';
  const cards = $$('.kpi');
  const C = window.PAVER_CHARTS;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('run'); io.unobserve(e.target); }
  }), { rootMargin: '-5% 0px' });

  SPEC.forEach((spec, i) => {
    const card = cards[i];
    if (!card) return;
    const W = 300, bh = 13, gap = 9, gutter = 46;
    const H = bh * 2 + gap;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'k-plot');
    svg.setAttribute('role', 'img');
  svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-label',
      `${spec.metric}: baseline ${spec.base}${spec.unit}, PAVER ${spec.ours}${spec.unit}`);
    const w = v => Math.max(4, (W - gutter) * v / spec.max);
    const delta = spec.lower
      ? `${fmt((spec.base - spec.ours) / spec.base * 100, 0)}% lower`
      : `+${fmt(spec.ours - spec.base, 1)} points`;

    [['base', 'base', spec.base, 0], ['ours', 'ours', spec.ours, bh + gap]].forEach(([cls, label, value, y]) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'k-bar');
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', 0); t.setAttribute('y', y + bh - 2);
      t.setAttribute('class', 'k-name' + (cls === 'ours' ? ' hi' : ''));
      t.textContent = label;
      const track = document.createElementNS(NS, 'rect');
      track.setAttribute('x', gutter); track.setAttribute('y', y);
      track.setAttribute('width', W - gutter); track.setAttribute('height', bh);
      track.setAttribute('rx', bh / 2); track.setAttribute('class', 'track');
      const bar = document.createElementNS(NS, 'rect');
      bar.setAttribute('x', gutter); bar.setAttribute('y', y);
      bar.setAttribute('width', w(value)); bar.setAttribute('height', bh);
      bar.setAttribute('rx', bh / 2); bar.setAttribute('class', cls);
      g.append(t, track, bar);
      svg.appendChild(g);
      const html = `<b>${cls === 'ours' ? 'With PAVER' : 'Baseline'}</b><br>${spec.metric}: ` +
                   `${value}${spec.unit}<br><i>${cls === 'ours' ? delta + ' than the baseline · ' : ''}${spec.note}</i>`;
      if (C && C.hoverable) C.hoverable(g, html);
    });
    card.insertBefore(svg, $('.tag', card));
    io.observe(card);
  });
})();

(function methodFigures() {
  const host = $('#methodFigs');
  METHOD_FIGURES.forEach(([id, kicker, title, stem, intro, caption]) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = id;
    card.appendChild(cardHeader({ kicker, title }));
    const p = document.createElement('p');
    p.className = 'lead';
    p.textContent = intro;
    card.appendChild(p);
    card.appendChild(framed(`assets/fig/${stem}.png`, title, title, `assets/pdf/${stem}.pdf`));
    const cap = document.createElement('p');
    cap.className = 'caption';
    cap.innerHTML = caption;
    card.appendChild(cap);
    host.appendChild(card);
  });
  observeCards(host);
})();

/* The six-scene static comparison grid is gone. The 3D Visualizer shows the
   same nuScenes scenes with the same two models, interactively and at any
   scene, so the baked-in image dump was a second, worse copy of it. */




/* Tables 7 and 8 are built here because their cells carry accessible marks */
(function ablationRows() {
  const mark = on => on
    ? '<span aria-hidden="true">&#10003;</span><span class="sr">used</span>'
    : '<span aria-hidden="true">&mdash;</span><span class="sr">not used</span>';
  const T7 = [
    [[0,0,0,0], '0.00M', ['0.662','0.513','0.905','0.338','0.419'], '', []],
    [[1,0,0,0], '3.01M', ['0.515','0.240','0.798','0.365','0.406'], 'sep', []],
    [[0,1,0,0], '2.91M', ['0.694','0.333','0.857','0.331','0.391'], '', []],
    [[0,0,1,0], '3.56M', ['0.646','0.320','0.905','0.336','0.393'], '', []],
    [[1,1,0,0], '5.92M', ['0.504','0.190','0.805','0.361','0.397'], '', [0]],
    [[1,1,1,0], '9.49M', ['0.577','0.270','0.798','0.356','0.420'], '', []],
    [[0,0,0,1], '0.01M', ['0.603','0.187','0.803','0.397','0.439'], 'ours sep', [1,3], true],
    [[0,0,0,1], '0.03M', ['0.514','0.320','0.800','0.383','0.447'], 'sweep', [4]],
    [[0,0,0,1], '0.09M', ['0.596','0.220','0.782','0.397','0.433'], 'sweep', [2]]
  ];
  const t7 = $('#t7body');
  if (t7) t7.innerHTML = T7.map(([flags, params, vals, cls, wins, headline]) => `
    <tr class="${cls}">
      <th class="stick" scope="row">${mark(flags[0])}</th><td>${mark(flags[1])}</td>
      <td>${mark(flags[2])}</td><td>${mark(flags[3])}</td>
      <td>${headline ? '<b class="win">' + params + '</b>' : params}</td>
      ${vals.map((v, i) => `<td>${wins.includes(i) ? '<b class="win">' + v + '</b>' : v}</td>`).join('')}
    </tr>`).join('');

  const T8 = [
    [[0,0], ['0.662','0.513','0.905','1.250','0.135','0.338','0.419'], '', []],
    [[1,0], ['0.655','0.520','0.808','1.084','0.115','0.396','0.443'], 'sep', [4]],
    [[0,1], ['0.705','0.550','0.797','1.080','0.123','0.388','0.445'], '', [2,3,6]],
    [[1,1], ['0.603','0.187','0.803','1.086','0.121','0.397','0.439'], 'ours', [0,1,5]]
  ];
  const t8 = $('#t8body');
  if (t8) t8.innerHTML = T8.map(([flags, vals, cls, wins]) => `
    <tr class="${cls}"><th class="stick" scope="row">${mark(flags[0])}</th><td>${mark(flags[1])}</td>
    ${vals.map((v, i) => `<td>${wins.includes(i) ? '<b class="win">' + v + '</b>' : v}</td>`).join('')}</tr>`).join('');
})();

(function suppTables() {
  const S = window.PAVER_SUPP;
  const tabs = $('#suppTabs'), body = $('#suppBody'), title = $('#suppTitle');
  if (!S || !tabs) return;
  function draw(key, push) {
    const g = S.groups.find(x => x.key === key) || S.groups[0];
    if (title) title.textContent = g.title;
    body.innerHTML = '';
    g.items.forEach(label => {
      const block = document.createElement('div');
      block.className = 'tblock';
      block.id = label.replace(':', '-');
      const h = document.createElement('h4');
      h.textContent = S.tables[label].name;
      block.appendChild(h);
      block.insertAdjacentHTML('beforeend', S.tables[label].html);
      body.appendChild(block);
    });
    observeCards(body);
    markTabs(tabs, g.key);
    if (push) setParam('supp', g.key);
  }
  /* the full metric tables lead, since they are what most readers come for */
  const ORDER = ['transparency', 'controls', 'analysis'];
  const ordered = [...S.groups].sort((x, y) => ORDER.indexOf(x.key) - ORDER.indexOf(y.key));
  chipTabs(tabs, ordered.map(g => [g.key, g.title]), draw);
  draw(getParam('supp', ordered[0].key));
})();

$('#copyBib').addEventListener('click', async e => {
  try {
    await navigator.clipboard.writeText($('#bib').textContent);
    e.target.textContent = 'Copied';
  } catch (err) {
    e.target.textContent = 'Select and copy manually';
  }
  setTimeout(() => { e.target.textContent = 'Copy BibTeX'; }, 1800);
});

/* ── manifest-driven sections ─────────────────────────────────────────── */
addEventListener('DOMContentLoaded', () => {
  const M = window.PAVER;
  const C = window.PAVER_CHARTS;

  if (C) {
    C.chartCost($('#chartCost'));
    C.chartTransfer($('#chartTransfer'));
    (function capacity() {
      const tabs = $('#capacityTabs');
      const metrics = C.CAPACITY_METRICS;
      const draw = (k, push) => {
        C.chartCapacity($('#chartCapacity'), k);
        markTabs(tabs, k);
        if (push) setParam('cap', k);
      };
      if (!tabs || !metrics) { C.chartCapacity($('#chartCapacity')); return; }
      chipTabs(tabs, metrics.map(m => [m[0], m[1]]), draw);
      draw(getParam('cap', metrics[0][0]));
    })();

    /* the same numbers as a table, behind the header toggle */
    /* the caption sits after the table, like every other one on the page: inside
       the tabular it competed with the card title and scrolled away sideways */
    const table = (caption, head, rows) =>
      `<div class="scroller"><table>
        <thead><tr>${head.map((x, i) => `<th scope="col"${i ? '' : ' class="stick"'}>${x}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r => `<tr${r.ours ? ' class="ours"' : ''}>` +
          r.cells.map((c, i) => i ? `<td>${c}</td>` : `<th class="stick" scope="row">${c}</th>`).join('') +
          '</tr>').join('')}</tbody></table></div><p class="tcap">${caption}</p>`;
    const D2 = C.D;
    $('#costTable').innerHTML = table(
      'Total training time including the PAVER pretraining epochs, four RTX 5090 GPUs.',
      ['Configuration', 'Hours', 'Speed-up'],
      D2.cost.map(d => ({ ours: d.ours,
        cells: [d.label, d.h.toFixed(1) + 'h', d.speedup ? d.speedup.toFixed(2) + '×' : '—'] })));
    $('#glanceTable').innerHTML =
      table('Average planning L2 and collision rate over 1, 2 and 3 seconds.',
        ['Configuration', 'L2 (m) ↓', 'Collision (%) ↓', 'Auxiliary parameters'],
        D2.transfer.map(p => ({ ours: p.ours, cells: [p.label, p.l2.toFixed(3), p.col.toFixed(3),
          p.params ? p.params.toLocaleString() : (p.ours ? '10,258' : '0')] }))) +
      table('Auxiliary parameter count against detection NDS after transfer.',
        ['Pretraining', 'Parameters', 'NDS ↑'],
        D2.capacity.pts.map(p => ({ ours: p.label === 'PAVER (10K)',
          cells: [p.label, p.p.toLocaleString(), p.nds.toFixed(3)] })));
    C.chartClosed($('#chartClosed'));

    /* multi-task radar for Table 1 */
    const drawRadar = (k, push) => {
      C.chartRadar($('#chartRadar'), k);
      markTabs($('#radarTabs'), k);
      if (push) setParam('arch', k);
    };
    chipTabs($('#radarTabs'), Object.keys(C.RADAR ? C.RADAR.models : { 'VAD-Tiny': 0 }).map(m => [m, m]), drawRadar);
    drawRadar(getParam('arch', 'VAD-Tiny'));

    /* the remaining result tables get a chart view of their own */
    [['pseudo', 'chartPseudo', 'pseudoTabs', 'pm'],
     ['map', 'chartMap', 'mapTabs', 'mm'],
     ['methods', 'chartMethods', 'methodsTabs', 'mtm'],
     ['strategy', 'chartStrategy', 'strategyTabs', 'sm'],
     ['components', 'chartComponents', 'componentsTabs', 'cm']].forEach(([set, host, tabId, param]) => {
      const metrics = C.ROWSETS[set].metrics;
      const draw = (k, push) => {
        C.chartRows($('#' + host), set, k);
        markTabs($('#' + tabId), k);
        if (push) setParam(param, k);
      };
      chipTabs($('#' + tabId), metrics.map(m => [m[0], m[1]]), draw);
      draw(getParam(param, metrics[0][0]));
    });

    const drawHorizon = (k, push) => {
      C.chartHorizon($('#chartHorizon'), k);
      markTabs($('#horizonTabs'), k);
      if (push) setParam('hz', k);
    };
    chipTabs($('#horizonTabs'), [['L2', 'Planning L2'], ['Collision', 'Collision rate']], drawHorizon);
    drawHorizon(getParam('hz', 'L2'));

    const drawSchedule = (k, push) => {
      C.chartSchedule($('#chartSchedule'), k);
      markTabs($('#scheduleTabs'), k);
      if (push) setParam('sched', k);
    };
    chipTabs($('#scheduleTabs'), [['Tiny', 'VAD-Tiny'], ['Base', 'VAD-Base']], drawSchedule);
    drawSchedule(getParam('sched', 'Tiny'));
  }

  /* interactive analysis views */
  const VIEWS = [
    ['traj', 'Trajectories', 'Downstream trajectories',
     'Each VAD-Tiny experiment across downstream epochs. Pick a metric, and select legend entries to isolate runs.'],
    ['pathways', 'What the head uses', 'Input interventions on the PAVER head',
     'Each row removes or shuffles one input and reports how much the head loss grows. A bar whose interval clears zero means the head demonstrably relies on that input; the dominance of the zero-action intervention is what makes the objective action-conditioned rather than a static occupancy readout.'],
    ['targets', 'Target composition', 'What the sparse targets actually contain',
     'Fraction of queried cells that a single sweep reports as free, occupied, or unknown, for the whole BEV and per bearing. Two thirds of the plane is unobserved, which is why the objective is defined on ratios rather than dense reconstruction.'],
    ['calib', 'Target calibration', 'Calibration of the risk and unknown heads',
     'Expected calibration error with bootstrap intervals at each horizon. The targets are continuous ratios, so calibration reports how usable the predicted values are rather than whether a class was guessed correctly.'],
    ['cka', 'Representation shift', 'Layerwise linear CKA',
     'Similarity between the initialization, the pretrained encoder, and the fine-tuned model at each layer. The image backbone stays close to its initialization while the BEV layers move, which is the intended division of labour.'],
    ['probe', 'Region probe', 'Linear probe by BEV region',
     'A linear probe reads the target state out of frozen BEV features. Accuracy inside the action corridor against the whole plane shows where pretraining actually reorganized the representation.'],
    ['routing', 'Gradient routing', 'Where each task gradient lands',
     'Share of every downstream task gradient norm reaching the image backbone, the transferred BEV encoder, and the remaining transferred parameters. It explains why an encoder-only initialization moves all four task heads.'],
    ['auc', 'Learning speed', 'Area under the learning curve, epochs 1 to 30',
     'Signed advantage over the scratch baseline in the mean metric across the first thirty downstream epochs. Positive means PAVER leads for most of training, not only at the selected checkpoint.'],
    ['drift', 'Parameter drift', 'How far each component moves downstream',
     'Relative L2 change of every parameter group across the first thirty downstream epochs. The transferred BEV encoder is highlighted; a small change means the initialization is kept rather than overwritten.'],
    ['mask', 'Mask token', 'What the shared mask token learns',
     'Norm of the learned mask token across pretraining, together with the risk and unknown probabilities the head produces when it sees only that token. A drifting readout means the token carries a prior of its own.'],
    ['shortcut', 'Shortcut audit', 'Does a pretraining proxy predict downstream quality',
     'Spearman rank correlation between each cheap pretraining proxy and each downstream outcome, with the exact two-sided p value and the leave-one-out range in the tooltip.'],
    ['corr', 'Metric structure', 'Correlation between downstream metrics',
     'How the reported metrics move together. Weak coupling between planning safety and perception quality is why no single checkpoint maximizes every column.']
  ];

  if (C && window.PAVER_DATA) {
    const sel = $('#anSelect'), body = $('#anBody'), tools = $('#anTools');
    const card = $('#trajviews');
    let view = getParam('view', 'traj');
    let metric = getParam('tm', 'Planning L2 Avg');
    let scope = getParam('cs', 'PAVER');
    const hidden = new Set();

    const simple = {
      cka: C.chartCKA, probe: C.chartProbe,
      pathways: C.chartPathways, calib: C.chartCalib,
      auc: C.chartAUC, routing: C.chartRouting, targets: C.chartTargets,
      drift: C.chartDrift, mask: C.chartMask, shortcut: C.chartShortcut
    };

    function draw(key, push) {
      const found = VIEWS.find(v => v[0] === key) || VIEWS[0];
      view = found[0];
      $('h3', card).textContent = found[2];
      let lead = $('.lead', card);
      if (!lead) {
        lead = document.createElement('p');
        lead.className = 'lead';
        card.insertBefore(lead, body);
      }
      lead.textContent = found[3];

      body.innerHTML = '';
      tools.innerHTML = '';
      if (view === 'traj') {
        chipTabs(tools, window.PAVER_DATA.traj.metrics.map(m => [m, m]), (m, p) => {
          metric = m; C.chartTrajectories(body, m, hidden); markTabs(tools, m); if (p) setParam('tm', m);
        });
        C.chartTrajectories(body, metric, hidden);
        markTabs(tools, metric);
      } else if (view === 'corr') {
        const scopes = (window.PAVER_DATA.corr || {}).scopes || [];
        if (!scopes.includes(scope)) scope = scopes[0];
        chipTabs(tools, scopes.map(s => [s, s.replace(/_/g, ' ')]), (s, p) => {
          scope = s; C.chartCorr(body, s); markTabs(tools, s); if (p) setParam('cs', s);
        });
        C.chartCorr(body, scope);
        markTabs(tools, scope);
      } else {
        simple[view](body);
      }
      sel.value = view;
      observeCards(body);
      if (push) setParam('view', view);
    }
    sel.innerHTML = VIEWS.map(v => `<option value="${v[0]}">${v[1]}</option>`).join('');
    sel.value = view;
    enhanceSelect(sel);
    sel.addEventListener('change', () => { draw(sel.value, true); announce($('h3', card).textContent); });
    draw(view);
  }

  if (!M) return;

  /* closed-loop route charts, drawn from the recorded tracks */
  (function routeCharts() {
    const C2 = window.PAVER_CHARTS, D = window.PAVER_DATA;
    const sel = $('#routeChart'), tabs = $('#traceTabs');
    if (!C2 || !D || !D.closedloop || !sel) return;
    const ids = Object.keys(D.closedloop);
    let route = getParam('route', '25857');
    let channel = getParam('ch', 'speed');
    if (!ids.includes(route)) route = ids[0];
    function drawTable() {
      const host = $('#routeTable');
      const rec = (D.closedloop || {})[route];
      if (!host || !rec) return;
      const rows = Object.entries(rec.policies).map(([name, p]) => ({
        ours: /paver/i.test(name),
        cells: [name, p.ds == null ? 'n/a' : p.ds.toFixed(2),
                p.rc == null ? 'n/a' : p.rc.toFixed(2),
                p.outcome || p.status || '', p.dur == null ? '' : p.dur.toFixed(0) + ' s']
      }));
      C2.dataTable(host, `Route ${route}, ${rec.scenario}.`,
        ['Policy', 'Driving score', 'Route completion', 'Outcome', 'Duration'], rows);
    }

    function draw(push) {
      C2.chartRouteTimeline($('#chartTimeline'), route);
      C2.chartRouteTrace($('#chartTrace'), route, channel);
      drawTable();
      sel.value = route;
      markTabs(tabs, channel);
      if (push) { setParam('route', route); setParam('ch', channel); }
    }
    sel.innerHTML = ids.map(id =>
      `<option value="${id}">${id} · ${D.closedloop[id].scenario}</option>`).join('');
    sel.value = route;
    enhanceSelect(sel);
    sel.addEventListener('change', () => { route = sel.value; draw(true); });
    chipTabs($('#routeView'), [['chart', 'Chart'], ['table', 'Table']], (k, push) => {
      $('#chartTimeline').hidden = k === 'table';
      $('#chartTrace').hidden = k === 'table';
      $('#routeTable').hidden = k !== 'table';
      markTabs($('#routeView'), k);
    });
    markTabs($('#routeView'), 'chart');
    chipTabs(tabs, [['speed', 'Speed'], ['brake', 'Brake']], (k, p) => { channel = k; draw(p); });
    draw();
  })();

  /* closed-loop videos */
  (function routes() {
    const sel = $('#routeSel'), grid = $('#videoGrid');
    const NAME = { 'uniadtiny.mp4': 'UniAD-Tiny', 'uniadtiny_paver.mp4': 'UniAD-Tiny + PAVER' };
    const OUTCOME = {
      '24759': { base: ['blocked'], paver: ['blocked'] },
      '25318': { base: ['1 collision', 'timeout'], paver: ['2 collisions', 'route complete'] },
      '25381': { base: ['route complete'], paver: ['route complete'] },
      '25857': { base: ['timeout'], paver: ['route complete'] },
      '25955': { base: ['route complete'], paver: ['2 collisions', 'route complete'] },
      '26396': { base: ['route complete'], paver: ['route complete'] },
      '26956': { base: ['timeout'], paver: ['1 collision', 'route complete'] },
      '26966': { base: ['timeout'], paver: ['timeout'] },
      '27506': { base: ['7 collisions'], paver: ['timeout'] }
    };
    const cls = t => /complete/.test(t) ? 'ok' : (/collision/.test(t) ? 'bad' : 'warn');
    let players = [];
    /* Playback speed. The clips are 10 fps rendered from a 2 Hz capture, so they
       play at five times real time and the default of a quarter speed brings
       them close to the wall clock. Slower is visibly steppy because the capture
       has no more frames, which is the trade the control makes explicit. */
    const RATES = [['0.25', '0.25\u00d7'], ['0.5', '0.5\u00d7'], ['1', '1\u00d7']];
    let routeRate = parseFloat(getParam('speed', '0.25')) || 0.25;
    if (!RATES.some(r => parseFloat(r[0]) === routeRate)) routeRate = 0.25;

    const paired = M.routes.filter(r => r.videos.length >= 2);
    function show(id, push) {
      const r = paired.find(x => x.id === id) || paired[0];
      players.forEach(v => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} });
      players = [];
      grid.innerHTML = '';
      r.videos.forEach(file => {
        const ours = file.includes('paver');
        const outcome = (OUTCOME[r.id] || {})[ours ? 'paver' : 'base'] || [];
        const score = ours ? r.paver : r.base;
        const card = document.createElement('div');
        /* a panel, not a card: these sit inside the replay card, and a card
           within a card stacks two surfaces and reads as a boxed box */
        card.className = 'vpanel';
        card.innerHTML =
          `<div class="vhead"><span class="who${ours ? ' ours' : ''}">${NAME[file] || file}</span>
             <span class="score"><abbr title="Driving Score">DS</abbr> ${score.split(' / ')[0]}
               <i aria-hidden="true">&middot;</i>
               <abbr title="Route Completion">RC</abbr> ${score.split(' / ')[1]}</span></div>
           <video preload="metadata" playsinline muted poster="assets/video/posters/${r.id}_${file.replace('.mp4','')}.jpg"
                  aria-label="Closed-loop replay of route ${r.id}, ${r.scenario}, ${NAME[file] || file}"></video>
           <div class="chips">${outcome.map(t => `<span class="tag ${cls(t)}">${t}</span>`).join('')}</div>
           <p class="caption">Front camera and top-down view of route ${r.id}, ${r.scenario}, driven by
             ${NAME[file] || file}. Driving Score ${score.split(' / ')[0]}, Route Completion ${score.split(' / ')[1]}.</p>`;
        const vid = $('video', card);
    card.dataset.state = 'loading';
    vid.addEventListener('loadeddata', () => { card.dataset.state = 'ready'; }, { once: true });
    vid.addEventListener('error', () => { card.dataset.state = 'failed'; }, { once: true });
    vid.src = `assets/video/route${r.id}/${file}`;
        grid.appendChild(card);
        players.push($('video', card));
      });
      observeCards(grid);
      const play = $('#routePlay');
      if (play) play.classList.remove('playing');
      players.forEach(v => v.addEventListener('loadedmetadata',
        () => window.__routePaint && window.__routePaint(), { once: true }));
      /* the clips are rendered at 10 fps from a 2 Hz capture, so they run at
         five times real time; new players inherit whatever speed is selected */
      players.forEach(v => { v.playbackRate = routeRate; });
      sel.value = r.id;
      if (push) setParam('route', r.id);
    }
    sel.innerHTML = paired.map(r => {
      const o = (OUTCOME[r.id] || {}).paver || [];
      const tail = o[o.length - 1] ? ` \u2014 ${o[o.length - 1]}` : '';
      return `<option value="${r.id}">Route ${r.id} \u00b7 ${r.scenario}${tail}</option>`;
    }).join('');
    sel.addEventListener('change', () => {
      show(sel.value, true);
      announce(`Route ${sel.value}`);
      /* the charts below describe the same route, so they follow the replay */
      const chart = $('#routeChart');
      if (chart && chart.value !== sel.value &&
          [...chart.options].some(o => o.value === sel.value)) {
        chart.value = sel.value;
        chart.dispatchEvent(new Event('change'));
      }
    });
    /* the speed control uses the same segmented component as every other switch */
    (function speed() {
      const host = $('#routeSpeed');
      if (!host) return;
      const pick = (key, push) => {
        routeRate = parseFloat(key);
        players.forEach(v => { v.playbackRate = routeRate; });
        markTabs(host, key);
        /* pressing a speed while paused changed nothing visible, so the choice
           looked like it had not registered */
        const t = $('#routeTransport');
        if (t) { t.dataset.rate = key; }
        if (push) { setParam('speed', key); announce(`Playback speed ${key} times`); }
      };
      chipTabs(host, RATES, pick);
      pick(String(routeRate));
    })();

    /* one transport drives the pair, because the point of the card is that the
     * two policies are watched at the same instant of the same route */
    (function transport() {
      const play = $('#routePlay'), track = $('#routeTrack');
      const fill = $('#routeFill'), knob = $('#routeKnob');
      const now = $('#routeNow'), dur = $('#routeDur');
      const clock = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
      const lead = () => players[0];
      const length = () => (lead() && isFinite(lead().duration) ? lead().duration : 0);

      function paint() {
        const d = length(), c = lead() ? lead().currentTime : 0;
        const pct = d ? (c / d) * 100 : 0;
        fill.style.width = pct + '%';
        knob.style.left = pct + '%';
        now.textContent = clock(c);
        dur.textContent = clock(d);
        track.setAttribute('aria-valuenow', String(Math.round(pct)));
        track.setAttribute('aria-valuetext', `${clock(c)} of ${clock(d)}`);
      }
      function seek(pct) {
        const d = length();
        if (!d) return;
        players.forEach(v => { v.currentTime = Math.max(0, Math.min(1, pct)) * d; });
        paint();
      }
      play.addEventListener('click', () => {
        const playing = lead() && !lead().paused;
        if (playing) { players.forEach(v => v.pause()); }
        else { const at = lead() ? lead().currentTime : 0;
               players.forEach(v => { v.currentTime = at; v.play(); }); }
        play.classList.toggle('playing', !playing);
      });
      let dragging = false;
      const pctOf = e => {
        const r = track.getBoundingClientRect();
        return (e.clientX - r.left) / (r.width || 1);
      };
      track.addEventListener('pointerdown', e => {
        dragging = true; track.classList.add('scrubbing');
        track.setPointerCapture(e.pointerId); seek(pctOf(e));
      });
      track.addEventListener('pointermove', e => { if (dragging) seek(pctOf(e)); });
      track.addEventListener('pointerup', () => { dragging = false; track.classList.remove('scrubbing'); });
      track.addEventListener('keydown', e => {
        const d = length(); if (!d) return;
        const at = lead().currentTime;
        const to = { ArrowLeft: at - 1, ArrowRight: at + 1,
                     PageDown: at - 10, PageUp: at + 10, Home: 0, End: d }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        seek(to / d);
      });
      window.__routePaint = paint;
      setInterval(() => { if (!dragging) paint(); }, 200);
    })();
    show(paired.some(r => r.id === getParam('route', '25857')) ? getParam('route', '25857') : paired[0].id);
  })();


  /* three-camera Grad-CAM gallery */
  

  /* supplementary galleries */
  
});

/* ── 3D inference viewer ──────────────────────────────────────────────────
 * Loads one exported frame at a time and drives the renderer in webviz.js.
 * Camera state, layer toggles and the score threshold live here; the renderer
 * stays a pure function of (frame, model, options). */
(function sceneViewer() {
  const card = $('#viewer3d');
  const WV = window.PAVER_WEBVIZ;
  if (!card || !WV) return;
  const stage = $('#wvStage'), sel = $('#wvFrame');

  /* A layer is either drawn or not. No colour chip: boxes are coloured per
   * class and the map per element type, so a single swatch would misrepresent
   * both. */
  const LAYERS = [['det', 'Boxes', true], ['map', 'Vector map', true],
                  ['motion', 'Motion', true], ['plan', 'Plan', true],
                  ['gt', 'Ground truth', false]];
  const CAMS = [['behind', 'Behind'], ['top', 'Top down'], ['front', 'Front'], ['free', 'Free']];

  const layers = {};
  LAYERS.forEach(([k, , on]) => (layers[k] = on));
  let manifest = null, frame = null;
  let arch = getParam('wa', 'VAD-Tiny');
  let clip = null, at = 0, playing = false, timer = null, cache = new Map();
  /* 1x is the capture rate, so playback runs in real time by default */
  const SPEEDS = [0.5, 1, 2, 4];
  let speed = parseFloat(getParam('ws', '1')) || 1;
  let cams = [], images = new Map();
  /* the camera strip has two layers: the projected prediction, or the Grad-CAM
   * attribution for the same frame. Attention mode shows both models at once,
   * because the whole point is where the baseline looked against where the
   * pretrained model looked. */
  let camMode = getParam('cm2', 'pred');
  /* the BEV embedding is the representation PAVER pretrains, so it is the only
   * attribution the page shows */
  const TARGET = 'bev';
  /* which model the images carry, in both layers: its projected boxes in the
   * prediction layer, its attribution in the Grad-CAM layer */
  let imgSlot = getParam('as', 'paver');
  let fade = 1;
  let focus = getParam('fc', '') || null;
  const gcOf = () => {
    const g = manifest.gradcam;
    if (!g) return null;
    const e = g.architectures ? g.architectures[arch] : null;
    return e && e.available && e.dir ? { ...e, targets: g.targets, width: g.width } : null;
  };
  const gcSrc = (token, name) => {
    const gc = gcOf();
    return gc ? `assets/webviz/gradcam/${token}/${gc.dir}/${imgSlot}_${TARGET}_${name}.webp` : '';
  };

  /* One <img> per URL, reused across frames. Requests are issued in order of
   * distance from the playhead and only a few at a time: firing all 240 images
   * of a clip at once fills the browser's six connections with frames nobody is
   * looking at, so scrubbing waited behind them. */
  const MAX_INFLIGHT = 8;
  let inflight = 0;
  const queued = new Map();          /* src -> priority, lower is sooner */
  const started = new Set();

  function image(src, priority) {
    let im = images.get(src);
    if (im) {
      if (priority === 0 && !started.has(src)) start(src);
      return im;
    }
    im = new Image();
    im.decoding = 'async';
    images.set(src, im);
    if (priority === 0) start(src);
    else { queued.set(src, priority == null ? 50 : priority); pump(); }
    return im;
  }
  function start(src) {
    const im = images.get(src);
    if (!im || started.has(src)) return;
    started.add(src);
    queued.delete(src);
    inflight++;
    const done = () => { inflight--; pump(); };
    im.addEventListener('load', done, { once: true });
    im.addEventListener('error', done, { once: true });
    im.src = src;
  }
  function pump() {
    while (inflight < MAX_INFLIGHT && queued.size) {
      let best = null, bestP = Infinity;
      queued.forEach((p, s) => { if (p < bestP) { bestP = p; best = s; } });
      if (best == null) return;
      start(best);
    }
  }
  /* re-rank the queue whenever the playhead moves */
  function prioritise() {
    if (!clip) return;
    const idx = new Map(clip.tokens.map((t, i) => [t, i]));
    queued.forEach((_, src) => {
      const m = /\/(cam|gradcam)\/([0-9a-f]{32})\//.exec(src);
      const i = m ? idx.get(m[2]) : null;
      queued.set(src, i == null ? 999 : Math.abs(i - at) * 10 + (i < at ? 5 : 0));
    });
    pump();
  }

  /* Attention mode: the same six cameras, twice, one row per model, so the two
   * attributions can be read column by column. Clicking a column enlarges that
   * camera to a single large pair, since twelve small cells are for scanning. */
  let attnKey = '';
  /* Assigning a new src blanks the element until the file decodes, which is the
   * white flash between frames. The replacement is decoded off-screen first and
   * only then swapped in, so the cell always holds a complete picture. */
  function swap(el, src) {
    if (el.getAttribute('src') === src || el.dataset.want === src) return;
    el.dataset.want = src;             /* a property of dataset, not dataset itself */
    const probe = image(src, 0);
    const put = () => { if (el.dataset.want === src) el.src = src; };
    if (probe.complete && probe.naturalWidth) put();
    else probe.addEventListener('load', put, { once: true });
  }
  function buildAttn() {
    const host = $('#wvCams');
    const gc = gcOf();
    const order = (manifest.cameraOrder || []);
    if (!gc || !order.length || !frame) { host.innerHTML = ''; attnKey = ''; return; }
    const shown = focus && order.includes(focus) ? [focus] : order;
    /* Hovering a 3D pane redraws the whole viewer, which used to tear down and
     * rebuild every image element on each pointer move. The grid is only
     * rebuilt when its shape actually changes; otherwise the existing images
     * are repointed. */
    /* The shape of the grid depends on the architecture and which cameras are
     * shown; the content depends on the frame and the model. Only a shape
     * change rebuilds: repointing an existing <img> lets the browser keep the
     * decoded picture on screen until the replacement has decoded, which is
     * what stops the cells flashing white while the timeline is scrubbed. */
    const shape = [arch, shown.join(',')].join('|');
    if (shape === attnKey && $$('.wvcam.gc', host).length === shown.length) {
      $$('.wvcam.gc', host).forEach((cell, i) => {
        const name = shown[i];
        swap($('.wvunder', cell), `assets/webviz/cam/${frame.sampleToken}/${name}.webp`);
        swap($('.wvover', cell), gcSrc(frame.sampleToken, name));
        $('.wvover', cell).style.opacity = String(fade);
      });
      return;
    }
    attnKey = shape;
    host.innerHTML = '';
    cams = [];
    host.className = 'wvcams attn' + (shown.length === 1 ? ' focus' : '');
    const exp = inArch().find(e => (imgSlot === 'paver') === !!e.ours) || inArch()[0];
    shown.forEach(name => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'wvcam gc';
      const pretty = name.replace('CAM_', '');
      cell.title = shown.length === 1 ? 'Back to all six cameras' : `Enlarge ${pretty}`;
      const under = document.createElement('img');
      under.className = 'wvunder';
      under.src = `assets/webviz/cam/${frame.sampleToken}/${name}.webp`;
      under.alt = '';
      under.draggable = false;
      const over = document.createElement('img');
      over.className = 'wvover';
      over.src = gcSrc(frame.sampleToken, name);
      over.style.opacity = String(fade);
      over.draggable = false;
      over.alt = `BEV attribution for ${exp ? exp.name : imgSlot} on the ` +
                 `${pretty.replace(/_/g, ' ').toLowerCase()} camera`;
      onImgError(over);
      const tag = document.createElement('span');
      tag.className = 'wvcamname';
      tag.textContent = pretty;
      cell.append(under, over, tag);
      cell.addEventListener('click', () => {
        focus = shown.length === 1 ? null : name;
        setParam('fc', focus || '');
        buildAttn();
      });
      host.appendChild(cell);
    });
  }

  /* the surround view: six cameras with the model's boxes projected onto them */
  function buildCams() {
    if (camMode === 'attn') return buildAttn();
    const host = $('#wvCams');
    host.innerHTML = '';
    host.className = 'wvcams';
    cams = [];
    const order = (manifest.cameraOrder || []);
    if (!order.length || !frame) return;
    order.forEach(name => {
      const cell = document.createElement('div');
      cell.className = 'wvcam';
      const cv = document.createElement('canvas');
      cv.className = 'wvcamcv';
      cv.setAttribute('role', 'img');
      const tag = document.createElement('span');
      tag.className = 'wvcamname';
      /* the sensor name is an implementation detail; the reader wants the view */
      tag.textContent = name.replace('CAM_', '').replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, ch => ch.toUpperCase());
      cell.append(cv, tag);
      host.appendChild(cell);
      const view = { name, canvas: cv, hits: [] };
      cams.push(view);
      /* hovering a camera box highlights the same object in the 3D panes */
      cv.addEventListener('pointermove', e => {
        const r = cv.getBoundingClientRect();
        const x = (e.clientX - r.left), y = (e.clientY - r.top);
        const u = view.hits.filter(hb => x >= hb.x0 && x <= hb.x1 && y >= hb.y0 && y <= hb.y1)
                           .sort((p, q) => p.d - q.d)[0];
        const id = u ? u.id : null;
        if (id !== hover) { hover = id; draw(); }
      });
      cv.addEventListener('pointerleave', () => { if (hover) { hover = null; draw(); } });
    });
    /* a freshly built strip is blank until it is painted, which is what coming
     * back from the attention layer used to leave behind */
    drawCams();
  }

  /* The images carry one model at a time: two sets of boxes over one image
   * would be unreadable, and the panes below already show both. */
  function camModel() {
    const pair = inArch();
    if (!pair.length) return manifest.experiments[0].id;
    return (pair.find(e => (imgSlot === 'paver') === !!e.ours) || pair[0]).id;
  }

  function drawCams() {
    if (camMode === 'attn') { buildAttn(); return; }
    if (!frame || !cams.length) return;
    const byName = {};
    frame.cameras.forEach(c => (byName[c.name] = c));
    const model = camModel();
    cams.forEach(v => {
      const cm = byName[v.name];
      if (!cm) return;
      const im = cm.image ? image('assets/webviz/' + cm.image, 0) : null;
      const src = manifest.experiments.find(e => e.id === model);
      v.canvas.setAttribute('aria-label',
        `${v.name.replace('CAM_', '').replace(/_/g, ' ').toLowerCase()} with ` +
        `${src ? src.name : model} boxes and its planned trajectory projected onto it`);
      const hits = WV.renderCam(v.canvas, im, frame, cm, model, { layers, score, hover });
      /* null means the photograph was not ready and nothing was repainted */
      if (hits) v.hits = hits;
      if (im && !im.complete) im.addEventListener('load', () => drawCams(), { once: true });
    });
  }
  let camKey = getParam('wc', 'behind');
  let cam = { ...WV.PRESETS[camKey] };
  let score = 0.3, hover = null, views = [];

  const ink = () => (document.documentElement.dataset.theme === 'light' ? '#0e1116' : '#f4f5f7');

  /* ── space bar ───────────────────────────────────────────────────────────
   * While any part of the viewer is on screen, space toggles playback and the
   * page never scrolls. Registered before the data loads, so a slow or failed
   * fetch cannot leave the key unbound, and visibility is measured at the key
   * press because a card taller than the viewport never reaches a high
   * intersection ratio. Only a text field keeps space for itself. */
  const onScreen = () => {
    const r = card.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  };
  addEventListener('keydown', e => {
    if (e.key !== ' ' && e.code !== 'Space' && e.keyCode !== 32) return;
    const el = e.target && e.target.nodeType === 1 ? e.target : document.body;
    if (el.matches && el.matches('input[type="search"], input[type="text"], textarea, [contenteditable]')) return;
    if (!onScreen()) return;
    /* the default is always cancelled: no scroll, and no second toggle from a
     * focused play button being activated by the same key */
    e.preventDefault();
    e.stopPropagation();
    setPlaying(!playing);
  }, { capture: true });

  /* playback stops as soon as the viewer scrolls away */
  new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting && playing) setPlaying(false);
  }), { threshold: 0 }).observe(card);

  function draw() {
    if (!frame || !manifest) return;
    drawCams();
    views.forEach(v => {
      v.hits = WV.render(v.canvas, frame, v.model, {
        cam, ink: ink(), view: manifest.viewportMeters.xMax,
        pc: manifest.pointCloudRange, layers, score,
        ours: !!v.ours, hover
      });
    });
  }

  const archs = () => [...new Set(manifest.experiments.map(e => e.arch || e.name))];
  const inArch = () => manifest.experiments.filter(e => (e.arch || e.name) === arch);

  /* the pair for the selected architecture, baseline first */
  function build() {
    stage.innerHTML = '';
    views = [];
    const shown = inArch();
    stage.classList.toggle('two', shown.length > 1);
    shown.forEach(e => {
      const box = document.createElement('div');
      box.className = 'wvpane' + (e.ours ? ' ours' : '');
      const head = document.createElement('div');
      head.className = 'wvhead';
      head.innerHTML = `<span class="wvname">${e.name}</span>` +
        `<span class="wvmetrics"><span class="wvl2"></span><span class="wvcol"></span></span>`;
      const canvas = document.createElement('canvas');
      canvas.className = 'wvcanvas';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label',
        `${e.name}: predicted 3D boxes, vector map and planned trajectory for this frame`);
      const tag = document.createElement('span');
      tag.className = 'wvtag';
      /* filled at runtime, so it is an empty unlabelled element until then */
      tag.setAttribute('role', 'status');
      tag.setAttribute('aria-live', 'polite');
      box.append(head, canvas, tag);
      stage.appendChild(box);
      const view = { model: e.id, ours: e.ours, canvas, tag, hits: [] };
      views.push(view);
      bindPointer(view);
    });
    paintMetrics();
    draw();
  }

  /* orbit, zoom and hover on one canvas, applied to every canvas at once */
  function bindPointer(v) {
    const cv = v.canvas;
    let drag = null;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => {
      /* right button, middle button or shift pans; the left button orbits */
      const pan = e.button === 2 || e.button === 1 || e.shiftKey;
      drag = { x: e.clientX, y: e.clientY, az: cam.az, el: cam.el, pan,
               tx: cam.tx, ty: cam.ty, tz: cam.tz };
      cv.setPointerCapture(e.pointerId);
      cv.classList.add(pan ? 'panning' : 'grabbing');
      e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
      if (drag && drag.pan) {
        /* drag the target across the screen plane, one metre per screen metre */
        const k = 2 * Math.tan(30 * Math.PI / 180) * cam.dist / cv.clientHeight;
        const dx = -(e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k;
        const ce = Math.cos(cam.el), se = Math.sin(cam.el);
        const f = [-ce * Math.sin(cam.az), -se, -ce * Math.cos(cam.az)];
        let r = [-f[2], 0, f[0]];
        const rl = Math.hypot(r[0], r[2]) || 1;
        r = [r[0] / rl, 0, r[2] / rl];
        const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2],
                   r[0] * f[1] - r[1] * f[0]];
        cam.tx = drag.tx + r[0] * dx + u[0] * dy;
        cam.ty = drag.ty + r[1] * dx + u[1] * dy;
        cam.tz = drag.tz + r[2] * dx + u[2] * dy;
        markCam(null);
        draw();
        return;
      }
      if (drag) {
        cam.az = drag.az - (e.clientX - drag.x) * 0.006;
        cam.el = Math.max(0.05, Math.min(1.5, drag.el + (e.clientY - drag.y) * 0.005));
        markCam(null);
        draw();
        return;
      }
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const under = v.hits.filter(hb => x >= hb.x0 && x <= hb.x1 && y >= hb.y0 && y <= hb.y1)
                          .sort((p, q) => p.d - q.d)[0];
      const id = under ? under.id : null;
      if (id !== hover) { hover = id; draw(); }
      if (under) {
        v.tag.textContent =
          `${under.g.cls.replace(/_/g, ' ')} · score ${under.g.score.toFixed(2)} · ` +
          `${under.g.wlh[1].toFixed(1)}×${under.g.wlh[0].toFixed(1)} m · ` +
          `${Math.hypot(under.g.c[0], under.g.c[1]).toFixed(1)} m away`;
        v.tag.classList.add('on');
      } else v.tag.classList.remove('on');
    });
    const stop = () => { drag = null; cv.classList.remove('grabbing', 'panning'); };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);
    cv.addEventListener('pointerleave', () => {
      stop();
      v.tag.classList.remove('on');
      if (hover) { hover = null; draw(); }
    });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      cam.dist = Math.max(18, Math.min(150, cam.dist * (e.deltaY > 0 ? 1.09 : 0.92)));
      draw();
    }, { passive: false });
    cv.addEventListener('dblclick', () => { cam = { ...WV.PRESETS[camKey] }; draw(); });
  }

  function markCam(key) {
    $$('#wvCam button').forEach(b => {
      const on = key != null && b.dataset.k === key;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    moveThumb($('#wvCam'));
  }

  function legend() {
    const cls = new Set();
    Object.values(frame.models).forEach(m => m.det.forEach(d => cls.add(d.cls)));
    const mapCls = new Set();
    Object.values(frame.models).forEach(m => m.map.forEach(v => mapCls.add(v.cls)));
    const chip = (col, txt, dash) =>
      `<span class="wvkey"><i style="background:${dash ? 'none' : col};` +
      `${dash ? `border-top:2px dashed ${col};height:0` : ''}"></i>${txt}</span>`;
    $('#wvLegend').innerHTML =
      [...cls].sort().map(c => chip(WV.CLS[c] || '#9ca3af', c.replace(/_/g, ' '))).join('') +
      [...mapCls].sort().map(c => chip(WV.MAP_CLS[c], WV.MAP_NAME[c] || c, c === 'divider')).join('') +
      `<span class="wvkey"><i class="ramp"></i>Planned trajectory</span>` +
      chip(ink(), 'Recorded future', true) + chip(WV.EGO, 'Ego vehicle');
  }

  async function fetchFrame(token) {
    if (cache.has(token)) return cache.get(token);
    const st = document.getElementById('wvStage');
    if (st) st.setAttribute('aria-busy', 'true');
    const p = fetch(`assets/webviz/frames/${token}.json`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { clearViewerBusy(); return d; })
      .catch(err => { showViewerError(`Scene data could not be loaded (${err.message}).`); throw err; });
    cache.set(token, p);
    return p;
  }

  /* Per-pane live metrics. Both come from the native VAD evaluator: the
   * planning L2 for this frame, and `plan_obj_box_col` averaged over 1, 2 and
   * 3 s, so any value above zero means the planned ego box overlapped a
   * vehicle or pedestrian occupancy cell at some horizon. Frames outside the
   * evaluator's 5,119-frame planning population report neither. */
  const l2of = m => (m ? (m.l2Eval != null ? m.l2Eval : m.l2) : null);

  /* Written for the pair at once. The highlight marks pretraining winning this
   * frame and nothing else: if the baseline has the lower planning L2, neither
   * number is highlighted. A counted collision is called out on its own pane. */
  function paintMetrics() {
    if (!frame) return;
    const vals = views.map(v => l2of(frame.models[v.model]));
    const iOurs = views.findIndex(v => v.ours);
    const iBase = views.findIndex(v => !v.ours);
    const paverWins = iOurs >= 0 && iBase >= 0 &&
      vals[iOurs] != null && vals[iBase] != null &&
      vals[iBase] - vals[iOurs] > 0.005;
    views.forEach((v, i) => {
      const host = v.canvas.parentElement;
      const l2 = $('.wvl2', host), col = $('.wvcol', host);
      const m = frame.models[v.model];
      if (!l2 || !col) return;
      const val = vals[i];
      const scored = m && m.boxCol != null;
      const why = 'this frame has no recorded 3 s future, so the evaluator ' +
                  'reports neither planning L2 nor a box collision for it';
      l2.textContent = val == null ? 'L2 —' : `L2 ${val.toFixed(2)} m`;
      l2.className = 'wvl2' + (paverWins && i === iOurs ? ' win' : '') +
                     (val == null ? ' none' : '');
      l2.title = val == null ? why : '';
      if (!scored) {
        col.textContent = 'Collision not scored';
        col.className = 'wvcol none';
        col.title = why;
        return;
      }
      const hit = m.boxCol > 0;
      col.textContent = hit ? 'Collision' : 'No collision';
      col.className = 'wvcol ' + (hit ? 'hit' : 'clear');
      col.title = '';
    });
  }

  /* the transport: a filled rail, one tick per keyframe, and a knob */
  function clock() {
    const hz = manifest.frameRateHz || 2;
    const n = clip ? clip.tokens.length : 0;
    const t = n > 1 ? at / (n - 1) : 0;
    $('#wvNow').textContent = (at / hz).toFixed(1);
    $('#wvDur').textContent = ((n - 1) / hz).toFixed(1);
    $('#wvFill').style.width = (t * 100) + '%';
    $('#wvKnob').style.left = (t * 100) + '%';
    const track = $('#wvTrack');
    track.setAttribute('aria-valuemax', String(Math.max(0, n - 1)));
    track.setAttribute('aria-valuenow', String(at));
    track.setAttribute('aria-valuetext',
      `frame ${at + 1} of ${n}, ${(at / hz).toFixed(1)} seconds`);
  }


  /* the clip advances at the capture rate times the chosen speed, and always
   * wraps: a clip that stopped at its last frame would just look broken */
  function tick() {
    if (!playing || !clip) return;
    const hz = (manifest.frameRateHz || 2) * speed;
    timer = setTimeout(async () => {
      if (!playing) return;
      await show((at + 1) % clip.tokens.length);
      tick();
    }, 1000 / hz);
  }
  function setPlaying(on) {
    playing = on;
    clearTimeout(timer);
    const b = $('#wvPlay');
    b.setAttribute('aria-label', on ? 'Pause' : 'Play');
    b.classList.toggle('playing', on);
    if (on) tick();
  }

  async function show(i) {
    at = Math.max(0, Math.min(clip.tokens.length - 1, i));
    prioritise();
    frame = await fetchFrame(clip.tokens[at]);
    /* whatever this frame needs is fetched ahead of everything queued */
    (frame.cameras || []).forEach(c => { if (c.image) image('assets/webviz/' + c.image, 0); });
    paintMetrics();
    clock();
    draw();
  }

  async function load(token, push) {
    const rows = manifest.clips || manifest.frames;
    const row = rows.find(f => f.token === token) || rows[0];
    clip = row;
    setPlaying(false);
    at = row.centre || 0;
    try {
      frame = await fetchFrame(row.tokens[at]);
    } catch (e) {
      stage.innerHTML = '<p class="empty">This clip could not be loaded.</p>';
      return;
    }
    /* warm the rest of the clip in the background, nearest frames first */
    row.tokens.forEach((t, i) => fetchFrame(t).then(f => {
      (f.cameras || []).forEach(c => {
        if (c.image) image('assets/webviz/' + c.image, Math.abs(i - at) * 10);
      });
    }));
    buildCams();
    clock();
    build();
    legend();
    if (push) setParam('wf', row.token);
  }

  (async function init() {
    try {
      try {
        manifest = await (await fetch('assets/webviz/manifest.json',
        { cache: 'no-store' })).json();
      } catch (err) {
        showViewerError('The visualizer manifest could not be loaded.');
        return;
      }
    } catch (e) {
      card.hidden = true;
      return;
    }
    const seen = new Map();
    /* scenes carry a number, so the list reads in order rather than in the
     * order the export happened to write them */
    const source = manifest.clips || manifest.frames;
    /* the list reads in scene order, but the scene that opens first is the one
     * the export put first, which is chosen to show the difference the section
     * describes; sorting the list must not silently reselect it */
    const opening = source[0];
    const rows = source.slice().sort((a, b) => {
      const num = f => {
        const m = /(\d+)/.exec(f.sceneName || '');
        return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
      };
      return num(a) - num(b) || String(a.sceneName || '').localeCompare(String(b.sceneName || ''));
    });
    sel.innerHTML = rows.map(f => {
      const base = f.sceneName || `scene ${f.scene.slice(0, 8)}`;
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      return `<option value="${f.token}">${base}${n > 1 ? ` (${n})` : ''}</option>`;
    }).join('');
    const first = rows.find(f => f.token === getParam('wf', '')) || opening;
    sel.value = first.token;
    enhanceSelect(sel);
    sel.addEventListener('change', () => load(sel.value, true));

    if (!archs().includes(arch)) arch = archs()[0];

    const asel = $('#wvArchSel');
    asel.innerHTML = archs().map(x => `<option value="${x}">${x}</option>`).join('');
    asel.value = arch;
    enhanceSelect(asel);
    asel.addEventListener('change', () => {
      arch = asel.value;
      setParam('wa', arch);
      modeBar();
      imgModelBar();
      build();
      buildCams();
    });

    /* Grad-CAM exists only for a pair with a verified complete run, so the mode
     * is offered where it is real and disabled with a reason where it is not. */
    function modeBar() {
      const gc = gcOf();
      const bar = $('#wvMode');
      chipTabs(bar, [['pred', 'Detections'], ['attn', 'Grad-CAM']], (k, push) => {
        if (k === 'attn' && !gcOf()) return;
        camMode = k;
        if (k === 'attn') setPlaying(false);
        markTabs(bar, camMode);
        $('#wvAttn').hidden = camMode !== 'attn';
        buildCams();
        if (push) setParam('cm2', k);
      });
      const attn = $$('button', bar).find(b => b.dataset.k === 'attn');
      /* a title attribute is invisible to touch and to the keyboard, so the
         reason is written next to the control as well */
      const reason = (manifest.gradcam && manifest.gradcam.architectures[arch] || {}).reason ||
        'no verified complete run';
      if (attn) {
        attn.disabled = !gc;
        attn.title = gc ? 'Heat map of the BEV embedding, drawn over the image'
          : `Grad-CAM is not available for ${arch}: ${reason}`;
      }
      /* a reason that lives only in a tooltip is a reason nobody reads */
      let note = $('#wvModeNote');
      if (!note) {
        note = document.createElement('span');
        note.id = 'wvModeNote';
        note.className = 'wvnote';
        bar.parentNode.appendChild(note);
      }
      note.textContent = gc ? '' : `Grad-CAM unavailable for ${arch}: ${reason}`;
      note.hidden = !!gc;
      if (camMode === 'attn' && !gc) camMode = 'pred';
      markTabs(bar, camMode);
      $('#wvAttn').hidden = camMode !== 'attn';
    }
    modeBar();

    /* one model at a time, whichever layer is showing */
    function imgModelBar() {
      const box = $('#wvImgModel');
      chipTabs(box, inArch().map(e => [e.ours ? 'paver' : 'base', e.name]), (k, push) => {
        imgSlot = k;
        markTabs(box, k);
        buildCams();
        if (push) setParam('as', k);
      });
      markTabs(box, imgSlot);
    }
    imgModelBar();

    const fadeIn = $('#wvFade');
    fadeIn.addEventListener('input', () => {
      fade = parseInt(fadeIn.value, 10) / 100;
      $('#wvFadeVal').textContent = fadeIn.value + '%';
      $$('#wvCams .wvover').forEach(im => (im.style.opacity = String(fade)));
    });

    chipTabs($('#wvCam'), CAMS, (k, push) => {
      camKey = k;
      cam = { ...WV.PRESETS[k] };
      markTabs($('#wvCam'), k);
      draw();
      if (push) setParam('wc', k);
    });
    markTabs($('#wvCam'), camKey);

    $('#wvLayers').innerHTML = LAYERS.map(([k, label, on]) =>
      `<label class="wvsw"><input type="checkbox" role="switch" data-layer="${k}"` +
      `${on ? ' checked' : ''}><span class="tr" aria-hidden="true"></span>` +
      `<span class="lb">${label}</span></label>`).join('');
    $$('#wvLayers input').forEach(cb => cb.addEventListener('change', () => {
      layers[cb.dataset.layer] = cb.checked;
      draw();
    }));

    const sc = $('#wvScore');
    sc.addEventListener('input', () => {
      score = parseFloat(sc.value);
      $('#wvScoreVal').textContent = score.toFixed(2);
      draw();
    });

    $('#wvPlay').addEventListener('click', () => setPlaying(!playing));

    if (!SPEEDS.includes(speed)) speed = 1;
    const sp = $('#wvSpeed');
    sp.innerHTML = SPEEDS.map(v =>
      `<button type="button" data-speed="${v}" aria-pressed="${v === speed}">${v}&times;</button>`).join('');
    sp.addEventListener('click', e => {
      const b = e.target.closest('button[data-speed]');
      if (!b) return;
      speed = parseFloat(b.dataset.speed);
      $$('button', sp).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      setParam('ws', String(speed));
      /* restart the timer so a speed change takes effect immediately */
      if (playing) { clearTimeout(timer); tick(); }
    });

    /* scrubbing: press anywhere on the rail, then drag */
    const track = $('#wvTrack');
    const seek = e => {
      const r = track.getBoundingClientRect();
      const n = clip ? clip.tokens.length : 1;
      const t = Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1)));
      show(Math.round(t * (n - 1)));
    };
    let scrub = false;
    track.addEventListener('pointerdown', e => {
      scrub = true;
      track.setPointerCapture(e.pointerId);
      track.classList.add('scrubbing');
      setPlaying(false);
      seek(e);
    });
    track.addEventListener('pointermove', e => { if (scrub) seek(e); });
    const endScrub = () => { scrub = false; track.classList.remove('scrubbing'); };
    track.addEventListener('pointerup', endScrub);
    track.addEventListener('pointercancel', endScrub);
    track.addEventListener('keydown', e => {
      const n = clip ? clip.tokens.length : 1;
      const map = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: n - 1,
                    PageDown: at - 5, PageUp: at + 5 };
      if (!(e.key in map)) return;
      e.preventDefault();
      setPlaying(false);
      show(map[e.key]);
    });
    addEventListener('keydown', e => {
      if (e.key !== 'Escape' || camMode !== 'attn' || !focus) return;
      focus = null;
      setParam('fc', '');
      buildAttn();
    });
    addEventListener('resize', draw);
    new MutationObserver(() => { legend(); draw(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    await load(first.token, false);
  })();
})();

/* ── sortable tables ──────────────────────────────────────────────────────
 * Every column name becomes a sort control. A comparison table is read by
 * ranking one column, and doing that by eye across twenty rows is the part
 * readers were doing manually.
 * Rows keep their identity: the row header travels with its cells, and the
 * "ours" tint and per-family rules follow the row rather than the position.
 */
/* A header cell is a header for the cells beside or beneath it whether or not the
   table is long enough to be worth sorting, so this runs on every table. Cells
   that are genuinely empty spacers in a category row are left alone. */
/* 45: a button with no type is a submit button, which is only harmless while
   nothing on the page is a form. */
function typeButtons(scope) {
  $$('button:not([type])', scope || document).forEach(b => b.type = 'button');
}
addEventListener('DOMContentLoaded', () => typeButtons());

function labelHeaderCells(scope) {
  $$('table', scope || document).forEach(table => {
    $$('th', table).forEach(th => {
      if (th.hasAttribute('scope') || !th.textContent.trim()) return;
      th.setAttribute('scope', th.parentNode.parentNode.tagName === 'THEAD' ? 'col' : 'row');
    });
  });
}

/* Not one of the sixteen tables carried an id, so the sort a link asked for
   could never be matched to a table. Derive a stable one from the nearest
   identified ancestor, falling back to document order. */
let tableSeq = 0;
function identifyTables(scope) {
  $$('table', scope || document).forEach(table => {
    if (table.id) return;
    const holder = table.closest('[id]');
    /* one container can hold two tables, so the holder's id alone is not unique */
    let base = holder ? `${holder.id}--table` : `table-${++tableSeq}`;
    let id = base, n = 1;
    while (document.getElementById(id)) id = `${base}-${++n}`;
    table.id = id;
  });
}

function sortableTables(scope) {
  labelHeaderCells(scope);
  typeButtons(scope);
  identifyTables(scope);
  $$('table', scope || document).forEach(table => {
    if (table.dataset.sortable) return;
    const head = table.tHead && table.tHead.rows[table.tHead.rows.length - 1];
    const body = table.tBodies[0];
    if (!head || !body || body.rows.length < 3) return;
    table.dataset.sortable = '1';

    /* the original order is a deliberate grouping, so it stays reachable */
    const original = [...body.rows];

    /* the table says how many rows it holds and how it is currently ordered,
       because aria-sort is invisible and the caret alone does not say "click
       again to reverse, a third time to restore" */
    /* 30: a filter beats scrolling a nineteen-row table for one configuration */
    const tools = document.createElement('div');
    tools.className = 'ttools';
    const filter = document.createElement('input');
    filter.type = 'search';
    filter.className = 'tfilter';
    filter.placeholder = 'Filter rows';
    filter.setAttribute('aria-label', 'Filter table rows');
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      let shown = 0;
      original.forEach(row => {
        const hit = !q || row.textContent.toLowerCase().includes(q);
        row.hidden = !hit;
        if (hit) shown++;
      });
      status.textContent = q ? `${shown} of ${original.length} rows match “${filter.value}”`
                             : rest();
    });
    tools.appendChild(filter);
    if (table.querySelector('tr.ours')) {
      const key = document.createElement('span');
      key.className = 'tkey';
      key.textContent = 'Tinted row: pretrained with PAVER';
      tools.appendChild(key);
    }

    const status = document.createElement('p');
    status.className = 'tstate';
    const wrap = table.closest('.scroller') || table;
    const rest = () => `${original.length} rows \u00b7 click a column name to sort`;
    status.textContent = rest();
    if (wrap.parentNode) { wrap.parentNode.insertBefore(tools, wrap);
                           wrap.parentNode.insertBefore(status, wrap); }

    const cellText = (row, index) => {
      const cells = [...row.cells];
      const cell = cells[index];
      return cell ? cell.textContent.trim() : '';
    };
    /* a value column may hold "0.51", "58.79", "n/a" or "--"; missing values
       sort last in both directions rather than pretending to be zero */
    const parse = text => {
      const cleaned = text.replace(/−/g, '-').replace(/[^\d.\-]/g, '');
      const value = parseFloat(cleaned);
      return Number.isFinite(value) && /\d/.test(text) ? value : null;
    };

    [...head.cells].forEach((th, index) => {
      if (!th.textContent.trim()) return;
      th.tabIndex = 0;
      th.setAttribute('role', 'columnheader');
      th.setAttribute('aria-sort', 'none');
      th.classList.add('sortable');
      /* every header used to carry the same sentence, which told a reader
         hovering one column nothing about that column */
      const name = th.textContent.replace(/[\u2191\u2193\u2195]/g, '').trim();
      th.title = `Sort by ${name || 'this column'}`;
      /* a column header is a header for the cells beneath it, and most of these
         were missing that relationship entirely */
      if (!th.hasAttribute('scope')) th.setAttribute('scope', 'col');

      const apply = (silent) => {
        const state = th.getAttribute('aria-sort');
        const next = state === 'none' ? 'descending'
                   : state === 'descending' ? 'ascending' : 'none';
        [...head.cells].forEach(other => {
          other.setAttribute('aria-sort', 'none');
          other.classList.remove('sorted');
        });
        th.setAttribute('aria-sort', next);

        /* sorting reorders rows under the reader; without this the viewport
           jumps to wherever the table happens to be after the reflow */
        const keepTop = wrap.scrollTop, keepLeft = wrap.scrollLeft;
        const restore = () => { wrap.scrollTop = keepTop; wrap.scrollLeft = keepLeft; };
        if (next === 'none') {
          original.forEach(row => body.appendChild(row));
          status.textContent = rest();
          announce('Original row order restored');
          restore();
          return;
        }
        th.classList.add('sorted');
        const direction = next === 'ascending' ? 1 : -1;
        const rows = [...body.rows];
        const numeric = rows.every(row => {
          const text = cellText(row, index);
          return !text || parse(text) !== null;
        });
        rows.sort((a, b) => {
          const ta = cellText(a, index), tb = cellText(b, index);
          if (numeric) {
            const va = parse(ta), vb = parse(tb);
            if (va === null && vb === null) return 0;
            if (va === null) return 1;          /* blanks last, always */
            if (vb === null) return -1;
            return (va - vb) * direction;
          }
          return ta.localeCompare(tb, undefined, { numeric: true }) * direction;
        });
        rows.forEach(row => body.appendChild(row));
        const label = th.textContent.replace(/[\u2191\u2193\u2195]/g, '').trim();
        if (table.id && !silent) setParam('sort', `${table.id}:${index}:${next[0]}`);
        const visible = original.filter(r => !r.hidden).length;
        const scope = visible === original.length
          ? `${original.length} rows`
          : `${visible} of ${original.length} rows`;
        status.textContent = `${scope} \u00b7 sorted by ${label}, ` +
          `${next === 'ascending' ? 'lowest first' : 'highest first'} \u00b7 ` +
          `click again to ${next === 'ascending' ? 'restore the original order' : 'reverse'}`;
        announce(`Sorted by ${label}, ${next}`);
        restore();
      };

      th.addEventListener('click', apply);
      /* the URL carried a sort that nothing ever restored, so a shared link
         opened in the authored order while claiming otherwise */
      const want = getParam('sort', '');
      if (want && table.id) {
        const [wid, widx, wdir] = want.split(':');
        if (wid === table.id && Number(widx) === index) {
          const steps = wdir === 'd' ? 1 : 2;          /* descending, then ascending */
          for (let s = 0; s < steps; s++) apply(true);
        }
      }
      th.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(); }
      });
    });
  });
}
sortableTables();
/* the manifest-driven sections build their tables after this module runs */
addEventListener('load', () => sortableTables());
/* tables also arrive later: the supplement group, the route table and anything a
   pane reveals. One observer covers every future insertion. */
new MutationObserver(records => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.matches('table') || node.querySelector('table')) {
        sortableTables(node.matches('table') ? node.parentNode : node);
      }
    }
  }
}).observe(document.body, { childList: true, subtree: true });

/* ── nuScenes qualitative clips ───────────────────────────────────────────
 * One card: the shared scenes and the per-architecture ten are the same clip in
 * the same layout, so splitting them into two players made the reader learn the
 * control twice. Picking an architecture rebuilds the scene list; the three
 * shared scenes lead it and are marked.
 */
(function qualVideos() {
  const COMMON = [
    ['0556', 'Left turn across oncoming traffic, with a pedestrian in the crossing.'],
    ['0345', 'Right turn past a work zone, with a scooter and cones in the lane.'],
    ['0905', 'Rain, a pedestrian crossing ahead, a truck alongside and a work zone.']
  ];
  const ARCH = [['vad_tiny', 'VAD-Tiny'], ['vad_base', 'VAD-Base'], ['genad', 'GenAD']];
  const RATES = [['0.25', '0.25\u00d7'], ['0.5', '0.5\u00d7'], ['1', '1\u00d7']];
  const TOP = {
    vad_tiny: ['0559','0556','0330','0093','0780','1065','1073','0278','0103','0097'],
    vad_base: ['0556','0559','0924','0562','0916','0093','0780','0106','0910','0345'],
    genad:    ['1073','0922','0905','0917','0904','1071','0105','0967','0330','0345']
  };
  const NAME = Object.fromEntries(ARCH);
  const NOTE = Object.fromEntries(COMMON);
  const commonIds = COMMON.map(c => c[0]);
  const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const srcFor = (arch, id) => commonIds.includes(id) && !TOP[arch].includes(id)
    ? `assets/qualvid/common/scene-${id}/${arch}.mp4`
    : (TOP[arch].includes(id) ? `assets/qualvid/top10/${arch}/scene-${id}.mp4`
                              : `assets/qualvid/common/scene-${id}/${arch}.mp4`);

  const stage = $('#qvStage'), sel = $('#qvSceneSel'), archBar = $('#qvArch');
  const note = $('#qvSceneNote'), play = $('#qvPlay'), track = $('#qvTrack');
  const fill = $('#qvFill'), knob = $('#qvKnob'), now = $('#qvNow'), dur = $('#qvDur');
  const speed = $('#qvSpeed');
  if (!stage || !sel || !archBar) return;

  let arch = getParam('arch-clip', 'vad_tiny');  if (!NAME[arch]) arch = 'vad_tiny';
  let scene = getParam('scene', commonIds[0]);
  let rate = parseFloat(getParam('clip-speed', '0.5')) || 0.5;
  let video = null;

  const scenes = () => commonIds.concat(TOP[arch].filter(s => !commonIds.includes(s)));

  const paint = () => {
    if (!video || !video.duration) return;
    const pct = video.currentTime / video.duration;
    fill.style.width = knob.style.left = (pct * 100).toFixed(2) + '%';
    now.textContent = clock(video.currentTime);
    dur.textContent = clock(video.duration);
    track.setAttribute('aria-valuenow', Math.round(pct * 100));
  };
  const seek = pct => {
    if (video && video.duration) video.currentTime = Math.max(0, Math.min(1, pct)) * video.duration;
    paint();
  };
  play.addEventListener('click', () => {
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  });
  const fromEvent = e => {
    const b = track.getBoundingClientRect();
    seek((e.clientX - b.left) / b.width);
  };
  track.addEventListener('pointerdown', e => {
    track.setPointerCapture(e.pointerId); fromEvent(e);
    const move = ev => fromEvent(ev);
    const up = () => { track.removeEventListener('pointermove', move);
                       track.removeEventListener('pointerup', up); };
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
  });
  track.addEventListener('keydown', e => {
    if (!video || !video.duration) return;
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === 'ArrowRight') { e.preventDefault(); seek(video.currentTime / video.duration + step); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); seek(video.currentTime / video.duration - step); }
    if (e.key === 'Home') { e.preventDefault(); seek(0); }
    if (e.key === 'End')  { e.preventDefault(); seek(0.999); }
    if (e.key === ' ')    { e.preventDefault(); play.click(); }
  });
  chipTabs(speed, RATES, (k, push) => {
    rate = parseFloat(k);
    if (video) video.playbackRate = rate;
    markTabs(speed, k);
    if (push) setParam('clip-speed', k);
  });
  markTabs(speed, String(rate));

  function draw(push, keepTime) {
    const at = keepTime && video && video.duration ? video.currentTime : 0;
    const wasPlaying = keepTime && video && !video.paused;
    const list = scenes();
    if (!list.includes(scene)) scene = list[0];
    const shared = list.filter(s => commonIds.includes(s));
    const own = list.filter(s => !commonIds.includes(s));
    const opts = g => g.map(s => `<option value="${s}">Scene ${s}</option>`).join('');
    sel.innerHTML =
      `<optgroup label="Shared by all three">${opts(shared)}</optgroup>` +
      (own.length ? `<optgroup label="${NAME[arch]} gains most">${opts(own)}</optgroup>` : '');
    sel.value = scene;
    markTabs(archBar, arch);
    note.textContent = NOTE[scene] ||
      `One of the ten validation scenes where ${NAME[arch]} gains most from PAVER.`;
    stage.dataset.state = 'loading';
    const src = srcFor(arch, scene);
    stage.innerHTML = `<video playsinline muted loop preload="metadata"
      poster="${src.replace('.mp4', '.jpg')}" preload="none"
      aria-label="${NAME[arch]} on nuScenes scene ${scene}"></video>`;
    video = $('video', stage);
    video.src = src;
    video.playbackRate = rate;
    play.classList.remove('playing');
    video.addEventListener('loadedmetadata', () => {
      stage.dataset.state = 'ready';
      video.playbackRate = rate;
      /* the same instant of the same scene under another architecture is the
         comparison this card exists for, so the position survives the switch */
      if (at) video.currentTime = Math.min(at, video.duration - 0.05);
      if (wasPlaying) video.play();
      paint();
    }, { once: true });
    video.addEventListener('error', () => { stage.dataset.state = 'failed'; }, { once: true });
    video.addEventListener('timeupdate', paint);
    video.addEventListener('play',  () => play.classList.add('playing'));
    video.addEventListener('pause', () => play.classList.remove('playing'));
    video.addEventListener('ended', () => play.classList.remove('playing'));

    if (push) { setParam('arch-clip', arch); setParam('scene', scene); }
  }

  /* 27: a failed clip can be asked for again. Registered once — stage survives
     every draw, so putting this inside draw() stacked a listener per switch. */
  stage.addEventListener('click', () => {
    if (stage.dataset.state === 'failed') draw(false);
  });
  chipTabs(archBar, ARCH, (k, push) => { arch = k; draw(push, true); });
  sel.addEventListener('change', () => { scene = sel.value; draw(true); });
  const step = delta => {
    const list = scenes();
    scene = list[(list.indexOf(scene) + delta + list.length) % list.length];
    draw(true);
    announce(`Scene ${scene}`);
  };
  $('#qvScenePrev').addEventListener('click', () => step(-1));
  $('#qvSceneNext').addEventListener('click', () => step(1));
  draw(false);
})();
