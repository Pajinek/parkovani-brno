#!/usr/bin/env node
// Převede surová OSM data (Overpass JSON) a polygony zón/oblastí
// na kompaktní SVG cesty v metrech a uloží je do js/map-data.js.
//
// Použití: node tools/build-data.js
'use strict';
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, '..', 'data', 'raw');
const OUT = path.join(__dirname, '..', 'js', 'map-data.js');
const readJSON = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));

// ---------- projekce (lokální ekvirektangulární, jednotky = metry) ----------
const LON0 = 16.6078;
const LAT0 = 49.1951;
const KX = 111320 * Math.cos((LAT0 * Math.PI) / 180);
const KY = 111132;
const project = (lon, lat) => [(lon - LON0) * KX, -(lat - LAT0) * KY];

// ---------- pomocné funkce pro geometrii ----------
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0;
    let idx = -1;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d2;
      if (len2 === 0) d2 = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        let t = ((px - ax) * dx + (py - ay) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        d2 = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
      }
      if (d2 > max) {
        max = d2;
        idx = i;
      }
    }
    if (max > t2) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const fmt = (n) => {
  const s = (Math.round(n * 10) / 10).toString();
  return s === '-0' ? '0' : s;
};

// Cesta s relativními souřadnicemi (kompaktní). Zaokrouhlování se nekumuluje.
function toPath(pts, close) {
  if (pts.length < 2) return '';
  let rx = Math.round(pts[0][0] * 10) / 10;
  let ry = Math.round(pts[0][1] * 10) / 10;
  let s = `M${fmt(rx)} ${fmt(ry)}`;
  const parts = [];
  for (let i = 1; i < pts.length; i++) {
    const ax = Math.round(pts[i][0] * 10) / 10;
    const ay = Math.round(pts[i][1] * 10) / 10;
    const dx = Math.round((ax - rx) * 10) / 10;
    const dy = Math.round((ay - ry) * 10) / 10;
    rx = ax;
    ry = ay;
    if (dx === 0 && dy === 0) continue;
    parts.push(`${fmt(dx)} ${fmt(dy)}`);
  }
  if (!parts.length) return '';
  s += 'l' + parts.join(' ');
  return close ? s + 'z' : s;
}

const geomToPts = (g) => g.map((p) => project(p.lon, p.lat));

