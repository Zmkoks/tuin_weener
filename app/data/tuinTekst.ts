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
 * Hoe je een plek in een zin noemt: "plantvak 2", "boom of heester D".
 *
 * Een plek die op de site is bijgemaakt heeft geen label - die staat niet op de gedrukte
 * kaart en heeft dus geen nummer of letter. Daar wordt het "deze plek", want een zin als
 * "zet je de munt op plantvak ?" is erger dan geen naam.
 */
export function plekNaam(plek: { label: string; soort: string }) {
  return plek.label ? `${soortNaam(plek.soort).toLowerCase()} ${plek.label}` : 'deze plek';
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

/**
 * Of oogsten bij deze plant een gewone taak is: primair fruit of kruid, en niet uitdrukkelijk
 * oneetbaar of zonder opbrengst in deze tuin. `null` (nog niet beoordeeld) telt niet als nee,
 * anders verliest een nieuwe plant zijn oogst voordat iemand hem heeft kunnen beoordelen.
 * Andere eetbaarheid (lavendel, azarooldoorn) staat onder "Extra informatie".
 */
export function oogstInTuin(plant: Plant) {
  const soort = plant.functies.primair.includes('fruit') || plant.functies.primair.includes('kruid');
  return soort && plant.eetbaar !== false && plant.oogstbaarInTuin !== false;
}

/** Wat er deze maand bij een plant te doen is. Leeg = niets te doen. */
export function takenVoorMaand(plant: Plant, maand: string): Taak[] {
  const taken: Taak[] = [];
  if (oogstInTuin(plant) && [...plant.oogstTijd, ...plant.extraOogstTijd].includes(maand)) {
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
