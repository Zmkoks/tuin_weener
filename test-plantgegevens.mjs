import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { DatabaseSync } from 'node:sqlite';
const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} }; cache.set(file, mod.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const localRequire = name => {
    if (name === 'cloudflare:workers') return { env: {} };
    if (name.endsWith('AfbeeldingVeld') || name.endsWith('SymboolVeld')) return {};
    if (!name.startsWith('.')) return require(name);
    const target = path.resolve(path.dirname(file), name);
    if (target.endsWith('.json')) return JSON.parse(fs.readFileSync(target));
    return load(fs.existsSync(target + '.ts') ? target + '.ts' : target + '.tsx');
  };
  new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
  cache.set(file, mod.exports); return mod.exports;
}
const { alleFuncties } = load('app/data/functies.ts');
const { plantUitRegel, regelVanPlant } = load('db/velden.ts');
const { leesPlant } = load('app/lib/plantInvoer.ts');
const { formVanPlant, toPayload } = load('app/components/plantFormulier.tsx');
const { fotoVan, illustratieVan } = load('app/data/afbeeldingen.ts');
const { PLANT_BEOORDELINGEN, metPlantBeoordeling } = load('app/data/plantBeoordelingen.ts');
const { MIGRATIES } = load('db/opzet.ts');
const planten = JSON.parse(fs.readFileSync('app/data/planten.json'));
const bron = JSON.parse(fs.readFileSync('../sept_data.json')).planten;
assert.equal(planten.length, 25);
assert.deepEqual(planten.map(p => p.slug).sort(), bron.map(p => p.id).sort());
assert.deepEqual(Object.keys(PLANT_BEOORDELINGEN).sort(), planten.map(p => p.slug).sort());
for (const plant of planten) {
  const b = bron.find(b => b.id === plant.slug);
  if (b) assert.deepEqual(plant.functies, { primair: b.functies.primair, secundair: b.functies.secundair });
  const gelezen = leesPlant(toPayload(formVanPlant(plant)), plant.slug, plant.plantnummer);
  assert.ok('plant' in gelezen, `${plant.slug}: ${gelezen.fout}`);
  assert.deepEqual(gelezen.plant.functies, plant.functies);
  assert.equal(gelezen.plant.foto.bron, plant.foto.bron);
  assert.equal(gelezen.plant.illustratie?.bron, plant.illustratie?.bron);
  if (b) {
    assert.ok(fotoVan(plant)?.src);
    assert.ok(illustratieVan(plant)?.src);
  }
}
// De rondgang door de database: plant -> regel -> plant. Dit is de laag waar een veld
// stilzwijgend kan verdwijnen, dus alle planten gaan er heen en terug doorheen.
for (const plant of planten) {
  const terug = plantUitRegel(regelVanPlant(plant), []);
  for (const veld of Object.keys(plant)) {
    assert.deepEqual(terug[veld], plant[veld], `${plant.slug}: veld ${veld} overleeft de database niet`);
  }
}

// Een lege komma-lijst is een lege lijst, en niet een lijst met een leeg woord.
assert.deepEqual(plantUitRegel({ slug: 'x', naam: 'X', oogst_tijd: '' }, []).oogstTijd, []);

// Geen keuze in de symbolen betekent "alle tekeningen uit de bibliotheek", en dat is iets
// anders dan "geen enkele". Zonder dat onderscheid kon niemand ooit alles uitzetten.
assert.equal(plantUitRegel({ slug: 'x', naam: 'X', symbolen_bibliotheek: null }, []).symbolen, undefined);
assert.deepEqual(plantUitRegel({ slug: 'x', naam: 'X', symbolen_bibliotheek: '' }, []).symbolen,
  { bibliotheek: [], eigen: [] });

// Een plant zonder foto houdt geen leeg fotoveld over: fotoVan() zou dan de afstelling uit
// foto_instellingen.json overschrijven met 50/50/1 en alle foto's anders in beeld zetten.
const zonderFoto = plantUitRegel({ slug: 'x', naam: 'X', foto_ingesteld: 0 }, []);
assert.equal(zonderFoto.foto, undefined);

