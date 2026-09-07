import instellingen from './fotoInstellingen.json';
import { STANDAARD_AFSTELLING } from './plantTypes';

/**
 * De afstelling van de bestaande foto's, overgenomen uit `foto_instellingen.json` in de
 * hoofdmap (kopie; opnieuw kopiëren als daar iets verandert). Die sleutels zijn namen
 * zonder streepjes of hoofdletters, dus `rode-bes` staat er als `rodebes`.
 *
 * Zo staat een foto op het scherm net zo in beeld als op de gedrukte plantenkaart.
 */
// In het bestand staat naast de planten ook `_uitsnede`: de vorm van het kader op de
// gedrukte kaart. Dat is geen afstelling van een foto, dus die slaan we hier over.
const perNaam = instellingen as Record<string, unknown>;

export function afstellingVanSlug(slug: string) {
  const gevonden = perNaam[slug.replace(/-/g, '')];
  if (gevonden && typeof gevonden === 'object' && 'zoom' in gevonden) {
    return gevonden as { x: number; y: number; zoom: number };
  }
  return STANDAARD_AFSTELLING;
}
