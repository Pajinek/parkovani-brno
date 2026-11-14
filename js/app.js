(function () {
  'use strict';

  const D = window.MAP_DATA;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);

  const svg = $('map');
  const world = $('world');
  const tip = $('tip');
  const panel = $('panel');

  // ---------------------------------------------------------------- pomocné
  function mk(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const group = (id) => mk('g', { id }, world);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nf = new Intl.NumberFormat('cs-CZ');
  const kf = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const km2 = (m2) => kf.format(m2 / 1e6);
  const plural = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
  const collator = new Intl.Collator('cs', { numeric: true });

  // ---------------------------------------------------------------- konstanty
  const ZONES = {
    A: {
      title: 'Zóna A – historické centrum',
      text: 'Oblast 1-01. Parkovat smí jen držitelé dlouhodobého oprávnění, krátkodobé nelze koupit. Plošný zákaz vjezdu hlídají kamery.',
    },
    B: {
      title: 'Zóna B – prstenec kolem centra',
      text: 'Pracovní dny 24 h denně a neděle 17–24 h. 60 min denně zdarma (nutná registrace), pak 40 Kč/hod.',
    },
    C: {
      title: 'Zóna C – zapojené oblasti mimo prstenec',
      text: 'Pracovní dny 17:00–6:00. 60 min denně zdarma (nutná registrace), pak 30 Kč/hod. O víkendech a svátcích zdarma.',
    },
  };
  const ZONE_IDS = ['A', 'B', 'C'];
  const CENTER_SID = '1-01';

  // šířka silnic: reálná šířka v metrech, minimální šířka v pixelech a od jakého zoomu se kreslí
  const ROADS = {
    motorway: { m: 16, px: 3.2, minS: 0, casing: true },
    primary: { m: 13, px: 2.8, minS: 0, casing: true },
    secondary: { m: 10, px: 2.3, minS: 0, casing: true },
    tertiary: { m: 8, px: 1.8, minS: 0.045, casing: true },
    minor: { m: 5.5, px: 1.0, minS: 0.13, casing: true },
    pedestrian: { m: 3, px: 0.9, minS: 0.2, casing: false },
  };
  const ROAD_ORDER = ['pedestrian', 'minor', 'tertiary', 'secondary', 'primary', 'motorway'];

  // ---------------------------------------------------------------- stav
  const S = { sel: null, layers: { zones: true, areas: true, entries: false } };

  // ---------------------------------------------------------------- vykreslení vrstev
  const gBase = group('g-base');
  mk('path', { d: D.woods, class: 'm-wood' }, gBase);
  mk('path', { d: D.parks, class: 'm-park' }, gBase);
  mk('path', { d: D.water, class: 'm-water' }, gBase);
  const waterways = mk('path', { d: D.waterways, class: 'm-waterway', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gBase);

  const gZones = group('g-zones');
  for (const z of D.zones) mk('path', { d: z.d, class: 'zone-path z-' + z.id }, gZones);

  const gRail = group('g-rail');
  const railBase = mk('path', { d: D.rail, class: 'm-rail', fill: 'none' }, gRail);
  const railDash = mk('path', { d: D.rail, class: 'm-rail-dash', fill: 'none' }, gRail);

  const gRoads = group('g-roads');
  const roadEls = {};
  for (const cls of ROAD_ORDER) {
    roadEls[cls] = { casing: null, fill: null };
    if (ROADS[cls].casing && D.roads[cls]) {
      roadEls[cls].casing = mk('path', { d: D.roads[cls], fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gRoads);
      roadEls[cls].casing.style.stroke = `var(--rc-${cls})`;
    }
  }
  for (const cls of ROAD_ORDER) {
    if (!D.roads[cls]) continue;
    roadEls[cls].fill = mk('path', { d: D.roads[cls], fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gRoads);
    roadEls[cls].fill.style.stroke = `var(--r-${cls})`;
  }

  const gEntries = group('g-entries');
  for (const e of D.entries) {
    mk('path', { d: e.d, class: 'entry-path', fill: e.color, stroke: e.color }, gEntries);
  }

  const gAreas = group('g-areas');
  const areaEls = new Map(); // sid -> {area, path, label, nm}
  const areaBySid = new Map(D.areas.map((a) => [a.sid, a]));
  for (const a of D.areas) {
    const path = mk('path', { class: 'area' + (a.planned ? ' planned' : ''), d: a.d }, gAreas);
    path.__sid = a.sid;
    areaEls.set(a.sid, { area: a, path });
  }
  const gAreaLabels = group('g-area-labels');
  for (const a of D.areas) {
    const t = mk('text', { class: 'area-label', x: a.x, y: a.y }, gAreaLabels);
    mk('tspan', {}, t).textContent = a.sid;
    const nm = mk('tspan', { class: 'nm', x: a.x, dy: '1.2em' }, t);
    nm.textContent = a.name;
    Object.assign(areaEls.get(a.sid), { label: t, nm });
  }
  const gPlaces = group('g-places');
  const placeEls = D.places.map((p) => {
    const t = mk('text', { class: 'place-label', x: p.x, y: p.y }, gPlaces);
    t.textContent = p.n;
    return { p, t };
  });

  // Projekce musí sedět s tools/build-data.js (lokální metry kolem středu Brna).
  const LON0 = 16.6078;
  const LAT0 = 49.1951;
  const KX = 111320 * Math.cos((LAT0 * Math.PI) / 180);
  const KY = 111132;
  const project = (lon, lat) => [(lon - LON0) * KX, -(lat - LAT0) * KY];

  const gLoc = group('g-loc');
  gLoc.style.display = 'none';
  const locAcc = mk('circle', { class: 'loc-acc', cx: 0, cy: 0, r: 0 }, gLoc);
  const locPulse = mk('circle', { class: 'loc-pulse', cx: 0, cy: 0, r: 0 }, gLoc);
  const locDot = mk('circle', { class: 'loc-dot', cx: 0, cy: 0, r: 0 }, gLoc);
  let locPos = null; // { x, y, acc }

  // ---------------------------------------------------------------- pohled (pan / zoom)
  const view = { s: 0.1, tx: 0, ty: 0 };
  let fitS = 0.1;
  const MAX_S = 4;
  let lastDetailS = -1;

  const viewport = () => {
    const r = svg.getBoundingClientRect();
    return { w: r.width, h: r.height };
  };
  const applyTransform = () =>
    world.setAttribute('transform', `translate(${view.tx.toFixed(2)} ${view.ty.toFixed(2)}) scale(${view.s})`);

  // detaily závislé na měřítku (šířky čar, popisky) – jen když se změní zoom
  function updateDetail() {
    const s = view.s;
    if (Math.abs(s - lastDetailS) < 1e-9) return;
    lastDetailS = s;
    const px = 1 / s; // 1 pixel obrazovky v metrech
    world.style.setProperty('--px', px);

    for (const cls of ROAD_ORDER) {
      const r = ROADS[cls];
      const w = Math.max(r.px * px, r.m);
      const vis = s >= r.minS;
      const e = roadEls[cls];
      if (e.fill) {
        e.fill.setAttribute('stroke-width', w);
        e.fill.style.display = vis ? '' : 'none';
      }
      if (e.casing) {
        e.casing.setAttribute('stroke-width', w + 2 * Math.min(px, w * 0.35));
        e.casing.style.display = vis ? '' : 'none';
      }
    }
    // šrafování plánovaných oblastí má mít konstantní velikost na obrazovce
    const hatch = $('hatch');
    hatch.setAttribute('width', 8 * px);
    hatch.setAttribute('height', 8 * px);
    hatch.firstElementChild.setAttribute('y2', 8 * px);
    hatch.firstElementChild.setAttribute('stroke-width', 2 * px);
    waterways.setAttribute('stroke-width', Math.max(2 * px, 4));
    railBase.setAttribute('stroke-width', 2 * px);
    railDash.setAttribute('stroke-width', 1.2 * px);
    railDash.setAttribute('stroke-dasharray', `${6 * px} ${6 * px}`);
    gZones.querySelectorAll('.zone-path').forEach((p) => p.setAttribute('stroke-width', 1.6 * px));
    gEntries.querySelectorAll('.entry-path').forEach((p) => p.setAttribute('stroke-width', 1.4 * px));
    gRail.style.display = s >= 0.05 ? '' : 'none';
    if (locPos) {
      locDot.setAttribute('r', Math.max(5 * px, 4));
      locDot.setAttribute('stroke-width', Math.max(2 * px, 1.5));
      locAcc.setAttribute('stroke-width', Math.max(1.2 * px, 1));
      locPulse.setAttribute('r', Math.max(14 * px, 10));
      locPulse.setAttribute('stroke-width', Math.max(2 * px, 1.5));
    }

    // popisky oblastí: čím větší oblast, tím dříve se ukáže; jméno až při větším přiblížení
    for (const { area, label, nm } of areaEls.values()) {
      const size = Math.sqrt(area.area) * s;
      label.style.display = size > 38 || area.sid === S.sel ? '' : 'none';
      nm.style.display = size > 95 ? '' : 'none';
    }
    // názvy čtvrtí z OSM: skryjeme ty, které by se překrývaly s popisky oblastí
    const boxes = [];
    if (S.layers.areas) {
      for (const { area, label, nm } of areaEls.values()) {
        if (label.style.display === 'none') continue;
        const two = nm.style.display !== 'none';
        boxes.push({ x: area.x * s, y: area.y * s, hw: two ? 46 : 20, hh: two ? 16 : 9 });
      }
    }
    for (const { p, t } of placeEls) {
      let show = p.t === 'suburb' ? s < 0.32 : s >= 0.14 && s < 0.5;
      if (show) {
        const hw = p.n.length * 3.4 + 4;
        const cx = p.x * s;
        const cy = p.y * s;
        show = !boxes.some((b) => Math.abs(b.x - cx) < b.hw + hw && Math.abs(b.y - cy) < b.hh + 8);
      }
      t.style.display = show ? '' : 'none';
    }
  }

  function setView(v) {
    view.s = Math.min(MAX_S, Math.max(fitS * 0.6, v.s));
    view.tx = v.tx;
    view.ty = v.ty;
    applyTransform();
    updateDetail();
  }

  function zoomAt(sx, sy, factor) {
    const s2 = Math.min(MAX_S, Math.max(fitS * 0.6, view.s * factor));
    const k = s2 / view.s;
    setView({ s: s2, tx: sx - (sx - view.tx) * k, ty: sy - (sy - view.ty) * k });
  }

  let anim = 0;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animateTo(target, ms) {
    cancelAnimationFrame(anim);
    const from = { s: view.s, tx: view.tx, ty: view.ty };
    const { w, h } = viewport();
    const c0 = { x: (w / 2 - from.tx) / from.s, y: (h / 2 - from.ty) / from.s };
    const c1 = { x: (w / 2 - target.tx) / target.s, y: (h / 2 - target.ty) / target.s };
    const t0 = performance.now();
    const dur = reduceMotion() ? 0 : ms;
    const step = (now) => {
      const p = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - p, 3);
      const s = Math.exp(Math.log(from.s) + (Math.log(target.s) - Math.log(from.s)) * e);
      const cx = c0.x + (c1.x - c0.x) * e;
      const cy = c0.y + (c1.y - c0.y) * e;
      setView({ s, tx: w / 2 - cx * s, ty: h / 2 - cy * s });
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function boxView(minX, minY, maxX, maxY, padding, maxScale) {
    const { w, h } = viewport();
    const availW = w - padding * 2;
    const availH = h - padding * 2;
    const s = Math.min(availW / (maxX - minX), availH / (maxY - minY), maxScale || MAX_S);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { s, tx: padding + availW / 2 - cx * s, ty: padding + availH / 2 - cy * s };
  }
  const fitView = () => boxView(D.bounds[0], D.bounds[1], D.bounds[2], D.bounds[3], 16);
  function fitAll(animate) {
    const v = fitView();
    fitS = v.s;
    if (animate) animateTo(v, 450);
    else setView(v);
  }

  // ---------------------------------------------------------------- ovládání myší / dotykem
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let suppressClick = false;

  svg.addEventListener('pointerdown', (e) => {
    cancelAnimationFrame(anim);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
      drag = null;
    }
  });
  window.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = svg.getBoundingClientRect();
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.dist > 0) zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, dist / pinch.dist);
      pinch.dist = dist;
      suppressClick = true;
    } else if (drag && pointers.size === 1) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        svg.classList.add('drag');
        hideTip();
      }
      if (drag.moved) {
        view.tx = drag.tx + dx;
        view.ty = drag.ty + dy;
        applyTransform();
      }
    }
  });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (drag && drag.moved) suppressClick = true;
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      drag = null;
      svg.classList.remove('drag');
      setTimeout(() => (suppressClick = false), 0);
    }
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);

  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    cancelAnimationFrame(anim);
    const r = svg.getBoundingClientRect();
    const unit = e.deltaMode === 1 ? 16 : 1;
    zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * unit * 0.0016));
  }, { passive: false });
  svg.addEventListener('dblclick', (e) => {
    const r = svg.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, 2);
  });

  function zoomCenter(f) {
    const { w, h } = viewport();
    const s2 = Math.min(MAX_S, Math.max(fitS * 0.6, view.s * f));
    const k = s2 / view.s;
    animateTo({ s: s2, tx: w / 2 - (w / 2 - view.tx) * k, ty: h / 2 - (h / 2 - view.ty) * k }, 220);
  }
  $('zIn').onclick = () => zoomCenter(1.7);
  $('zOut').onclick = () => zoomCenter(1 / 1.7);
  $('zReset').onclick = () => fitAll(true);

  // ---------------------------------------------------------------- poloha z GPS / navigace
  const locateBtn = $('zLocate');
  let toastTimer = 0;
  let watchId = null;
  function showToast(msg, ms) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms || 4200);
  }
  function areaAt(x, y) {
    const pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    let best = null;
    let bestA = Infinity;
    for (const a of D.areas) {
      const path = areaEls.get(a.sid).path;
      if (typeof path.isPointInFill === 'function' && path.isPointInFill(pt) && a.area < bestA) {
        best = a;
        bestA = a.area;
      }
    }
    return best;
  }
  function setLocationMarker(x, y, accuracy) {
    locPos = { x, y, acc: Math.max(accuracy || 0, 8) };
    locAcc.setAttribute('cx', x);
    locAcc.setAttribute('cy', y);
    locAcc.setAttribute('r', locPos.acc);
    locPulse.setAttribute('cx', x);
    locPulse.setAttribute('cy', y);
    locDot.setAttribute('cx', x);
    locDot.setAttribute('cy', y);
    gLoc.style.display = '';
    locateBtn.classList.add('active-loc');
    lastDetailS = -1;
    updateDetail();
  }
  function flyToLocation(x, y, accuracy) {
    const pad = Math.max(accuracy * 2.5, 180);
    animateTo(boxView(x - pad, y - pad, x + pad, y + pad, 28, 1.4), 550);
  }
  function onPosition(pos, { select = false, fly = false } = {}) {
    const { latitude, longitude, accuracy } = pos.coords;
    const [x, y] = project(longitude, latitude);
    const [x0, y0, x1, y1] = D.bounds;
    const margin = 800;
    const insideMap = x >= x0 - margin && x <= x1 + margin && y >= y0 - margin && y <= y1 + margin;
    setLocationMarker(x, y, accuracy || 25);
    if (fly) flyToLocation(x, y, accuracy || 25);
    if (!insideMap) {
      if (fly) showToast('Poloha je mimo mapu Brna.');
      return;
    }
    if (!select) return;
    const a = areaAt(x, y);
    if (a) go(a.sid, { fly: false });
    else showToast('Jste mimo známé parkovací oblasti.');
  }
  function locateError(err) {
    locateBtn.classList.remove('locating');
    locateBtn.disabled = false;
    const msgs = {
      1: 'Přístup k poloze byl zamítnut. Povolte ho v nastavení prohlížeče.',
      2: 'Polohu se nepodařilo zjistit.',
      3: 'Zjišťování polohy vypršelo. Zkuste to znovu.',
    };
    let msg = msgs[err && err.code] || 'Polohu se nepodařilo zjistit.';
    if (!window.isSecureContext) msg = 'Poloha funguje jen přes HTTPS nebo localhost (ne přes file://).';
    showToast(msg);
  }
  function locateMe() {
    if (!navigator.geolocation) {
      showToast('Tento prohlížeč nepodporuje zjištění polohy.');
      return;
    }
    locateBtn.classList.add('locating');
    locateBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locateBtn.classList.remove('locating');
        locateBtn.disabled = false;
        onPosition(pos, { select: true, fly: true });
        // po úspěchu sleduj pohyb: jen posouvá značku, mapu nepřibližuje znovu
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
        watchId = navigator.geolocation.watchPosition(
          (p) => onPosition(p),
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
        );
      },
      locateError,
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 12000 }
    );
  }
  locateBtn.onclick = locateMe;
  window.addEventListener('keydown', (e) => {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === '+' || e.key === '=') zoomCenter(1.7);
    else if (e.key === '-') zoomCenter(1 / 1.7);
    else if (e.key === 'l' || e.key === 'L') locateMe();
    else if (e.key === 'Escape') go(null);
  });
  new ResizeObserver(() => {
    const wasFit = Math.abs(view.s - fitS) < 1e-9;
    fitS = fitView().s;
    if (wasFit) fitAll(false);
    lastDetailS = -1;
    updateDetail();
  }).observe(svg);

  // ---------------------------------------------------------------- tooltip
  function hideTip() {
    tip.hidden = true;
  }
  svg.addEventListener('pointermove', (e) => {
    if (drag && drag.moved) return;
    const p = e.target.__sid ? e.target : null;
    if (!p) return hideTip();
    const a = areaBySid.get(p.__sid);
    const status = a.planned ? 'rezidentní parkování zatím není zavedeno' : a.zone ? 'zóna ' + a.zone : 'mimo zóny A/B/C';
    tip.innerHTML = `<b>Oblast ${esc(a.sid)}</b> · ${esc(a.name)}<br>${esc(status)} · <span class="n">${km2(a.area)} km²</span>`;
    tip.hidden = false;
    const box = svg.parentElement.getBoundingClientRect();
    let x = e.clientX - box.left + 14;
    const y = e.clientY - box.top + 14;
    if (x + 260 > box.width) x = e.clientX - box.left - 14 - tip.offsetWidth;
    tip.style.left = Math.max(4, x) + 'px';
    tip.style.top = y + 'px';
  });
  svg.addEventListener('pointerleave', hideTip);

  svg.addEventListener('click', (e) => {
    if (suppressClick) return;
    if (e.target.__sid) go(e.target.__sid === S.sel ? null : e.target.__sid, { fly: false });
    else if (S.sel) go(null);
  });

  // ---------------------------------------------------------------- květinka
  function petalsOf(a) {
    // oblast 1-01 nemůže být okvětním lístkem (kromě případu, kdy je sama středem)
    return a.nb.filter((sid) => areaEls.has(sid) && (a.sid === CENTER_SID || sid !== CENTER_SID));
  }

  function paintSelection() {
    const sel = S.sel ? areaBySid.get(S.sel) : null;
    const petals = sel ? new Set(petalsOf(sel)) : new Set();
    for (const [id, e] of areaEls) {
      const isSel = id === S.sel;
      const isPetal = petals.has(id);
      const dim = !!sel && !isSel && !isPetal;
      e.path.classList.toggle('sel', isSel);
      e.path.classList.toggle('petal', isPetal);
      e.path.classList.toggle('dim', dim);
      e.label.classList.toggle('dim', dim);
      if (isSel || isPetal) gAreas.appendChild(e.path); // nad ostatní, ať je vidět celý obrys
    }
    lastDetailS = -1;
    updateDetail();
    return { sel, petals };
  }

  // ---------------------------------------------------------------- navigace
  function go(sid, opts = {}) {
    if (sid && !areaEls.has(sid)) sid = null;
    S.sel = sid;
    syncControls();
    const { sel, petals } = paintSelection();
    render(sel, petals);
    if (opts.fly === false) return;
    if (sel) {
      const b = [Infinity, Infinity, -Infinity, -Infinity];
      for (const id of [sel.sid, ...petals]) {
        const bb = areaEls.get(id).path.getBBox();
        b[0] = Math.min(b[0], bb.x);
        b[1] = Math.min(b[1], bb.y);
        b[2] = Math.max(b[2], bb.x + bb.width);
        b[3] = Math.max(b[3], bb.y + bb.height);
      }
      animateTo(boxView(b[0], b[1], b[2], b[3], 40, 0.9), 600);
    } else if (opts.fit) {
      fitAll(true);
    }
  }

  // ---------------------------------------------------------------- legenda a ovládací prvky
  function zoneCounts() {
    const c = { A: 0, B: 0, C: 0, none: 0 };
    for (const a of D.areas) c[a.zone || 'none']++;
    return c;
  }
  const zoneSwatch = (z) =>
    `<i style="background:color-mix(in srgb, var(--zone-${z}) 35%, var(--surface));border-color:var(--zone-${z})"></i>`;

  function legend() {
    const L = $('legend');
    const c = zoneCounts();
    let h = '';
    if (S.layers.zones) {
      h += '<span>Zóna:</span>' + ZONE_IDS.map((z) =>
        `<span class="sw">${zoneSwatch(z)}${z} <span class="chip small">${c[z]} ${plural(c[z], 'oblast', 'oblasti', 'oblastí')}</span></span>`).join('');
    }
    if (S.layers.areas) {
      h += '<span class="sw"><i style="border:1.5px dashed var(--muted);background:repeating-linear-gradient(45deg,transparent 0 3px,color-mix(in srgb,var(--muted) 50%,transparent) 3px 4px)"></i>rezidentní parkování zatím není zavedeno</span>';
    }
    if (S.sel) {
      h += '<span class="sw"><i style="background:color-mix(in srgb,var(--accent) 35%,var(--surface));border-color:var(--accent)"></i>střed květinky</span>' +
        '<span class="sw"><i style="background:color-mix(in srgb,var(--accent) 16%,var(--surface));border:1.5px dashed var(--accent)"></i>okvětní lístky</span>';
    }
    if (S.layers.entries) {
      h += '<span>Podoblasti centra:</span>' + D.entries.map((e) =>
        `<span class="sw"><i style="background:${e.color};border-color:${e.color}"></i>${esc(e.name)}</span>`).join('');
    }
    L.innerHTML = h || '<span>Žádná vrstva není zapnutá.</span>';
  }

  function crumbs() {
    const c = $('crumbs');
    if (!S.sel) {
      c.innerHTML = '<span class="cur">Celé Brno</span>';
      return;
    }
    const a = areaBySid.get(S.sel);
    c.innerHTML = `<button type="button" data-go="">Brno</button> › <span class="cur">oblast ${esc(a.sid)} ${esc(a.name)}</span>`;
    c.querySelector('button').onclick = () => go(null, { fit: true });
  }

  function syncControls() {
    $('areaSel').value = S.sel || '';
    document.querySelectorAll('[data-layer]').forEach((b) => b.setAttribute('aria-pressed', String(S.layers[b.dataset.layer])));
    gZones.style.display = S.layers.zones ? '' : 'none';
    gAreas.style.display = gAreaLabels.style.display = S.layers.areas ? '' : 'none';
    gEntries.style.display = S.layers.entries ? '' : 'none';
    crumbs();
    legend();
    writeUrl();
  }

  document.querySelectorAll('[data-layer]').forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.layer;
      S.layers[k] = !S.layers[k];
      if (k === 'areas' && !S.layers.areas && S.sel) {
        go(null, { fly: false });
      } else {
        syncControls();
        lastDetailS = -1;
        updateDetail();
      }
      if (k === 'entries' && S.layers.entries && view.s < 0.3) {
        const bb = areaEls.get(CENTER_SID).path.getBBox();
        animateTo(boxView(bb.x, bb.y, bb.x + bb.width, bb.y + bb.height, 40, 1.2), 600);
      }
    };
  });

  // ---------------------------------------------------------------- panel
  let sortK = 'sid';
  let sortDir = 1;
  let query = '';

  function statsHTML(items) {
    return '<div class="stats">' + items.map((i) => `<div class="stat"><div class="v">${i.v}</div><div class="l">${esc(i.l)}</div></div>`).join('') + '</div>';
  }

  function renderCity() {
    const c = zoneCounts();
    const planned = D.areas.filter((a) => a.planned).length;
    const mx = Math.max(c.A, c.B, c.C, 1);
    const bars = ZONE_IDS.map((z) => `
      <div class="bar">
        <div class="nm"><i style="background:var(--zone-${z})"></i><span>${esc(ZONES[z].title)}</span></div>
        <div class="pc">${c[z]} ${plural(c[z], 'oblast', 'oblasti', 'oblastí')}</div>
        <div class="track"><b style="width:${(c[z] / mx) * 100}%;background:var(--zone-${z})"></b></div>
        <div class="meta">${esc(ZONES[z].text)}</div>
      </div>`).join('');
    panel.innerHTML = `
      <section class="card">
        <div class="eyebrow">Celé Brno · stav k ${esc(new Date(D.generated).toLocaleDateString('cs-CZ'))}</div>
        <h2>${D.areas.length} rezidentních oblastí ve 3 zónách</h2>
        <div class="sub">Návštěvnické zóny A, B, C a oblasti, ve kterých platí oprávnění rezidentů a abonentů</div>
        ${statsHTML([
          { v: 3, l: 'návštěvnické zóny' },
          { v: D.areas.length - planned, l: 'oblastí se zavedeným parkováním' },
          { v: planned, l: 'oblastí připravovaných' },
        ])}
      </section>
      <section class="card">
        <h3>Návštěvnické zóny</h3>
        <div class="bars">${bars}</div>
        <p class="note">Víkendy a svátky jsou zdarma. Výjimkou je neděle 17:00–24:00 v zóně B. Zaplacená doba platí v celé zóně.</p>
      </section>
      <section class="card">
        <h3>Oblasti</h3>
        <div class="search"><input type="search" id="areaQ" placeholder="Číslo nebo název, např. 1-14, Lesná…" autocomplete="off" aria-label="Hledat oblast" value="${esc(query)}"></div>
        <div class="tbl-wrap"><table>
          <thead><tr><th data-k="sid">Oblast</th><th data-k="zone">Zóna</th><th class="n" data-k="area">Plocha</th></tr></thead>
          <tbody id="areaBody"></tbody></table></div>
        <p class="note">Klikněte na oblast v mapě nebo v tabulce: zobrazí se její květinka.</p>
      </section>`;

    const fill = () => {
      const q = norm(query.trim());
      const rows = D.areas
        .filter((a) => !q || norm(a.sid + ' ' + a.name).includes(q))
        .sort((a, b) => {
          const va = sortK === 'sid' ? a.sid : sortK === 'zone' ? a.zone || 'Z' : a.area;
          const vb = sortK === 'sid' ? b.sid : sortK === 'zone' ? b.zone || 'Z' : b.area;
          return (typeof va === 'string' ? collator.compare(va, vb) : va - vb) * sortDir;
        });
      $('areaBody').innerHTML = rows.length
        ? rows.map((a) => `<tr class="row${a.planned ? ' planned' : ''}" tabindex="0" data-sid="${esc(a.sid)}">
            <td>${esc(a.sid)} ${esc(a.name)}${a.planned ? ' <span class="chip small">připravuje se</span>' : ''}</td>
            <td><span class="dot ${a.zone || 'none'}"></span>${a.zone || '–'}</td>
            <td class="n">${km2(a.area)} km²</td></tr>`).join('')
        : '<tr><td colspan="3" class="sub">Žádná oblast neodpovídá. Zkuste kratší část názvu.</td></tr>';
      panel.querySelectorAll('#areaBody tr[data-sid]').forEach((tr) => {
        tr.onclick = () => go(tr.dataset.sid);
        tr.onkeydown = (e) => { if (e.key === 'Enter') go(tr.dataset.sid); };
        tr.onmouseenter = () => hoverArea(tr.dataset.sid, true);
        tr.onmouseleave = () => hoverArea(tr.dataset.sid, false);
      });
    };
    panel.querySelectorAll('th').forEach((th) => (th.onclick = () => {
      const k = th.dataset.k;
      sortDir = sortK === k ? -sortDir : k === 'area' ? -1 : 1;
      sortK = k;
      fill();
    }));
    $('areaQ').oninput = (e) => { query = e.target.value; fill(); };
    fill();
  }

  // při najetí na řádek tabulky zvýrazníme oblast v mapě
  function hoverArea(sid, on) {
    if (S.sel) return;
    for (const [id, e] of areaEls) e.path.classList.toggle('dim', on && id !== sid);
    for (const [id, e] of areaEls) e.label.classList.toggle('dim', on && id !== sid);
  }

  function renderArea(a, petals) {
    const z = a.zone ? ZONES[a.zone] : null;
    const chips = `<span class="chip center">${esc(a.sid)} ${esc(a.name)}</span>` +
      [...petals].map((id) => {
        const n = areaBySid.get(id);
        return `<button type="button" class="chip" data-sid="${esc(id)}">${esc(n.sid)} ${esc(n.name)}</button>`;
      }).join('');
    let warn = '';
    if (a.sid === CENTER_SID) {
      warn = '<p class="note warn">Rezident nebo abonent z centra parkuje jen ve své podoblasti historického centra. Okolní oblasti jsou v seznamu výše.</p>';
    } else if (a.nb.includes(CENTER_SID)) {
      warn = '<p class="note warn">Oblast 1-01 (historické centrum) sousedí, ale nemůže být okvětním lístkem. Oprávnění tam neplatí.</p>';
    }
    panel.innerHTML = `
      <section class="card">
        <div class="eyebrow">Oblast · ${z ? 'zóna ' + a.zone : 'mimo zóny A, B, C'}</div>
        <h2>${esc(a.sid)} ${esc(a.name)}</h2>
        <div class="sub">${a.planned ? 'Rezidentní parkování zatím není zavedeno' + (a.note ? ' (' + esc(a.note) + ')' : '') : 'Rezidentní parkování je zavedeno'}</div>
        ${statsHTML([
          { v: a.zone || '–', l: 'návštěvnická zóna' },
          { v: petals.size, l: plural(petals.size, 'sousední oblast', 'sousední oblasti', 'sousedních oblastí') + ' v květince' },
          { v: km2(a.area), l: 'km² (přibližně)' },
        ])}
      </section>
      <section class="card">
        <h3>Květinka</h3>
        <p style="margin-top:0">Oprávnění z této oblasti platí ve středu a ve všech okvětních lístcích:</p>
        <div class="chips" style="margin-top:10px">${chips}</div>
        ${warn}
        <p class="note">V ostatních oblastech platíte jako běžný návštěvník.</p>
      </section>
      <section class="card">
        <h3>${z ? esc(z.title) : 'Návštěvnická zóna'}</h3>
        <p style="margin-top:0">${z ? '<span class="badge ' + a.zone + '">zóna ' + a.zone + '</span>' + esc(z.text) : 'Oblast zatím není zapojená do návštěvnických zón A, B, C.'}</p>
      </section>
      <button type="button" class="backbtn" id="backAll">← Zpět na celé Brno</button>`;
    panel.querySelectorAll('button[data-sid]').forEach((b) => (b.onclick = () => go(b.dataset.sid)));
    $('backAll').onclick = () => go(null, { fit: true });
  }

  function render(sel, petals) {
    if (sel) renderArea(sel, petals);
    else renderCity();
  }

  // ---------------------------------------------------------------- hlavička, URL
  function buildControls() {
    const sel = $('areaSel');
    [...D.areas].sort((a, b) => collator.compare(a.sid, b.sid)).forEach((a) => {
      const o = document.createElement('option');
      o.value = a.sid;
      o.textContent = `${a.sid} ${a.name}` + (a.planned ? ' (připravuje se)' : '');
      sel.appendChild(o);
    });
    sel.onchange = () => go(sel.value || null);
    $('dataDate').textContent = new Date(D.generated).toLocaleDateString('cs-CZ');

    $('copyLink').onclick = async () => {
      writeUrl();
      const btn = $('copyLink');
      let ok = false;
      try {
        await navigator.clipboard.writeText(location.href);
        ok = true;
      } catch (e) {
        const inp = document.createElement('input');
        inp.value = location.href;
        document.body.appendChild(inp);
        inp.select();
        try { ok = document.execCommand('copy'); } catch (e2) { /* nic */ }
        inp.remove();
      }
      if (!ok) return;
      const prev = btn.textContent;
      btn.textContent = 'Odkaz zkopírován';
      setTimeout(() => { btn.textContent = prev; }, 1600);
    };
  }

  /* Adresa nese výběr, např. ?oblast=1-14&vrstvy=zony,oblasti,vjezdy
     (starý tvar index.html#1-14 se pořád čte). */
  const LAYER_KEYS = { zony: 'zones', oblasti: 'areas', vjezdy: 'entries' };
  function writeUrl() {
    const q = new URLSearchParams();
    if (S.sel) q.set('oblast', S.sel);
    const on = Object.keys(LAYER_KEYS).filter((k) => S.layers[LAYER_KEYS[k]]);
    if (on.join() !== 'zony,oblasti') q.set('vrstvy', on.join(',') || 'zadne');
    const url = new URL(location.href);
    const next = q.toString();
    if (url.searchParams.toString() === next && !url.hash) return;
    url.search = next;
    url.hash = '';
    try { history.replaceState(null, '', url); } catch (e) { /* file:// v některých prohlížečích */ }
  }
  function readUrl() {
    const q = new URLSearchParams(location.search);
    let sid = q.get('oblast');
    if (!sid && location.hash.length > 1) sid = decodeURIComponent(location.hash.slice(1));
    const v = q.get('vrstvy');
    if (v) {
      const on = v.split(',');
      for (const k of Object.keys(LAYER_KEYS)) S.layers[LAYER_KEYS[k]] = on.includes(k);
    }
    return sid && areaEls.has(sid) ? sid : null;
  }
  function applyUrl() {
    const sid = readUrl();
    syncControls();
    go(sid, { fly: !!sid });
  }

  // ---------------------------------------------------------------- start
  buildControls();
  fitAll(false);
  applyUrl();
  window.addEventListener('popstate', applyUrl);
  window.addEventListener('hashchange', applyUrl);
})();