// Ja/nee/onbeoordeeld blijft een driestand in de database. Ook de begeleidende teksten
// moeten een lees-en-schrijf-rondgang zonder verlies overleven.
const beoordeling = {
  ...planten[0],
  eetbaar: true,
  eetbaarInfo: 'Alleen de rijpe vrucht.',
  oogstbaarInTuin: false,
  tuinOpmerking: 'Dit exemplaar draagt niet.',
  boomHeester: true,
  gevaarlijk: false,
  gevaarlijkInfo: '',
  waaromLatenStaan: 'De bloemen geven voedsel aan insecten.',
};
const beoordelingTerug = plantUitRegel(regelVanPlant(beoordeling), []);
for (const veld of ['eetbaar', 'eetbaarInfo', 'oogstbaarInTuin', 'tuinOpmerking', 'boomHeester', 'gevaarlijk', 'gevaarlijkInfo', 'waaromLatenStaan']) {
  assert.deepEqual(beoordelingTerug[veld], beoordeling[veld], `veld ${veld} overleeft de database niet`);
}
assert.equal(plantUitRegel({ slug: 'x', naam: 'X', eetbaar: null, gevaarlijk: null }, []).eetbaar, null);

// Totdat de formulierstap klaar is, bewaart een wijziging de al beoordeelde nieuwe velden.
const zonderNieuweVelden = toPayload(formVanPlant(planten[0]));
for (const veld of ['eetbaar', 'eetbaarInfo', 'oogstbaarInTuin', 'tuinOpmerking', 'boomHeester', 'gevaarlijk', 'gevaarlijkInfo', 'waaromLatenStaan']) {
  delete zonderNieuweVelden[veld];
}
const bewaard = leesPlant(zonderNieuweVelden, beoordeling.slug, beoordeling.plantnummer, beoordeling);
assert.ok('plant' in bewaard);
assert.equal(bewaard.plant.eetbaar, true);
assert.equal(bewaard.plant.eetbaarInfo, beoordeling.eetbaarInfo);
assert.equal(bewaard.plant.oogstbaarInTuin, false);
assert.equal(bewaard.plant.tuinOpmerking, beoordeling.tuinOpmerking);
assert.equal(bewaard.plant.boomHeester, true);

const beoordeeldePlanten = planten.map(metPlantBeoordeling);
assert.ok(beoordeeldePlanten.every((plant) => typeof plant.eetbaar === 'boolean'));
assert.ok(beoordeeldePlanten.every((plant) => typeof plant.gevaarlijk === 'boolean'));
assert.ok(beoordeeldePlanten.every((plant) => typeof plant.oogstbaarInTuin === 'boolean'));
assert.ok(beoordeeldePlanten.every((plant) => typeof plant.boomHeester === 'boolean'));
assert.deepEqual(beoordeeldePlanten.filter((plant) => plant.boomHeester).map((plant) => plant.slug).sort(),
  ['azarooldoorn', 'kardinaalmuts', 'meidoorn', 'spaanse-aak', 'wegedoorn', 'witte-moerbei']);
assert.deepEqual(beoordeeldePlanten.find((plant) => plant.slug === 'venkel').functies,
  { primair: ['kruid', 'insecten'], secundair: [] });
assert.equal(beoordeeldePlanten.find((plant) => plant.slug === 'kiwi').eetbaar, true);
assert.equal(beoordeeldePlanten.find((plant) => plant.slug === 'kiwi').oogstbaarInTuin, false);
assert.deepEqual(beoordeeldePlanten.filter((plant) => plant.eetbaar && !plant.oogstbaarInTuin).map((plant) => plant.slug).sort(),
  ['kiwi', 'witte-moerbei']);
assert.deepEqual(beoordeeldePlanten.find((plant) => plant.slug === 'kiwi').functies,
  { primair: ['sier'], secundair: [] });
assert.equal(beoordeeldePlanten.find((plant) => plant.slug === 'kiwi').oogstMomenten.length, 0);
assert.ok(beoordeeldePlanten.find((plant) => plant.slug === 'azarooldoorn').oogstTijd.length > 0);

const vast = planten[0];
for (const functies of [{ primair: [], secundair: [] }, { primair: ['fruit'], secundair: ['fruit'] }, { primair: ['fout'], secundair: [] }]) {
  assert.ok('fout' in leesPlant({ ...vast, functies }, vast.slug, vast.plantnummer));
}
// De verwijderde proefplant komt ook via migraties niet terug.
const proefDatabase = new DatabaseSync(':memory:');
for (const migratie of MIGRATIES) for (const stap of migratie.stappen) proefDatabase.exec(stap);
assert.equal(proefDatabase.prepare("SELECT 1 FROM planten WHERE slug = 'reuzenberenklauw'").get(), undefined);
proefDatabase.close();
console.log(`Geslaagd: ${planten.length} planten, formulier/opslag-rondgang, bronnen, de rondgang door de database en ongeldige functies.`);
