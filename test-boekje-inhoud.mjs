import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const module = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('app/lib/boekjeInhoud.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
new Function('module', 'exports', code)(module, module.exports);
const { maakBoekjeInhoud } = module.exports;
const plant = (slug, naam = slug) => ({ slug, naam });
const plek = (id, label, planten, soort = 'bak') => ({ id, label, planten, soort });

// De actuele lege lijst mag nooit terugvallen op oude beplanting. Een plant komt
// één keer in de inhoud, maar bij ieder vak in de zoeklijst. Heesterletters dedupliceren.
const planten = [plant('munt'), plant('aardbei'), plant('boom'), plant('bibliotheek')];
const plekken = [plek('1', '1', ['bibliotheek']), plek('2', '2', ['munt']),
  plek('10', '10', ['munt', 'aardbei']), plek('a1', 'A', ['boom'], 'heester'), plek('a2', 'A', ['boom'], 'heester')];
const plan = maakBoekjeInhoud(planten, plekken, { '1': [] });
assert.deepEqual(plan.planten.map(p => p.slug), ['aardbei', 'boom', 'munt']);
assert.deepEqual(plan.zoekPaginas.flat(2).map(r => [r.label, r.slug]), [['2', 'munt'], ['10', 'aardbei'], ['10', 'munt'], ['A', 'boom']]);
assert.equal(plan.nummers.kaart, 3);
assert.equal(plan.nummers.planten, 14);
assert.deepEqual(plan.paginaVan, { aardbei: 14, boom: 15, munt: 16 });
for (const row of plan.zoekPaginas.flat(2)) assert.equal(row.pagina, plan.paginaVan[row.slug]);

// Extra inhouds- én zoekpagina's mogen verwijzingen of linker-/rechterspreads
// niet breken. Lange namen moeten eerder een nieuwe kolom krijgen.
for (const aantal of [0, 1, 26, 40, 80, 150]) {
  const soorten = Array.from({ length: aantal }, (_, i) => plant(`plant-${i}`, `${String(i).padStart(3, '0')} plant met een langere naam`));
  const vakken = soorten.flatMap((p, i) => [plek(`vak-${i}`, String(i + 1), [p.slug]), plek(`vrij-${i}`, String(i + 201), [p.slug], 'vrij')]);
  const test = maakBoekjeInhoud(soorten, vakken, {});
  assert.equal(test.inhoudPaginas.flat(2).length, aantal);
  assert.equal(test.zoekPaginas.flat(2).length, aantal * 2);
  assert.equal(test.nummers.kaart % 2, 1);
  assert.equal(test.nummers.termen % 2, 0);
  assert.equal(test.nummers.sectie % 2, 1);
  assert.equal(test.nummers.planten, test.nummers.sectie + 1);
  test.planten.forEach((p, i) => assert.equal(test.paginaVan[p.slug], test.nummers.planten + i));
  for (const row of test.zoekPaginas.flat(2)) assert.equal(row.pagina, test.paginaVan[row.slug]);
}
console.log('Boekje: actuele beplanting, alfabetische inhoud, zoekverwijzingen en spreads bij 0–150 planten kloppen.');
