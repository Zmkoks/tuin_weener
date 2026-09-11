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
function loader() {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    const localRequire = (name) => {
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
let plants = load('db/planten.ts');
const fixtures = JSON.parse(fs.readFileSync('app/data/planten.json', 'utf8'));
await plants.maakPlant(fixtures[0]);
await plants.maakPlant(fixtures[1]);
const before = await plants.leesPlanten();
assert.ok(before.length > 1);
const victim = before[0];
const untouched = before[1];
sqlite.prepare('INSERT OR REPLACE INTO beplanting (plek_id, plant_slug, gewijzigd_op) VALUES (?, ?, ?)').run('test-plek', victim.slug, 'nu');
sqlite.prepare('INSERT OR REPLACE INTO plant_symbolen (plant_slug, volgorde, bestand, bron) VALUES (?, ?, ?, ?)').run(victim.slug, 999, '/test.svg', 'test');
const route = load('app/api/planten/[slug]/route.ts');
const params = { params: Promise.resolve({ slug: victim.slug }) };
assert.equal((await route.DELETE(new Request('http://test/'), params)).status, 401);
assert.ok(await plants.leesPlant(victim.slug));
// Een fout halverwege mag koppelingen niet gedeeltelijk wissen.
sqlite.exec("CREATE TRIGGER test_failure BEFORE DELETE ON planten BEGIN SELECT RAISE(ABORT, 'test failure'); END");
await assert.rejects(plants.verwijderPlant(victim.slug));
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM plant_symbolen WHERE plant_slug = ?').get(victim.slug).n, 1);
sqlite.exec('DROP TRIGGER test_failure');
assert.equal((await route.DELETE(new Request('http://test/', { headers: { 'x-test-session': 'valid' } }), params)).status, 200);
assert.equal((await route.DELETE(new Request('http://test/', { headers: { 'x-test-session': 'valid' } }), params)).status, 404);
assert.equal(await plants.leesPlant(victim.slug), null);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM beplanting WHERE plant_slug = ?').get(victim.slug).n, 0);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM plant_symbolen WHERE plant_slug = ?').get(victim.slug).n, 0);
assert.deepEqual(await plants.leesPlant(untouched.slug), untouched);
// Een nieuwe Worker mag een verwijderde startplant niet terugbrengen.
load = loader(); plants = load('db/planten.ts');
assert.equal(await plants.leesPlant(victim.slug), null);
for (const plant of await plants.leesPlanten()) await plants.verwijderPlant(plant.slug);
load = loader(); plants = load('db/planten.ts');
assert.deepEqual(await plants.leesPlanten(), []);
assert.ok(sqlite.prepare('SELECT COUNT(*) AS n FROM plekken').get().n > 0);
sqlite.close();
console.log('Verwijderen gecontroleerd: koppelingen weg, andere planten intact, geen terugkeer na herladen of lege bibliotheek.');
