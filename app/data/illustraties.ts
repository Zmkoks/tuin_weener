/**
 * Botanische illustraties uit `boekje_v1/images/`, overgenomen in `public/illustraties`.
 * Alle 25 planten hebben er een. De extensies lopen door elkaar — meestal .jpg, maar
 * aardbei en kiwi bestaan alleen als .png — dus net als bij de foto's staat hier de
 * bestandsnaam, niet alleen de slug.
 */
export const illustratieNamen: Record<string, string> = {
  aardbei: 'aardbei.png',
  azarooldoorn: 'azarooldoorn.jpg',
  bieslook: 'bieslook.jpg',
  bosbes: 'bosbes.jpg',
  citroenmelisse: 'citroenmelisse.jpg',
  dragon: 'dragon.jpg',
  'edel-duizendblad': 'edel-duizendblad.jpg',
  framboos: 'framboos.jpg',
  kardinaalmuts: 'kardinaalmuts.jpg',
  kiwi: 'kiwi.png',
  knopherik: 'knopherik.jpg',
  lavendel: 'lavendel.jpg',
  marjolein: 'marjolein.jpg',
  meidoorn: 'meidoorn.jpg',
  munt: 'munt.jpg',
  'rode-bes': 'rode-bes.jpg',
  rozemarijn: 'rozemarijn.jpg',
  salie: 'salie.jpg',
  'spaanse-aak': 'spaanse-aak.jpg',
  teunisbloem: 'teunisbloem.jpg',
  tijm: 'tijm.jpg',
  venkel: 'venkel.jpg',
  wegedoorn: 'wegedoorn.jpg',
  'witte-moerbei': 'witte-moerbei.jpg',
  'zwarte-bes': 'zwarte-bes.jpg',
};

/** Pad naar de botanische illustratie van een plant, of null wanneer die er (nog) niet is. */
export function plantIllustratie(slug: string) {
  const naam = illustratieNamen[slug];
  return naam ? `/illustraties/${encodeURIComponent(naam)}` : null;
}
