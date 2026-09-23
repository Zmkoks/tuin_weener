/**
 * Momenten in het jaar: per moment de maanden en wat je dan doet. Gebruikt voor snoeien
 * (`snoeiMomenten`) en oogsten (`oogstMomenten`).
 *
 * Wintervoorbereiding gebruikt hetzelfde momentmodel als snoeien en oogsten.
 * Hiervoor was het per onderwerp één maandlijst en één tekst voor alle momenten samen. De
 * maandtaak liet dan in juni bij de kiwi ook de winterinstructie zien. Nu hoort bij elke
 * maand precies één tekst.
 *
 * `snoeiTijd` en `oogstTijd` bestaan nog wel op een plant, maar zijn afgeleid: alle maanden
 * van alle momenten samen, in kalendervolgorde. Kalender, plattegrond en taken gebruiken die.
 *
 * Een moment zonder maanden mag: "wanneer nodig" (gevlekte scheerling).
 */
export type Moment = { maanden: string[]; wat: string };

const MAANDEN = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

const alsMaand = (waarde: unknown) =>
  typeof waarde === 'string' ? MAANDEN.find((maand) => maand.toLowerCase() === waarde.trim().toLowerCase()) : undefined;

/** Maanden in kalendervolgorde, zonder dubbele en zonder onbekende. */
function maandlijst(waarden: readonly unknown[]): string[] {
  const gekozen = new Set(waarden.map(alsMaand).filter(Boolean));
  return MAANDEN.filter((maand) => gekozen.has(maand));
}

/** Alle maanden van alle momenten, in kalendervolgorde. */
export function maandenVan(momenten: readonly Moment[]): string[] {
  return maandlijst(momenten.flatMap((moment) => moment.maanden));
}

/** Wat je in deze maand doet; leeg als deze maand niet bij een moment hoort. */
export function watInMaand(momenten: readonly Moment[], maand: string): string {
  return momenten.filter((moment) => moment.maanden.includes(maand)).map((moment) => moment.wat).filter(Boolean).join(' ');
}

/**
 * Momenten uit wat er binnenkomt: een lijst uit de database, het formulier of een LLM-antwoord.
 * Ontbreekt die lijst, dan worden de oude velden momenten (oudere antwoorden en regels van
 * vóór de migratie): elk paar [maanden, tekst] met inhoud wordt één moment.
 */
export function leesMomenten(waarde: unknown, ...oud: [readonly string[], string][]): Moment[] {
  const ruw = typeof waarde === 'string' ? veiligJson(waarde) : waarde;
  if (Array.isArray(ruw)) {
    return ruw.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const record = item as Record<string, unknown>;
      const maanden = Array.isArray(record.maanden) ? maandlijst(record.maanden) : [];
      const wat = typeof record.wat === 'string' ? record.wat.trim() : '';
      return maanden.length || wat ? [{ maanden, wat }] : [];
    });
  }
  return oud.flatMap(([maanden, tekst]) => {
    const lijst = maandlijst(maanden);
    return lijst.length || tekst.trim() ? [{ maanden: lijst, wat: tekst.trim() }] : [];
  });
}

function veiligJson(tekst: string): unknown {
  try { return JSON.parse(tekst); } catch { return null; }
}

/** "Januari – Maart", "Juni, Augustus" of "Wanneer nodig" — voor site en boekje. */
export function momentLabel(moment: Moment): string {
  const nummers = moment.maanden.map((maand) => MAANDEN.indexOf(maand)).sort((a, b) => a - b);
  if (nummers.length === 0) return 'Wanneer nodig';
  const aaneengesloten = nummers.every((nummer, i) => i === 0 || nummer === nummers[i - 1] + 1);
  if (nummers.length > 2 && aaneengesloten) return `${MAANDEN[nummers[0]]} – ${MAANDEN[nummers[nummers.length - 1]]}`;
  return nummers.map((nummer) => MAANDEN[nummer]).join(', ');
}
