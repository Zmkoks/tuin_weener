import type { Plant } from './plantTypes';

/**
 * Inhoudelijke beoordeling van de bestaande plantenbibliotheek.
 *
 * `eetbaar` gaat over de soort en het genoemde plantdeel. `oogstbaarInTuin` zegt apart of het
 * aanwezige exemplaar werkelijk iets oplevert. `gevaarlijk` is alleen true als de pagina een
 * duidelijke waarschuwing moet tonen; gewone allergieën en stekels vallen daar niet
 * automatisch onder.
 */
export type PlantBeoordeling = {
  eetbaar: boolean;
  eetbaarInfo: string;
  oogstbaarInTuin: boolean;
  tuinOpmerking: string;
  gevaarlijk: boolean;
  gevaarlijkInfo: string;
  waaromLatenStaan: string;
};

const veilig = (
  eetbaar: boolean,
  eetbaarInfo = '',
  waaromLatenStaan = '',
  oogstbaarInTuin = eetbaar,
  tuinOpmerking = '',
): PlantBeoordeling => ({
  eetbaar,
  eetbaarInfo,
  oogstbaarInTuin,
  tuinOpmerking,
  gevaarlijk: false,
  gevaarlijkInfo: '',
  waaromLatenStaan,
});

export const PLANT_BEOORDELINGEN: Record<string, PlantBeoordeling> = {
  aardbei: veilig(true, 'De rijpe rode vruchten zijn eetbaar.'),
  bosbes: veilig(true, 'De rijpe donkerblauwe bessen zijn eetbaar.'),
  bieslook: veilig(true, 'De groene sprieten en bloemen zijn eetbaar.'),
  kiwi: veilig(true, 'De vruchten van deze soort zijn eetbaar.', '', false, 'Deze kiwi draagt in onze tuin geen vruchten.'),
  citroenmelisse: veilig(true, 'De jonge bladeren zijn bruikbaar in eten en thee.'),
  dragon: veilig(true, 'De jonge bladeren en zachte toppen zijn bruikbaar als keukenkruid.'),
  'edel-duizendblad': veilig(false, '', 'De bloemen geven voedsel aan insecten en zorgen voor kleur in de tuin.'),
  framboos: veilig(true, 'De rijpe frambozen zijn eetbaar.'),
  knopherik: veilig(true, 'Jonge delen van de soort worden soms gegeten.', 'De bloemen geven voedsel aan bijen en zweefvliegen.'),
  lavendel: veilig(true, 'De bloemen zijn in kleine hoeveelheden bruikbaar als smaakmaker.'),
  marjolein: veilig(true, 'De bladeren en jonge toppen zijn bruikbaar als keukenkruid.'),
  munt: veilig(true, 'De bladeren zijn bruikbaar in eten en thee.'),
  'rode-bes': veilig(true, 'De rijpe rode bessen zijn eetbaar.'),
  rozemarijn: veilig(true, 'De jonge takjes en bladeren zijn bruikbaar als keukenkruid.', '', true, 'De precieze soort is onzeker. Dit kan gewone rozemarijn, Salvia rosmarinus, zijn.'),
  salie: veilig(true, 'De bladeren zijn in kleine hoeveelheden bruikbaar als keukenkruid.'),
  teunisbloem: veilig(false, '', 'De bloemen geven kleur en voedsel aan insecten en de zaden zijn voedsel voor vogels.'),
  tijm: veilig(true, 'De bladeren en jonge toppen zijn bruikbaar als keukenkruid.'),
  venkel: veilig(true, 'De bladeren, bloemen en rijpe zaden zijn eetbaar.'),
  'zwarte-bes': veilig(true, 'De rijpe zwarte bessen zijn eetbaar.'),
  'spaanse-aak': veilig(false),
  wegedoorn: {
    eetbaar: false,
    eetbaarInfo: '',
    oogstbaarInTuin: false,
    tuinOpmerking: '',
    gevaarlijk: true,
    gevaarlijkInfo: 'Eet geen delen van deze plant. Vooral de zwarte vruchten kunnen klachten veroorzaken.',
    waaromLatenStaan: '',
  },
  kardinaalmuts: {
    eetbaar: false,
    eetbaarInfo: '',
    oogstbaarInTuin: false,
    tuinOpmerking: '',
    gevaarlijk: true,
    gevaarlijkInfo: 'Eet geen delen van deze plant. Ook de opvallende vruchten zijn niet eetbaar.',
    waaromLatenStaan: '',
  },
  'witte-moerbei': veilig(true, 'De rijpe vruchten van deze soort zijn eetbaar.', '', false, 'Deze witte moerbei draagt in onze tuin geen vruchten.'),
  meidoorn: veilig(true, 'Rijpe meidoornvruchten zijn eetbaar na verwijdering van de pitten.'),
  azarooldoorn: veilig(true, 'De rijpe vruchten zijn eetbaar. Verwijder de pitten voor gebruik.'),
};

/** Dezelfde zes planten staan op de plattegrond bij de boom- en heesterplekken. */
const BOOM_HEESTER = new Set([
  'spaanse-aak', 'wegedoorn', 'kardinaalmuts', 'witte-moerbei', 'meidoorn', 'azarooldoorn',
]);

/** Voeg de beoordeling toe aan oude start- of terugvalgegevens. */
export function metPlantBeoordeling(plant: Plant): Plant {
  const beoordeling = PLANT_BEOORDELINGEN[plant.slug];
  if (!beoordeling) return plant;
  const beoordeeld = { ...plant, ...beoordeling, boomHeester: BOOM_HEESTER.has(plant.slug) };
  if (plant.slug === 'venkel') return {
    ...beoordeeld,
    functies: { primair: ['kruid', 'insecten'], secundair: [] },
  };
  return beoordeeld;
}
