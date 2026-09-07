import type { Plant } from './plantTypes';

export const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
export const monthShort = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export const functionLabels: Record<string, string> = { fruit: 'Fruit', kruid: 'Kruiden', insecten: 'Insecten', vogel: 'Vogels', sier: 'Sier', boom: 'Bomen', onkruid: 'Onkruid' };
export const functions = Object.keys(functionLabels);

/**
 * De gedrukte plattegrond kent maar twee groepen: "plantvakken" (1 t/m 15) en
 * "bomen & heesters" (letters). Of een plantvak een bak of vrije grond is, staat wel
 * in de data voor het beheer, maar zegt een bezoeker in de tuin niets.
 */
export function soortNaam(soort: string) {
  return soort === 'heester' ? 'Boom of heester' : 'Plantvak';
}

/** Zelfde naam, in hoofdletters voor een pill. */
export function soortLabel(soort: string) {
  return soortNaam(soort).toUpperCase();
}

/**
 * De twee waterniveaus van een plant, altijd tussen 0 en 5. Het laagste getal zegt hoe
 * droog de plant kan staan, het hoogste hoe vroeg je veilig water mag geven; zie
 * /uitleg/water. 0 betekent: niet ingevuld.
 */
export function waterNiveaus(plant: Plant) {
  const grens = (waarde: string) => Math.max(0, Math.min(5, Math.round(Number.parseFloat(waarde)) || 0));
  return { laag: grens(plant.waterOndergrens), hoog: grens(plant.waterBovengrens) };
}

export type Taak = { type: 'Oogsten' | 'Snoeien'; uitleg: string };

/** Wat er deze maand bij een plant te doen is. Leeg = niets te doen. */
export function takenVoorMaand(plant: Plant, maand: string): Taak[] {
  const taken: Taak[] = [];
  if ([...plant.oogstTijd, ...plant.extraOogstTijd].includes(maand)) {
    taken.push({ type: 'Oogsten', uitleg: plant.oogstMethode || plant.extraOogstMethode });
  }
  if (plant.snoeiTijd.includes(maand)) taken.push({ type: 'Snoeien', uitleg: plant.snoeiMethode });
  return taken;
}

/** Eerste letter als hoofdletter, voor plaatsen waar CSS dat niet kan doen (paginatitels). */
export function hoofdletter(tekst: string) {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

/** Rangen die bij de naam horen: na `subsp.` volgt nog een deel van de naam zelf. */
const RANGEN = new Set(['subsp.', 'ssp.', 'var.', 'f.', 'cv.']);

/**
 * De wetenschappelijke naam zonder de auteursvermelding: "Fragaria × ananassa" in plaats
 * van "Fragaria × ananassa (Duchesne ex Weston) Duchesne ex Rozier".
 *
 * Dat laatste stuk zegt wie de soort beschreven heeft; voor wie in de tuin staat is dat
 * ruis, en bij de aardbei kostte het zes regels naast de foto (59 tekens, terwijl de op één
 * na langste naam er 30 telt). 22 van de 25 planten hebben zo'n toevoeging.
 *
 * Alleen voor het tónen. In de gegevens blijft de volledige naam staan, zodat zoeken op
 * "Duchesne" blijft werken en het drukwerk niets merkt.
 */
export function korteBotanischeNaam(naam: string) {
  const delen = naam.trim().split(/\s+/);
  if (delen.length < 2) return naam;

  const kort = [delen[0]];
  let i = 1;
  // "Fragaria × ananassa": het kruisje hoort bij de naam, de soort komt erna.
  if (delen[i] === '×' || delen[i] === 'x') { kort.push(delen[i]); i += 1; }
  if (delen[i]) { kort.push(delen[i]); i += 1; }
  if (RANGEN.has(delen[i]) && delen[i + 1]) kort.push(delen[i], delen[i + 1]);
  return kort.join(' ');
}
