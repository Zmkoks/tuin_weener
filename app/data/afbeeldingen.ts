import type { Afbeelding, Plant } from './plantTypes';
import { afstellingVanSlug } from './fotoAfstelling';
import { plantFoto } from './fotos';
import { plantIllustratie } from './illustraties';

/**
 * Welke foto of illustratie een plant heeft, en hoe die in beeld staat.
 *
 * Twee bronnen, in deze volgorde:
 * 1. een afbeelding die via Beheren is geüpload (`plant.foto` / `plant.illustratie`);
 * 2. anders het vaste bestand uit `public/fotos` of `public/illustraties`, met de
 *    afstelling die ook op de gedrukte kaart wordt gebruikt.
 */
export type Beeld = {
  src: string;
  bron: string;
  /** Overal veilig: snijdt bij binnen het vak van de afbeelding zelf. */
  stijl: React.CSSProperties;
  /** Inclusief inzoomen. Alleen in een kader dat afknipt — zie hieronder. */
  stijlMetZoom: React.CSSProperties;
};

/**
 * Twee stijlen, en dat is met opzet.
 *
 * `object-position` verschuift de uitsnede bínnen het vak van de afbeelding: dat kan
 * nergens overlopen. `transform: scale()` snijdt niet bij maar tekent alleen groter, dus
 * dat mag alleen in een kader met `overflow: hidden` eromheen — de ronde foto op de
 * plantenpagina en het voorbeeld in Beheren. Zonder zo'n kader schildert een uitvergrote
 * foto over de tekst eronder heen, want zijn plek in de opmaak groeit niet mee.
 */
function stijlVan({ x, y, zoom }: { x: number; y: number; zoom: number }) {
  const positie = { objectPosition: `${x}% ${y}%` };
  // Precies zoals maak_infokaarten.py het op de gedrukte kaart zet.
  return { stijl: positie, stijlMetZoom: { ...positie, transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` } };
}

function uitAfbeelding(afbeelding: Afbeelding | undefined) {
  if (!afbeelding?.bestand) return null;
  return { src: `/api/media/${afbeelding.bestand}`, bron: afbeelding.bron, ...stijlVan(afbeelding) };
}

export function fotoVan(plant: Plant): Beeld | null {
  const geupload = uitAfbeelding(plant.foto);
  if (geupload) return geupload;
  const vast = plantFoto(plant.slug);
  if (!vast) return null;
  return { src: vast, bron: plant.foto?.bron || '', ...stijlVan(plant.foto ?? afstellingVanSlug(plant.slug)) };
}

export function illustratieVan(plant: Plant): Beeld | null {
  const geupload = uitAfbeelding(plant.illustratie);
  if (geupload) return geupload;
  const vast = plantIllustratie(plant.slug);
  if (!vast) return null;
  // De oude `commons`-link was in de praktijk de bron van de illustratie.
  return { src: vast, bron: plant.illustratie?.bron ?? plant.commons, ...stijlVan(plant.illustratie ?? { x: 50, y: 50, zoom: 1 }) };
}
