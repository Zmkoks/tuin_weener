/**
 * De iconen uit de plantenkaarten (maak_infokaarten.py), overgenomen in `public/iconen`.
 * Zelfde koppeling functie -> bestand als op de gedrukte kaart.
 */

export const functieIcoon: Record<string, string> = {
  fruit: 'fruit',
  kruid: 'kruid',
  insecten: 'bij',
  vogel: 'vogel',
  sier: 'sier',
  boom: 'boom',
  onkruid: 'onkruid',
};

/** Standplaats-icoon: zon, halfschaduw of schaduw. */
export function standplaatsIcoon(zon: string) {
  const tekst = zon.toLowerCase();
  if (tekst.includes('halfschaduw')) return 'halfschaduw';
  if (tekst.includes('schaduw')) return 'schaduw';
  return 'zon';
}

export const icoonPad = (naam: string) => `/iconen/${naam}.svg`;
