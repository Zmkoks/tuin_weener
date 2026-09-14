import type { Plant } from '../data/plantTypes';
import type { Plek } from '../data/plekTypes';
import { oogstInTuin } from '../data/tuinTekst';

/**
 * Wat er deze maand in de tuin te doen is.
 *
 * Stond eerst als losse regel in `app/page.tsx`. Zodra de plattegrond dezelfde vraag stelt
 * ("waar moet ik deze maand zijn?") zouden er twee definities van "een taak" naast elkaar
 * staan, en die lopen vroeg of laat uiteen. Vandaar hier, op één plek.
 */

export const MAANDEN = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

export type TaakSoort = 'oogst' | 'snoei';
export type Taak = { plant: Plant; soort: TaakSoort };

/** Wat er op het tegeltje en in het bijschrift komt te staan. */
export const TAAK_NAAM: Record<TaakSoort, string> = { oogst: 'Oogsten', snoei: 'Snoeien' };

/**
 * Elke plant kan in dezelfde maand twee taken hebben (munt wordt in september zowel geoogst
 * als gesnoeid), dus dit levert er meer op dan er planten zijn.
 */
export function takenVoor(planten: Plant[], maand: string): Taak[] {
  return planten.flatMap((plant) => {
    const taken: Taak[] = [];
    if (oogstInTuin(plant) && [...plant.oogstTijd, ...plant.extraOogstTijd].includes(maand)) taken.push({ plant, soort: 'oogst' });
    if (plant.snoeiTijd.includes(maand)) taken.push({ plant, soort: 'snoei' });
    return taken;
  });
}

export type PlekTaak = { plek: Plek; soorten: TaakSoort[]; taken: Taak[] };

/**
 * Dezelfde taken, maar gegroepeerd naar de plek waar ze staan — voor het kaartje.
 *
 * Per plek houden we alleen de *soorten* over, niet elke taak apart: in een bak met drie te
 * snoeien planten hoeft geen drie keer dezelfde schaar te staan. Gemeten over september komt
 * geen enkele plek boven de twee soorten uit, dus er staan er nooit meer dan twee naast
 * elkaar. De namen gaan wel allemaal mee, voor het tekstballonnetje.
 *
 * `beplanting` is de stand uit de database; staat een plek daar niet in, dan geldt de
 * uitgangssituatie uit `tuin.json` — dezelfde regel als elders op de site.
 */
export function takenPerPlek(taken: Taak[], plekken: Plek[], beplanting: Record<string, string[]>): PlekTaak[] {
  return plekken
    .map((plek) => {
      const hier = beplanting[plek.id] || plek.planten;
      const raak = taken.filter((taak) => hier.includes(taak.plant.slug));
      const soorten = (['oogst', 'snoei'] as TaakSoort[]).filter((soort) => raak.some((taak) => taak.soort === soort));
      return { plek, soorten, taken: raak };
    })
    .filter((plek) => plek.soorten.length > 0);
}
