import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} };
  cache.set(file, mod.exports);
  let source = fs.readFileSync(file, 'utf8');
  // Test de echte importfuncties zonder test-exports aan de browsercomponent toe te voegen.
  if (file.endsWith('PlantCreator.tsx')) source += '\nexport { AUTOMATION_PROMPT, normalizeParsed, parseJsonAnswer };';
  const code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const localRequire = name => {
    if (name.endsWith('AfbeeldingVeld') || name.endsWith('SymboolVeld')) return {};
    if (!name.startsWith('.')) return require(name);
    const target = path.resolve(path.dirname(file), name);
    if (target.endsWith('.json')) return JSON.parse(fs.readFileSync(target, 'utf8'));
    return load(fs.existsSync(target + '.ts') ? target + '.ts' : target + '.tsx');
  };
  new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
  cache.set(file, mod.exports);
  return mod.exports;
}

const { AUTOMATION_PROMPT, normalizeParsed, parseJsonAnswer } = load('app/PlantCreator.tsx');
const { toPayload } = load('app/components/plantFormulier.tsx');
const { leesPlant } = load('app/lib/plantInvoer.ts');
const { plantUitRegel, regelVanPlant } = load('db/velden.ts');
const schemaText = AUTOMATION_PROMPT.match(/\n(\{[\s\S]*?\n\})\s*\n\s*Mijn plantbeschrijving/)?.[1];
assert.ok(schemaText, 'De gekopieerde prompt bevat het JSON-voorbeeld.');
const schema = JSON.parse(schemaText);
assert.equal(typeof schema.boomHeester, 'boolean');
assert.equal(schema.eetbaar, null);
assert.equal(schema.gevaarlijk, null);
assert.equal(schema.oogstbaarInTuin, null);

// Kunstmatige antwoorden controleren de gegevensstroom, niet de botanische inhoud.
const voorbeelden = [
  { naam: 'Boom of heester', boomHeester: true, eetbaar: false, gevaarlijk: false, functies: { primair: ['sier'], secundair: [] } },
  { naam: 'Eetbare plant', boomHeester: false, eetbaar: true, gevaarlijk: false, functies: { primair: ['kruid'], secundair: [] }, oogstMomenten: [{ maanden: ['Juni', 'Juli'], wat: 'Pluk de jonge bladeren.' }] },
  { naam: 'Gevaarlijk onkruid', boomHeester: false, eetbaar: false, gevaarlijk: true, functies: { primair: ['onkruid'], secundair: [] }, gevaarlijkInfo: 'Vermijd contact met het sap.' },
  { naam: 'Veilig onkruid', boomHeester: false, eetbaar: false, gevaarlijk: false, functies: { primair: ['onkruid'], secundair: [] }, waaromLatenStaan: 'De bloemen geven voedsel aan insecten.' },
  { naam: 'Nog niet beoordeeld', boomHeester: false, eetbaar: null, gevaarlijk: null },
];
const bestaandePlanten = [{ plantnummer: '4' }, { plantnummer: '28' }];
for (const voorbeeld of voorbeelden) {
  const antwoord = { ...schema, ...voorbeeld, tuinOpmerking: 'Staat in onze tuin.' };
  const form = normalizeParsed(parseJsonAnswer(JSON.stringify(antwoord)), bestaandePlanten);
  assert.equal(form.boomHeester, antwoord.boomHeester ? 'ja' : 'nee');
  assert.equal(form.plantnummer, '29');
  assert.equal(form.oogstbaarInTuin, '');
  for (const veld of ['eetbaar', 'gevaarlijk']) {
    assert.equal(form[veld], antwoord[veld] === null ? '' : antwoord[veld] ? 'ja' : 'nee');
  }
  const gelezen = leesPlant(toPayload(form), 'llm-proef', '29');
  assert.ok('plant' in gelezen, gelezen.fout);
  const terug = plantUitRegel(regelVanPlant(gelezen.plant), []);
  for (const veld of ['boomHeester', 'eetbaar', 'gevaarlijk', 'oogstbaarInTuin', 'tuinOpmerking', 'waaromLatenStaan', 'gevaarlijkInfo', 'oogstMomenten']) {
    assert.deepEqual(terug[veld], antwoord[veld], `${voorbeeld.naam}: ${veld} blijft behouden.`);
  }
}

