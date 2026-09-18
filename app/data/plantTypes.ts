import type { Moment } from './momenten';

/**
 * Een foto of illustratie bij een plant: waar het bestand staat, waar het vandaan komt,
 * en hoe het in beeld is gezet.
 *
 * `x`, `y` en `zoom` zijn dezelfde drie waarden als in het afstelgereedschap
 * (`foto_afstellen_browser_v1.py`, opgeslagen in `foto_instellingen.json`) en worden ook
 * op dezelfde manier toegepast: `object-position: x% y%`, `transform: scale(zoom)` met
 * `transform-origin: x% y%`. Zo staat een foto op het scherm net zo in beeld als op de
 * gedrukte plantenkaart.
 */
export type Afbeelding = {
  /** Sleutel in de bestandsopslag. Leeg = het vaste bestand uit fotos.ts / illustraties.ts. */
  bestand: string;
  /** Waar de afbeelding vandaan komt: een link, een naam, of allebei. */
  bron: string;
  x: number;
  y: number;
  zoom: number;
};

export const STANDAARD_AFSTELLING = { x: 50, y: 50, zoom: 1 };

export type Plant = {
  slug: string;
  naam: string;
  plantnummer: string;
  waterOndergrens: string;
  waterBovengrens: string;
  waterInfo: string;
  zon: string;
  zonInfo: string;
  functies: { primair: string[]; secundair: string[] };
  /** null = nog niet inhoudelijk beoordeeld. */
  eetbaar?: boolean | null;
  eetbaarInfo?: string;
  /** Of het aanwezige exemplaar daadwerkelijk iets oplevert. null = nog navragen. */
  oogstbaarInTuin?: boolean | null;
  /** Plaatselijke bijzonderheid of uitleg bij een redactionele keuze. */
  tuinOpmerking?: string;
  /** Staat als boom of heester in de tuinindeling. */
  boomHeester?: boolean;
  /** null = nog niet inhoudelijk beoordeeld. */
  gevaarlijk?: boolean | null;
  gevaarlijkInfo?: string;
  /** Alleen relevant voor onkruid dat veilig kan blijven staan. */
  waaromLatenStaan?: string;
  /** Per oogstmoment de maanden en wat je dan plukt en hoe. Zie `app/data/momenten.ts`. */
  oogstMomenten: Moment[];
  /** Afgeleid: alle maanden uit `oogstMomenten`. Niet los invullen. */
  oogstTijd: string[];
  /** Per snoeimoment de maanden en wat je dan doet. Zie `app/data/momenten.ts`. */
  snoeiMomenten: Moment[];
  /** Afgeleid: alle maanden uit `snoeiMomenten`. Niet los invullen. */
  snoeiTijd: string[];
  snoeiMethode: string;
  snoeiInformatie: string;
  woekerToestemming: string;
  woekerVerbod: string;
  levensduur: string;
  groei: string[];
  bloei: string[];
  sterf: string[];
  botanischeNaam: string;
  /** Oude bronlink (een categorie op Wikimedia Commons). Valt terug op de illustratiebron. */
  commons: string;
  /** Eventuele Commons-categorie met botanische illustraties van precies deze soort. */
  commonsIllustraties?: string;
  foto?: Afbeelding;
  illustratie?: Afbeelding;
  /**
   * De symbolen waarmee deze plant op de plattegrond wordt getekend. De plattegrond kiest
   * per plant uit alles wat aanstaat, dus meerdere mag: `plant-venkel` én
   * `plant-venkel-groot` staan er van huis uit allebei aan.
   *
   * Ontbreekt dit veld, dan gelden alle varianten uit `planten_symbolen.svg`. Staat het er
   * wel, dan is het de volledige lijst: `bibliotheek` zijn de aangevinkte tekeningen uit
   * dat bestand, `eigen` de tekeningen die hier zijn geüpload.
   */
  symbolen?: {
    bibliotheek: string[];
    eigen: { bestand: string; bron: string }[];
  };
  intro: string;
  weetje: string;
};
