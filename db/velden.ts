import type { Afbeelding, Plant } from '@/app/data/plantTypes';
import type { Plek, Vorm } from '@/app/data/plekTypes';

/**
 * Heen en weer tussen een regel in de database en een plant of plek in de code.
 *
 * Dit bestand raakt de database niet aan — geen `cloudflare:workers`, geen SQL. Dat is met
 * opzet: dit is de laag waar een veld stilzwijgend kan verdwijnen, en zonder database-import
 * kan een gewone test alle 25 planten heen en terug sturen en vergelijken. Zie
 * `test-plantgegevens.mjs`.
 *
 * Er is één kolomlijst, gedeeld door het invoegen en het bijwerken, zodat een nieuw veld
 * niet op één van de twee plekken vergeten kan worden.
 */

export type Regel = Record<string, string | number | null>;

const tekst = (regel: Regel, kolom: string) => String(regel[kolom] ?? '');
const getal = (regel: Regel, kolom: string, terugval: number) => {
  const waarde = regel[kolom];
  return typeof waarde === 'number' ? waarde : terugval;
};

/** Komma-lijst naar array. Lege tekst is een lege lijst, niet een lijst met één leeg woord. */
export function uitLijst(waarde: string | null | undefined): string[] {
  if (!waarde) return [];
  return waarde.split(',').map((deel) => deel.trim()).filter(Boolean);
}

/** Array naar komma-lijst. Geen enkele maand, functie of symboolnaam bevat een komma. */
export function naarLijst(waarden: readonly string[] | undefined): string {
  return (waarden ?? []).join(',');
}

// ─────────────────────────────────────────────────────────────────── planten ──

/**
 * Een foto of illustratie bestaat alleen als hij ooit is ingesteld.
 *
 * Dat onderscheid telt: ontbreekt `plant.foto`, dan pakt `fotoVan()` de afstelling uit
 * `foto_instellingen.json`. Zou hier altijd een leeg object uitkomen, dan overschreef dat de
 * afgestelde uitsnede met 50/50/1 en stonden alle foto's anders in beeld.
 */
function beeldVan(regel: Regel, soort: 'foto' | 'illustratie'): Afbeelding | undefined {
  if (!getal(regel, `${soort}_ingesteld`, 0)) return undefined;
  return {
    bestand: tekst(regel, `${soort}_bestand`),
    bron: tekst(regel, `${soort}_bron`),
    x: getal(regel, `${soort}_x`, 50),
    y: getal(regel, `${soort}_y`, 50),
    zoom: getal(regel, `${soort}_zoom`, 1),
  };
}

export function plantUitRegel(regel: Regel, eigenSymbolen: { bestand: string; bron: string }[]): Plant {
  // `symbolen_bibliotheek` mag NULL zijn, en dat betekent iets anders dan leeg: NULL is
  // "niemand heeft een keuze gemaakt, dus alle tekeningen uit de bibliotheek doen mee",
  // leeg is "geen enkele". Zonder dat onderscheid kon niemand ooit alles uitzetten. Bij
  // NULL ontbreekt het veld op de plant, precies zoals het formulier het opslaat.
  const keuze = regel.symbolen_bibliotheek;
  const symbolen = keuze === null || keuze === undefined
    ? undefined
    : { bibliotheek: uitLijst(String(keuze)), eigen: eigenSymbolen };

  return {
    slug: tekst(regel, 'slug'),
    naam: tekst(regel, 'naam'),
    plantnummer: tekst(regel, 'plantnummer'),
    waterOndergrens: tekst(regel, 'water_ondergrens'),
    waterBovengrens: tekst(regel, 'water_bovengrens'),
    waterInfo: tekst(regel, 'water_info'),
    zon: tekst(regel, 'zon'),
    zonInfo: tekst(regel, 'zon_info'),
    functies: {
      primair: uitLijst(tekst(regel, 'functies_primair')),
      secundair: uitLijst(tekst(regel, 'functies_secundair')),
    },
    oogstTijd: uitLijst(tekst(regel, 'oogst_tijd')),
    oogstMethode: tekst(regel, 'oogst_methode'),
    extraOogstTijd: uitLijst(tekst(regel, 'extra_oogst_tijd')),
    extraOogstMethode: tekst(regel, 'extra_oogst_methode'),
    snoeiTijd: uitLijst(tekst(regel, 'snoei_tijd')),
    snoeiTijdInfo: tekst(regel, 'snoei_tijd_info'),
    snoeiMethode: tekst(regel, 'snoei_methode'),
    snoeiInformatie: tekst(regel, 'snoei_informatie'),
    woekerToestemming: tekst(regel, 'woeker_toestemming'),
    woekerVerbod: tekst(regel, 'woeker_verbod'),
    levensduur: tekst(regel, 'levensduur'),
    groei: uitLijst(tekst(regel, 'groei')),
    bloei: uitLijst(tekst(regel, 'bloei')),
    sterf: uitLijst(tekst(regel, 'sterf')),
    botanischeNaam: tekst(regel, 'botanische_naam'),
    commons: tekst(regel, 'commons'),
    commonsIllustraties: tekst(regel, 'commons_illustraties') || undefined,
    foto: beeldVan(regel, 'foto'),
    illustratie: beeldVan(regel, 'illustratie'),
    symbolen,
    intro: tekst(regel, 'intro'),
    weetje: tekst(regel, 'weetje'),
  };
}

