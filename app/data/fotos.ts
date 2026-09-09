export const photoNames: Record<string, string> = {
  aardbei: 'aardbei.jpg',
  azarooldoorn: 'azarooldoorn.jpg',
  bieslook: 'bieslook.jpg',
  bosbes: 'bosbes.jpg',
  citroenmelisse: 'citroenmelisse.jpg',
  dragon: 'dragon.jpg',
  'edel-duizendblad': 'edel_duizendblad.JPG',
  framboos: 'framboos.jpg',
  kardinaalmuts: 'kardinaalsmuts.jpg',
  kiwi: 'kiwi.JPEG',
  knopherik: 'knopherik.jpg',
  lavendel: 'Lavendel.jpg',
  marjolein: 'marjolein.jpg',
  meidoorn: 'meidoorn.jpg',
  munt: 'munt.jpg',
  'rode-bes': 'rode_bes.JPG',
  rozemarijn: 'rozemarijn.jpg',
  salie: 'salie.jpg',
  'spaanse-aak': 'spaanse_aak.JPEG',
  teunisbloem: 'teunisbloem.jpg',
  tijm: 'Thyme.jpg',
  venkel: 'venkel.jpg',
  wegedoorn: 'wegedoorn.JPEG',
  'witte-moerbei': 'witte_moerbei.jpg',
  'zwarte-bes': 'zwarte bes.jpg',
};

/** Pad naar de foto van een plant, of null wanneer er (nog) geen foto is. */
export function plantFoto(slug: string) {
  const naam = photoNames[slug];
  if (!naam) return null;

  // Gebruik voor de website de aangeleverde, gecomprimeerde WebP-versie.
  // De oorspronkelijke bestandsnaam blijft hierboven behouden voor de bron-/fotokoppeling.
  const webNaam = naam.replace(/\.[^.]+$/, '.webp');
  return `/fotos-web/${encodeURIComponent(webNaam)}`;
}