for (const [waarde, verwacht] of [[true, 'ja'], [false, 'nee'], ['ja', 'ja'], ['nee', 'nee'], ['TRUE', 'ja'], ['FALSE', 'nee'], ['yes', 'ja'], ['no', 'nee']]) {
  assert.equal(normalizeParsed({ ...schema, boomHeester: waarde }, []).boomHeester, verwacht);
}
const engels = normalizeParsed({ name: 'Proef', botanicalName: 'Test', treeOrShrub: true, edible: false, dangerous: true, functions: { primary: ['sier'], secondary: [] } }, []);
assert.equal(engels.boomHeester, 'ja');
assert.equal(engels.eetbaar, 'nee');
assert.equal(engels.gevaarlijk, 'ja');
// Een model mag de plaatselijke oogstbeslissing niet alvast nemen.
for (const waarde of [true, false, null, 'ja', 'nee']) {
  assert.equal(normalizeParsed({ ...schema, oogstbaarInTuin: waarde }, []).oogstbaarInTuin, '');
}
// Snoeimomenten: nieuw formaat per moment, oud formaat wordt één moment, en alles overleeft de database.
const momenten = [{ maanden: ['januari', 'Februari'], wat: 'Winter.' }, { maanden: ['Juni'], wat: 'Zomer.' }];
const snoeiForm = normalizeParsed({ ...schema, snoeiMomenten: momenten }, []);
assert.deepEqual(snoeiForm.snoeiMomenten, [{ maanden: ['Januari', 'Februari'], wat: 'Winter.' }, { maanden: ['Juni'], wat: 'Zomer.' }]);
assert.deepEqual(normalizeParsed({ ...schema, snoeiMomenten: undefined, snoeiTijd: ['Maart', 'augustus'], snoeiTijdInfo: 'Oud.' }, []).snoeiMomenten, [{ maanden: ['Maart', 'Augustus'], wat: 'Oud.' }]);
{
  const gelezen = leesPlant(toPayload({ ...snoeiForm, naam: 'Proef', botanischeNaam: 'Test', intro: 'Intro.', functiesPrimair: 'sier' }), 'proef', '99');
  assert.ok('plant' in gelezen, gelezen.fout);
  assert.deepEqual(gelezen.plant.snoeiTijd, ['Januari', 'Februari', 'Juni']);
  const terug = plantUitRegel(regelVanPlant(gelezen.plant), []);
  assert.deepEqual(terug.snoeiMomenten, snoeiForm.snoeiMomenten);
  assert.deepEqual(terug.snoeiTijd, ['Januari', 'Februari', 'Juni']);
  // Een databaseregel van vóór migratie 0010 valt terug op de oude kolommen.
  assert.deepEqual(plantUitRegel({ slug: 'x', naam: 'X', snoei_momenten: '', snoei_tijd: 'Maart', snoei_tijd_info: 'Oud.' }, []).snoeiMomenten, [{ maanden: ['Maart'], wat: 'Oud.' }]);
}
// Een ouder antwoord met gewone en extra oogst wordt twee oogstmomenten.
const oud = normalizeParsed({ ...schema, oogstMomenten: undefined, oogstTijd: ['Juni'], oogstMethode: 'Eerste oogst.', extraOogstTijd: ['Oktober'], extraOogstMethode: 'Tweede oogst.' }, []);
assert.deepEqual(oud.oogstMomenten, [{ maanden: ['Juni'], wat: 'Eerste oogst.' }, { maanden: ['Oktober'], wat: 'Tweede oogst.' }]);
assert.deepEqual(parseJsonAnswer('```json\n' + schemaText + '\n```'), schema);
assert.deepEqual(parseJsonAnswer('Hier is de plant:\n' + schemaText), schema);
assert.throws(() => parseJsonAnswer('{"boomHeester": TRUE}'), /niet geldig/);
assert.throws(() => normalizeParsed({ ...schema, functies: { primair: ['kruid'], secundair: ['kruid'] } }, []), /zowel primair als secundair/);
// De gemelde modeluitvoer krijgt een gerichte herstelmelding, geen willekeurige hoofdrol.
const ontbrekendeHoofdrol = { ...schema, naam: 'Gevlekte scheerling', botanischeNaam: 'Conium maculatum', gevaarlijk: true, functies: { primair: [], secundair: ['insecten'] } };
assert.throws(() => normalizeParsed(ontbrekendeHoofdrol, []), /mist een primaire functie/);
// Een bewuste tuinrol 'onkruid' is volledig, ook zonder aanvullende functie.
for (const secundair of [[], ['insecten']]) {
  const hersteld = normalizeParsed({ ...ontbrekendeHoofdrol, functies: { primair: ['onkruid'], secundair } }, []);
  assert.equal(hersteld.functiesPrimair, 'onkruid');
  assert.equal(hersteld.functiesSecundair, secundair.join(', '));
  assert.ok('plant' in leesPlant(toPayload(hersteld), 'llm-proef', '29'));
}
assert.throws(() => normalizeParsed({ ...schema, functies: { primair: ['kruid', 'sier', 'insecten'], secundair: [] } }, []), /maximaal twee/);

