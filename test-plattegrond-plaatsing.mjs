import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

function loader() {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} };
    cache.set(filename, mod);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (name) => {
      if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
      const target = name.startsWith('@/')
        ? path.resolve(name.slice(2))
        : path.resolve(path.dirname(filename), name);
      return load(path.extname(target) ? target : `${target}.ts`);
    };
    new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
    return mod.exports;
  }
  return load;
}

const plaatsing = loader()('app/lib/plattegrondPlaatsing.ts');
const { berekenPlantPlaatsingen, MAX_PLANT_HOOGTE } = plaatsing;
const plants = [
  { slug: 'lavendel', symbolen: { bibliotheek: ['plant-lavendel'] } },
  { slug: 'munt', symbolen: { bibliotheek: ['plant-munt'] } },
  { slug: 'eigen', symbolen: { eigen: [{ bestand: 'eigen.svg' }] } },
];
const zones = [
  { id: 'groot-vak', soort: 'bak', vorm: { type: 'rect', x: 10, y: 10, b: 100, h: 120 } },
  { id: 'groot-vrij', soort: 'vrij', vorm: { type: 'ellipse', cx: 100, cy: 210, rx: 70, ry: 40 } },
];
const placements = {
  'groot-vak': ['lavendel', 'munt'],
  'groot-vrij': ['eigen'],
};
const symbolen = {
  lavendel: [{ id: 'plant-lavendel', verhouding: 0.8 }],
  munt: [{ id: 'plant-munt', verhouding: 0.8 }],
  eigen: [],
};

const tekeningen = berekenPlantPlaatsingen(zones, plants, placements, symbolen, 7);
assert.ok(tekeningen.length > 0, 'er zijn planttekeningen');
assert.ok(tekeningen.every(({ hoogte }) => hoogte <= MAX_PLANT_HOOGTE + 1e-9), 'geen plant is hoger dan de maximummaat');
assert.equal(tekeningen.filter(({ plantSlug }) => plantSlug === 'lavendel')[0].hoogte, MAX_PLANT_HOOGTE, 'grote lavendel wordt afgekapt');
assert.equal(tekeningen.filter(({ plantSlug }) => plantSlug === 'eigen')[0].hoogte, MAX_PLANT_HOOGTE, 'eigen symbool volgt dezelfde maximummaat');

const klein = berekenPlantPlaatsingen(
  [{ id: 'klein', soort: 'bak', vorm: { type: 'rect', x: 10, y: 10, b: 20, h: 14 } }],
  plants,
  { klein: ['lavendel'] },
  symbolen,
  7,
);
assert.ok(klein.every(({ hoogte }) => hoogte < MAX_PLANT_HOOGTE), 'kleine bakken houden hun oorspronkelijke maat');
console.log('Plantplaatsing: maximummaat voor gewone en eigen symbolen, grote en kleine vormen geslaagd.');