/** De kolommen van `planten`, in de volgorde waarin de waarden hieronder meegaan. */
export const PLANTKOLOMMEN = [
  'slug', 'naam', 'plantnummer', 'botanische_naam', 'zon', 'zon_info',
  'water_ondergrens', 'water_bovengrens', 'water_info',
  'functies_primair', 'functies_secundair',
  'oogst_tijd', 'oogst_methode', 'extra_oogst_tijd', 'extra_oogst_methode',
  'snoei_tijd', 'snoei_tijd_info', 'snoei_methode', 'snoei_informatie',
  'woeker_toestemming', 'woeker_verbod', 'levensduur',
  'groei', 'bloei', 'sterf', 'commons', 'commons_illustraties', 'intro', 'weetje',
  'foto_ingesteld', 'foto_bestand', 'foto_bron', 'foto_x', 'foto_y', 'foto_zoom',
  'illustratie_ingesteld', 'illustratie_bestand', 'illustratie_bron',
  'illustratie_x', 'illustratie_y', 'illustratie_zoom',
  'symbolen_bibliotheek', 'aangemaakt_op', 'gewijzigd_op',
] as const;

export function waardenVanPlant(plant: Plant, aangemaaktOp: string, gewijzigdOp: string) {
  const beeld = (soort: 'foto' | 'illustratie') => {
    const bron = plant[soort];
    return bron
      ? [1, bron.bestand ?? '', bron.bron ?? '', bron.x ?? 50, bron.y ?? 50, bron.zoom ?? 1]
      : [0, '', '', 50, 50, 1];
  };
  return [
    plant.slug, plant.naam, plant.plantnummer ?? '', plant.botanischeNaam ?? '',
    plant.zon ?? '', plant.zonInfo ?? '',
    plant.waterOndergrens ?? '', plant.waterBovengrens ?? '', plant.waterInfo ?? '',
    naarLijst(plant.functies?.primair), naarLijst(plant.functies?.secundair),
    naarLijst(plant.oogstTijd), plant.oogstMethode ?? '',
    naarLijst(plant.extraOogstTijd), plant.extraOogstMethode ?? '',
    naarLijst(plant.snoeiTijd), plant.snoeiTijdInfo ?? '',
    plant.snoeiMethode ?? '', plant.snoeiInformatie ?? '',
    plant.woekerToestemming ?? '', plant.woekerVerbod ?? '', plant.levensduur ?? '',
    naarLijst(plant.groei), naarLijst(plant.bloei), naarLijst(plant.sterf),
    plant.commons ?? '', plant.commonsIllustraties ?? '', plant.intro ?? '', plant.weetje ?? '',
    ...beeld('foto'),
    ...beeld('illustratie'),
    plant.symbolen ? naarLijst(plant.symbolen.bibliotheek) : null,
    aangemaaktOp, gewijzigdOp,
  ];
}

/** De waarden weer als regel, zoals de database ze zou teruggeven. Gebruikt door de test. */
export function regelVanPlant(plant: Plant, aangemaaktOp = '', gewijzigdOp = ''): Regel {
  const waarden = waardenVanPlant(plant, aangemaaktOp, gewijzigdOp);
  return Object.fromEntries(PLANTKOLOMMEN.map((kolom, nummer) => [kolom, waarden[nummer] as string | number | null]));
}

// ─────────────────────────────────────────────────────────────────── plekken ──

export const VORMKOLOMMEN = ['x', 'y', 'b', 'h', 'cx', 'cy', 'rx', 'ry'] as const;

export function plekUitRegel(regel: Regel): Plek {
  const vorm: Vorm = { type: String(regel.vorm_type ?? 'punt') };
  for (const kolom of VORMKOLOMMEN) {
    const waarde = regel[kolom];
    if (typeof waarde === 'number') vorm[kolom] = waarde;
  }
  return {
    id: tekst(regel, 'id'),
    label: tekst(regel, 'label'),
    soort: tekst(regel, 'soort'),
    badge: { x: getal(regel, 'badge_x', 0), y: getal(regel, 'badge_y', 0) },
    // De beplanting staat in een eigen tabel. Dit veld blijft leeg en wordt gevuld door wie
    // erom vraagt; het zit nog in het type omdat `tuin.json` het meelevert.
    planten: [],
    vorm,
    svg_label: tekst(regel, 'svg_label'),
  };
}

/** De waarden van een plek, in de volgorde van `bewaarPlekOpdracht`. */
export function waardenVanPlek(plek: Plek, vast: boolean, volgorde: number, aangemaaktOp: string) {
  const vorm = plek.vorm ?? { type: 'punt' };
  return [
    plek.id, plek.label ?? '', plek.soort ?? '', plek.svg_label ?? '',
    plek.badge?.x ?? 0, plek.badge?.y ?? 0, vorm.type,
    vorm.x ?? null, vorm.y ?? null, vorm.b ?? null, vorm.h ?? null,
    vorm.cx ?? null, vorm.cy ?? null, vorm.rx ?? null, vorm.ry ?? null,
    vast ? 1 : 0, volgorde, aangemaaktOp,
  ];
}
