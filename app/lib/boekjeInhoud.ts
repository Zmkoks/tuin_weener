import type { Plant } from '../data/plantTypes';
import type { Plek } from '../data/plekTypes';

export type Zoekregel = { label: string; slug: string; naam: string; pagina: number };

/** Verdeel op geschatte regelhoogte, niet alleen op het aantal planten. De browser meet
 * daarna de echte opmaak. Lange namen krijgen dus ruimte zonder de tekst te verkleinen. */
function kolommen<T>(items: T[], ruimte: number, hoogte: (item: T) => number, maximum = Infinity): T[][] {
  const resultaat: T[][] = [[]];
  let gebruikt = 0;
  for (const item of items) {
    const nodig = hoogte(item);
    if ((gebruikt + nodig > ruimte || resultaat[resultaat.length - 1].length >= maximum) && resultaat[resultaat.length - 1].length) {
      resultaat.push([]);
      gebruikt = 0;
    }
    resultaat[resultaat.length - 1].push(item);
    gebruikt += nodig;
  }
  return resultaat;
}

function perPagina<T>(koloms: T[][], aantal: number): T[][][] {
  return Array.from({ length: Math.ceil(koloms.length / aantal) }, (_, i) => koloms.slice(i * aantal, (i + 1) * aantal));
}

/** Eén paginaplan voor inhoud, zoeklijst én plantenpagina's. Extra planten of plekken
 * kunnen extra indexpagina's geven; alle verwijzingen schuiven dan samen mee.
 * Zoeklijst/kaart en vaktermen/tekeningen blijven linker-/rechterpagina's. */
export function maakBoekjeInhoud(planten: Plant[], plekken: Plek[], beplanting: Record<string, string[]>) {
  const aanwezig = new Set(plekken.flatMap((plek) => beplanting[plek.id] ?? plek.planten));
  const boekPlanten = planten.filter((plant) => aanwezig.has(plant.slug))
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  const perSlug = new Map(boekPlanten.map((plant) => [plant.slug, plant]));
  const zoek: Zoekregel[] = [];
  const gezien = new Set<string>();
  for (const plek of [...plekken].sort((a, b) =>
    Number(a.soort === 'heester') - Number(b.soort === 'heester') || a.label.localeCompare(b.label, 'nl', { numeric: true }))) {
    const hier = (beplanting[plek.id] ?? plek.planten).map((slug) => perSlug.get(slug))
      .filter((plant): plant is Plant => Boolean(plant)).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
    for (const plant of hier) {
      const sleutel = `${plek.soort}:${plek.label}:${plant.slug}`;
      if (gezien.has(sleutel)) continue;
      gezien.add(sleutel);
      zoek.push({ label: plek.label, slug: plant.slug, naam: plant.naam, pagina: 0 });
    }
  }
  const inhoudPaginas = perPagina(kolommen(boekPlanten, 24, (plant) => 1 + Math.ceil(plant.naam.length / 15), 10), 3);
  const zoekPaginas = perPagina(kolommen(zoek, 76, (regel) => 2 + Math.ceil(regel.naam.length / 23)), 2);
  const uitlijnBlanco = (inhoudPaginas.length + zoekPaginas.length) % 2 === 1;
  const zoekStart = inhoudPaginas.length + Number(uitlijnBlanco) + 1;
  const kaart = zoekStart + zoekPaginas.length;
  const nummers = { zoek: zoekStart, kaart, water: kaart + 1, functies: kaart + 2,
    termen: kaart + 3, sectie: kaart + 10, planten: kaart + 11 };
  const paginaVan = Object.fromEntries(boekPlanten.map((plant, i) => [plant.slug, nummers.planten + i]));
  for (const regel of zoek) regel.pagina = paginaVan[regel.slug];
  return { planten: boekPlanten, inhoudPaginas, zoekPaginas, uitlijnBlanco, nummers, paginaVan };
}

export type BoekjeInhoud = ReturnType<typeof maakBoekjeInhoud>;