// Bronverwijzingen zijn geldige tekst; kopieeropmaak kan de JSON-escapes beschadigen.
const bronAntwoord = {
  ...schema, naam: 'Gevlekte scheerling', botanischeNaam: 'Conium maculatum',
  functies: { primair: ['onkruid'], secundair: [] }, boomHeester: false, gevaarlijk: true,
  weetje: 'Een feit. ([NVWA](https://www.nvwa.nl/))',
  commons: '[Categorie](https://commons.wikimedia.org/wiki/Category:Conium_maculatum)',
  commonsIllustraties: '[Illustraties](https://commons.wikimedia.org/wiki/Category:Conium_maculatum_-_botanical_illustrations)',
};
const bronJson = JSON.stringify(bronAntwoord, null, 2);
const gekopieerd = bronJson.replaceAll('_', '\\_').replaceAll('_(illustrations)', '_\\(illustrations\\)').replaceAll('\n', '\\\n');
assert.throws(() => JSON.parse(gekopieerd));
for (const input of [bronJson, gekopieerd, '"' + gekopieerd + '"', 'Antwoord:\n' + gekopieerd + '\nBron: https://www.nvwa.nl/', JSON.stringify(bronJson)]) {
  const antwoord = parseJsonAnswer(input);
  assert.deepEqual(antwoord, bronAntwoord);
  const form = normalizeParsed(antwoord, []);
  assert.equal(form.weetje, bronAntwoord.weetje);
  assert.equal(form.commons, 'https://commons.wikimedia.org/wiki/Category:Conium_maculatum');
  assert.equal(form.commonsIllustraties, 'https://commons.wikimedia.org/wiki/Category:Conium_maculatum_-_botanical_illustrations');
  assert.equal(form.boomHeester, 'nee');
  assert.equal(form.gevaarlijk, 'ja');
}
assert.equal(normalizeParsed({ ...schema, commonsIllustraties: 'https://commons.wikimedia.org/wiki/Category:Conium_maculatum_-_botanical_illustrations' }, []).commonsIllustraties,
  'https://commons.wikimedia.org/wiki/Category:Conium_maculatum_-_botanical_illustrations');