// Složí segmenty (cesty z členů relace) do uzavřených okruhů.
function assembleRings(segments) {
  const key = (p) => p.lon.toFixed(7) + ',' + p.lat.toFixed(7);
  const segs = segments.filter((s) => s.length > 1).map((s) => s.slice());
  const rings = [];
  while (segs.length) {
    let ring = segs.pop();
    let changed = true;
    while (changed && key(ring[0]) !== key(ring[ring.length - 1])) {
      changed = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const head = key(ring[0]);
        const tail = key(ring[ring.length - 1]);
        if (key(s[0]) === tail) ring = ring.concat(s.slice(1));
        else if (key(s[s.length - 1]) === tail) ring = ring.concat(s.slice().reverse().slice(1));
        else if (key(s[s.length - 1]) === head) ring = s.concat(ring.slice(1));
        else if (key(s[0]) === head) ring = s.slice().reverse().concat(ring.slice(1));
        else continue;
        segs.splice(i, 1);
        changed = true;
        break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

// Vrátí pole okruhů (každý = pole {lat,lon}) pro way nebo relaci.
function polygonRings(el) {
  if (el.type === 'way') {
    return el.geometry && el.geometry.length > 2 ? [el.geometry] : [];
  }
  if (el.type === 'relation') {
    const segs = (el.members || [])
      .filter((m) => m.type === 'way' && m.geometry && (m.role === 'outer' || m.role === 'inner' || m.role === ''))
      .map((m) => m.geometry);
    return assembleRings(segs).filter((r) => r.length > 3);
  }
  return [];
}

function polygonPath(elements, tol) {
  const out = [];
  for (const el of elements) {
    for (const ring of polygonRings(el)) {
      const p = toPts(ring, tol);
      const d = toPath(p, true);
      if (d) out.push(d);
    }
  }
  return out.join('');
}
const toPts = (geom, tol) => simplify(geomToPts(geom), tol);

function linePath(elements, tol) {
  const out = [];
  for (const el of elements) {
    if (!el.geometry || el.geometry.length < 2) continue;
    const d = toPath(toPts(el.geometry, tol), false);
    if (d) out.push(d);
  }
  return out.join('');
}

// ---------- OSM vrstvy ----------
const roadsRaw = readJSON('roads.json').elements;
const waterRaw = readJSON('water.json').elements;
const railRaw = readJSON('rail.json').elements;
const greenRaw = readJSON('green.json').elements;
const placesRaw = readJSON('places.json').elements;

const roadClass = (hw) => {
  if (/^(motorway|trunk)/.test(hw)) return 'motorway';
  if (/^primary/.test(hw)) return 'primary';
  if (/^secondary/.test(hw)) return 'secondary';
  if (/^tertiary/.test(hw)) return 'tertiary';
  if (hw === 'pedestrian') return 'pedestrian';
  return 'minor';
};
const roadGroups = { motorway: [], primary: [], secondary: [], tertiary: [], minor: [], pedestrian: [] };
for (const w of roadsRaw) {
  if (w.type !== 'way' || !w.tags) continue;
  roadGroups[roadClass(w.tags.highway)].push(w);
}
const roads = {};
for (const k of Object.keys(roadGroups)) roads[k] = linePath(roadGroups[k], 0.5);

const waterAreas = waterRaw.filter((e) => e.tags && e.tags.natural === 'water');
const waterLines = waterRaw.filter((e) => e.type === 'way' && e.tags && e.tags.waterway);
const greenParks = greenRaw.filter((e) => e.tags && (e.tags.leisure === 'park' || e.tags.landuse === 'grass'));
const greenWoods = greenRaw.filter((e) => e.tags && (e.tags.landuse === 'forest' || e.tags.natural === 'wood'));

const places = placesRaw
  .filter((p) => p.tags && p.tags.name)
  .map((p) => {
    const [x, y] = project(p.lon, p.lat);
    return { n: p.tags.name, x: Math.round(x), y: Math.round(y), t: p.tags.place };
  });

// ---------- zóny a oblasti z parkovanivbrne.cz ----------
const src = readJSON('zones-source.json');

function geoJsonPath(geom) {
  const rings = geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat();
  const out = [];
  for (const ring of rings) {
    const pts = ring.map(([lon, lat]) => project(lon, lat));
    out.push(toPath(pts, true));
  }
  return out.join('');
}

function ringCentroid(ring) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a /= 2;
  return { a, x: cx / (6 * a), y: cy / (6 * a) };
}
function polyArea(ring) {
  return Math.abs(ringCentroid(ring).a);
}

const bounds = [Infinity, Infinity, -Infinity, -Infinity];
function extend(ring) {
  for (const [x, y] of ring) {
    bounds[0] = Math.min(bounds[0], x);
    bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x);
    bounds[3] = Math.max(bounds[3], y);
  }
}

const ZONE_META = {
  'zóna A': { id: 'A', color: '#d93025' },
  'zóna B': { id: 'B', color: '#1e8e3e' },
  'zóna C': { id: 'C', color: '#1a73e8' },
};
const zones = src.zony.features
  .filter((f) => f.properties.type === 'zony')
  .map((f) => {
    const meta = ZONE_META[f.properties.title];
    f.geometry.coordinates.forEach((r) => extend(r.map(([lo, la]) => project(lo, la))));
    return { id: meta.id, name: f.properties.title, color: meta.color, d: geoJsonPath(f.geometry) };
  })
  .sort((a, b) => b.id.localeCompare(a.id)); // C, B, A (A navrchu)

// ---- geometrie pro určení zóny oblasti a polohy popisku ----
const zoneRings = {};
for (const f of src.zony.features.filter((x) => x.properties.type === 'zony')) {
  zoneRings[ZONE_META[f.properties.title].id] = f.geometry.coordinates.map((r) => r.map(([lo, la]) => project(lo, la)));
}
function insideRings(x, y, rings) {
  // even-odd přes všechny okruhy
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
function distToRing(x, y, ring) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j];
    const [bx, by] = ring[i];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}
