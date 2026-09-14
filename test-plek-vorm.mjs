import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const sqlite = new DatabaseSync(':memory:');
const DB = {
  prepare(sql) {
    const stmt = sqlite.prepare(sql);
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() { return stmt.get(...args) ?? null; },
      async all() { return { results: stmt.all(...args) }; },
      async run() { return { meta: stmt.run(...args) }; },
    };
  },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      sqlite.exec('COMMIT');
      return results;
    } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  },
};
function loader(overrides = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const localRequire = (name) => {
      if (name in overrides) return overrides[name];
      if (name === 'cloudflare:workers') return { env: { DB } };
      if (name === '@/app/lib/auth') return { geldigeSessie: async (request) => request.headers.get('x-test-session') === 'valid' };
      if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
      const target = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(filename), name);
      return load(path.extname(target) ? target : target + '.ts');
    };
    new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
    return mod.exports;
  }
  return load;
}

let load = loader();
const geo = load('app/lib/plekVorm.ts');
let plekken = load('db/plekken.ts');
let route = load('app/api/plekken/route.ts');
const start = await plekken.leesPlekken();
const rect = { type: 'rect', x: 10, y: 20, b: 30, h: 40 };
assert.deepEqual(geo.veranderVorm(rect, 'bak', 'verplaats', -99, 999), { ...rect, x: 0, y: 257 });
assert.deepEqual(geo.veranderVorm(rect, 'bak', 'nw', 99, 99), { ...rect, x: 35, y: 55, b: 5, h: 5 });
assert.deepEqual(geo.veranderVorm(rect, 'bak', 'se', 2, 3), { ...rect, b: 32, h: 43 });
const circle = { type: 'ellipse', cx: 30, cy: 40, rx: 10, ry: 10 };
assert.deepEqual(geo.veranderVorm(circle, 'bak', 'w', -999, 0), { ...circle, rx: 30, ry: 30 });
assert.deepEqual(geo.veranderVorm(circle, 'bak', 'n', 0, 99), { ...circle, rx: 2.5, ry: 2.5 });
assert.deepEqual(geo.veranderVorm(circle, 'vrij', 'e', 2, 0), { ...circle, cx: 31, rx: 11 });
assert.equal(geo.veranderVorm(rect, 'bak', 'e', 0.1, 0).b, 30.1);
assert.equal(geo.isTijdelijkePuntplek({ id: 'eigen-01', vorm: { type: 'punt', x: 10, y: 20 } }), true);
assert.equal(geo.isTijdelijkePuntplek({ id: 'eigen-02', vorm: rect }), false);
assert.equal(geo.isTijdelijkePuntplek({ id: 'vak-02', vorm: { type: 'punt', x: 10, y: 20 } }), false);
const request = (method, body, auth = true) => new Request('http://test/api/plekken', {
  method, headers: { 'content-type': 'application/json', ...(auth ? { 'x-test-session': 'valid' } : {}) }, body: JSON.stringify(body),
});
const change = (id, vorm, auth) => route.PATCH(request('PATCH', { id, vorm }, auth));
assert.equal((await change('vak-02', rect, false)).status, 401);
assert.equal((await change('missing', rect)).status, 404);
assert.equal((await route.PATCH(request('PATCH', null))).status, 400);
assert.equal((await route.PATCH(new Request('http://test', { method: 'PATCH', headers: { 'x-test-session': 'valid' }, body: '{' }))).status, 400);
for (const vorm of [null, {}, { ...rect, x: null }, { ...rect, b: '30' }, { ...rect, b: 4 }, { ...rect, x: -1 }, { ...rect, y: 290 }, circle]) {
  assert.equal((await change('vak-02', vorm)).status, 400);
}
const punt = start.find((p) => p.vorm.type === 'punt');
assert.equal((await change(punt.id, rect)).status, 400);
assert.equal((await change('vak-06', { ...circle, ry: 11 })).status, 400);
assert.equal((await change('vrij-01', rect)).status, 400);
// Test ieder vormtype, bestaand/bijgemaakt en leeg/beplant met echte SQL.
const targets = ['vak-02', 'vak-06', 'vrij-01'];
for (const [vorm, soort] of [[rect, 'bak'], [circle, 'bak'], [{ ...circle, ry: 15 }, 'vrij']]) {
  const response = await route.POST(request('POST', { vorm, soort }));
  assert.equal(response.status, 201);
  targets.push((await response.json()).plek.id);
}
for (const id of targets) {
  for (const beplant of [false, true]) {
    sqlite.prepare('DELETE FROM beplanting WHERE plek_id = ?').run(id);
    if (beplant) sqlite.prepare('INSERT INTO beplanting (plek_id, plant_slug, gewijzigd_op) VALUES (?, ?, ?)').run(id, 'munt', 'testtijd');
    const before = sqlite.prepare('SELECT * FROM plekken WHERE id = ?').get(id);
    const planten = sqlite.prepare('SELECT * FROM beplanting ORDER BY plek_id, plant_slug').all();
    const other = sqlite.prepare('SELECT * FROM plekken WHERE id <> ? ORDER BY id').all(id);
    const p = await plekken.leesPlek(id);
    const moved = geo.veranderVorm(p.vorm, p.soort, 'verplaats', 1.1, 2);
    const resized = geo.veranderVorm(moved, p.soort, 'e', 1, 0);
    const response = await change(id, resized);
    assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
    const result = (await response.json()).plek;
    assert.deepEqual(result.vorm, geo.keurVorm(resized, p.soort));
    assert.deepEqual(result.badge, geo.nummerPositie(result.vorm, p.soort));
    const after = sqlite.prepare('SELECT * FROM plekken WHERE id = ?').get(id);
    for (const key of ['id', 'label', 'soort', 'svg_label', 'vast', 'volgorde', 'aangemaakt_op', 'vorm_type']) assert.equal(after[key], before[key]);
    assert.deepEqual(sqlite.prepare('SELECT * FROM beplanting ORDER BY plek_id, plant_slug').all(), planten);
    assert.deepEqual(sqlite.prepare('SELECT * FROM plekken WHERE id <> ? ORDER BY id').all(id), other);
    // Nieuwe module/Worker: de startvulling mag een wijziging niet terugzetten.
    load = loader(); plekken = load('db/plekken.ts'); route = load('app/api/plekken/route.ts');
    assert.deepEqual((await plekken.leesPlek(id)).vorm, result.vorm);
  }
}
// Elke grens en handgreep levert ook na servernormalisatie een geldige vorm op.
for (const p of await plekken.leesPlekken()) {
  if (!geo.bewerkbaar(p)) continue;
  const grepen = p.soort === 'bak' && p.vorm.type === 'ellipse' ? ['verplaats', 'n', 'e', 's', 'w'] : ['verplaats', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  for (const g of grepen) for (const dx of [-999, -.13, .17, 999]) for (const dy of [-999, -.13, .17, 999]) {
    const vorm = geo.veranderVorm(p.vorm, p.soort, g, dx, dy);
    assert.doesNotThrow(() => geo.keurVorm(vorm, p.soort), `${p.id} ${g} ${dx},${dy}: ${JSON.stringify(vorm)}`);
  }
}
// Mislukte databasewijziging bewaart de vorige stand.
const saved = await plekken.leesPlek('vak-02');
sqlite.exec("CREATE TRIGGER test_failure BEFORE UPDATE ON plekken BEGIN SELECT RAISE(ABORT, 'test failure'); END");
assert.equal((await change('vak-02', rect)).status, 500);
assert.deepEqual(await plekken.leesPlek('vak-02'), saved);
sqlite.close();
console.log('Plekvorm: geometrie, grenzen, validatie, sessie, 12 opslagrondgangen, behoud van metadata en beplanting, herladen en foutafhandeling geslaagd.');

// Componentgedrag zonder browser: echte pointer/key-handlers, met een SVG-coördinatenstelsel.
const ref = { current: null };
const Editor = loader({ react: { useRef: () => ref } })('app/components/PlekVormEditor.tsx').default;
let waarde = rect;
let calls = 0;
const render = (disabled = false) => Editor({ vorm: waarde, soort: 'bak', onVorm: (v) => { waarde = v; calls++; }, disabled });
let captured = null;
const target = {
  ownerSVGElement: {
    getScreenCTM: () => ({ inverse: () => ({}) }),
    createSVGPoint: () => ({ x: 0, y: 0, matrixTransform() { return { x: (this.x - 100) / 2, y: (this.y - 200) / 2 }; } }),
  },
  focus() {}, setPointerCapture(id) { captured = id; },
  hasPointerCapture(id) { return captured === id; }, releasePointerCapture() { captured = null; },
};
const pointer = (x, y, more = {}) => ({ currentTarget: target, clientX: 100 + x * 2, clientY: 200 + y * 2,
  pointerId: 7, isPrimary: true, button: 0, preventDefault() {}, stopPropagation() {}, ...more });
for (const pointerType of ['mouse', 'touch', 'pen']) {
  waarde = rect;
  const props = render().props.children[0].props;
  props.onPointerDown(pointer(15, 25, { pointerType }));
  props.onPointerMove(pointer(18, 29, { pointerType }));
  assert.equal(waarde.x, 13); assert.equal(waarde.y, 24);
  props.onPointerCancel(pointer(18, 29, { pointerType }));
  assert.deepEqual(waarde, rect); assert.equal(captured, null);
  props.onPointerDown(pointer(15, 25, { pointerType }));
  props.onPointerUp(pointer(17, 28, { pointerType }));
  assert.equal(waarde.x, 12); assert.equal(waarde.y, 23);
  assert.equal(captured, null);
}
waarde = rect;
let props = render().props.children[0].props;
props.onPointerDown(pointer(15, 25));
props.onPointerMove(pointer(20, 30));
props.onLostPointerCapture(pointer(20, 30));
assert.deepEqual(waarde, rect);
props.onPointerDown(pointer(15, 25));
props.onPointerMove(pointer(20, 30));
props.onKeyDown({ currentTarget: target, key: 'Escape', preventDefault() {} });
assert.deepEqual(waarde, rect); assert.equal(captured, null);
props.onKeyDown({ key: 'ArrowRight', shiftKey: true, preventDefault() {}, stopPropagation() {} });
assert.equal(waarde.x, 10.1);
props = render(true).props.children[0].props;
const oldCalls = calls;
props.onPointerDown(pointer(0, 0));
props.onKeyDown({ key: 'ArrowRight' });
assert.equal(calls, oldCalls);
console.log('Editor: muis/touch/pen-events, schaalomrekening, pointercancel, verloren capture, Escape, fijn toetsenbordwerk en blokkering tijdens opslaan geslaagd.');