assert.deepEqual(parseJsonAnswer(bronJson.replace('"naam":', 'citeturn0search0 "naam":')), bronAntwoord);
const geldigeEscapes = { ...schema, intro: 'Regel één\nRegel twee\t"geciteerd"', weetje: 'C:\\tuin\\foto en letterlijk \\_ en \\n' };
assert.deepEqual(parseJsonAnswer(JSON.stringify(geldigeEscapes)), geldigeEscapes);
// Ook bij herstel elders blijven al geldige escapes ongewijzigd.
const gemengd = JSON.stringify({ ...geldigeEscapes, commons: 'https://commons.wikimedia.org/wiki/Category:Conium_maculatum' }).replace('Conium_maculatum', 'Conium\\_maculatum');
assert.equal(parseJsonAnswer(gemengd).intro, geldigeEscapes.intro);
assert.equal(parseJsonAnswer(gemengd).weetje, geldigeEscapes.weetje);
assert.throws(() => parseJsonAnswer('{"naam":"Test" "gevaarlijk":true}'), /niet geldig/);
assert.throws(() => parseJsonAnswer('{"naam":"Test", "gevaarlijk":tru}'), /niet geldig/);
assert.throws(() => parseJsonAnswer('{"naam":"Test", "intro":"ongeldig\\q"}'), /niet geldig/);

// Het volledige gemelde kopieerantwoord, inclusief tijd, stappen en HTML-inspringing.
// We testen het inlezen en gegevensbehoud, niet de botanische adviezen uit dit antwoord.
const brandnetelKopie = fs.readFileSync('test-fixtures/llm-brandnetel-kopie.txt', 'utf8');
assert.throws(() => JSON.parse(brandnetelKopie));
const brandnetel = parseJsonAnswer(brandnetelKopie);
// Dit kopieerantwoord is van vóór de momenten: losse maand- en tekstvelden voor snoei en oogst.
assert.deepEqual(Object.keys(brandnetel), Object.keys(schema).flatMap((k) => ({ snoeiMomenten: ['snoeiTijd', 'snoeiTijdInfo'], oogstMomenten: ['oogstTijd', 'oogstMethode', 'extraOogstTijd', 'extraOogstMethode'] })[k] ?? [k]));
assert.deepEqual(normalizeParsed(brandnetel, []).snoeiMomenten, [{ maanden: [], wat: brandnetel.snoeiTijdInfo }]);
assert.equal(brandnetel.naam, 'Grote brandnetel');
assert.equal(brandnetel.botanischeNaam, 'Urtica dioica');
assert.deepEqual(brandnetel.functies, { primair: ['onkruid'], secundair: ['insecten'] });
assert.equal(brandnetel.weetje, 'Mannelijke en vrouwelijke bloemen groeien meestal op verschillende planten.');
assert.equal(brandnetel.eetbaar, true);
assert.equal(brandnetel.gevaarlijk, false);
const brandnetelForm = normalizeParsed(brandnetel, []);
assert.equal(brandnetelForm.functiesPrimair, 'onkruid');
assert.equal(brandnetelForm.commons, 'https://commons.wikimedia.org/wiki/Category:Urtica_dioica');
assert.equal(brandnetelForm.commonsIllustraties, 'https://commons.wikimedia.org/wiki/Category:Urtica_dioica_-_botanical_illustrations');
assert.ok('plant' in leesPlant(toPayload(brandnetelForm), 'llm-proef', '29'));
assert.throws(() => parseJsonAnswer(brandnetelKopie.replace('"Grote brandnetel",', '"Grote brandnetel"')), /niet geldig/);

// Herstel inspringing alleen buiten strings: letterlijke veldinhoud blijft ongewijzigd.
const tekstMetSpaties = 'Letterlijk &#x20;, &#32;, &nbsp;, &#160;, &#xa0; en\u00a0vaste\u202fspaties.';
for (const spatie of ['&#x20;', '&#X020;', '&#32;', '&#032;', '&nbsp;', '&#160;', '&#xa0;', '\u00a0', '\u202f']) {
  assert.deepEqual(parseJsonAnswer(`Worked for 40s\n1. Gegevens invullen\n{${spatie}"naam": "Test",${spatie}"intro": ${JSON.stringify(tekstMetSpaties)}}`), { naam: 'Test', intro: tekstMetSpaties });
}
assert.throws(() => parseJsonAnswer('{&#x20;"naam": "Test", "eetbaar": tru}'), /niet geldig/);
console.log('Geslaagd: prompt-JSON, antwoordvarianten via formulier en databasevertaling, booleans, kopieeropmaak met tijdmelding/stappen/HTML-spaties, oudere antwoorden en beheerkeuzes.');