// Bod uvnitř polygonu co nejdál od hranic (zjednodušený polylabel).
function labelPoint(ring) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  let best = { d: -1, x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const N = 40;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const x = minX + ((maxX - minX) * i) / N;
      const y = minY + ((maxY - minY) * j) / N;
      if (!insideRings(x, y, [ring])) continue;
      const d = distToRing(x, y, ring);
      if (d > best.d) best = { d, x, y };
    }
  }
  return best;
}
function detectZone(rings) {
  const samples = rings.flat();
  const count = { A: 0, B: 0, C: 0 };
  for (const [x, y] of samples) {
    for (const z of Object.keys(zoneRings)) if (insideRings(x, y, zoneRings[z])) count[z]++;
  }
  const [z, n] = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  return n / samples.length >= 0.3 ? z : null;
}

const idToSid = new Map(src.oblasti.features.map((f) => [f.properties.id, f.properties.sid]));

function areaFeature(f, planned) {
  const p = f.properties;
  const m = /^(\S+)\s+(.*?)\s*(?:\((.*)\))?$/.exec(p.title);
  const name = m ? m[2] : p.title;
  const note = m && m[3] && /rezident/i.test(m[3]) ? m[3] : '';
  const rings = f.geometry.coordinates.map((r) => r.map(([lo, la]) => project(lo, la)));
  rings.forEach(extend);
  const main = rings.reduce((a, b) => (polyArea(b) > polyArea(a) ? b : a));
  const c = labelPoint(main);
  return {
    sid: p.sid,
    name: name.replace(/^\p{Lu}[\p{Lu}\s.]+$/u, (s) => s.charAt(0) + s.slice(1).toLowerCase()),
    note,
    planned: planned || !!note,
    zone: p.sid === '1-01' ? 'A' : detectZone(rings),
    d: geoJsonPath(f.geometry),
    x: Math.round(c.x),
    y: Math.round(c.y),
    area: Math.round(polyArea(main)),
    nb: [...new Set((p.neighbors || []).map((id) => idToSid.get(id)).filter((s) => s && s !== p.sid))],
  };
}

const areas = [];
const seen = new Set();
// Hlavní vrstva už obsahuje i plánované oblasti (type "oblast_plan"); duplicity podle sid řešíme.
const allAreaFeatures = [...src.oblasti.features, ...src.oblasti_plan.features].sort(
  (a, b) => (a.properties.type === 'oblast' ? 0 : 1) - (b.properties.type === 'oblast' ? 0 : 1)
);
for (const f of allAreaFeatures) {
  if (seen.has(f.properties.sid)) continue;
  seen.add(f.properties.sid);
  areas.push(areaFeature(f, f.properties.type === 'oblast_plan'));
}

const entries = src.vjezdy.features.map((f) => ({
  name: f.properties.title.replace(/^oblast\s+/, ''),
  color: f.properties.color,
  d: geoJsonPath(f.geometry),
}));

const data = {
  generated: new Date().toISOString().slice(0, 10),
  bounds: bounds.map(Math.round),
  water: polygonPath(waterAreas, 0.8),
  waterways: linePath(waterLines, 0.8),
  parks: polygonPath(greenParks, 1),
  woods: polygonPath(greenWoods, 1.5),
  rail: linePath(railRaw.filter((w) => w.type === 'way'), 1),
  roads,
  places,
  zones,
  areas,
  entries,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, 'window.MAP_DATA = ' + JSON.stringify(data) + ';\n');
const kb = (s) => Math.round(s.length / 1024) + ' kB';
console.log('Zapsáno', OUT, kb(fs.readFileSync(OUT, 'utf8')));
for (const k of Object.keys(roads)) console.log('  silnice', k, kb(roads[k]));
console.log('  voda', kb(data.water), '| toky', kb(data.waterways), '| parky', kb(data.parks), '| lesy', kb(data.woods), '| železnice', kb(data.rail));
console.log('  zón:', zones.length, '| oblastí:', areas.length, '| vjezdů:', entries.length, '| míst:', places.length);
console.log('  hranice [m]:', data.bounds.join(', '));
