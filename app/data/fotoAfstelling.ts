import instellingen from './fotoInstellingen.json';
import { STANDAARD_AFSTELLING } from './plantTypes';

/**
 * De afstelling van de bestaande foto's, afgeleid van `foto_instellingen.json` in de
 * hoofdmap. Die sleutels zijn namen zonder streepjes of hoofdletters, dus `rode-bes` staat
 * er als `rodebes`.
 *
 * **Dit is sinds 9 september 2026 geen letterlijke kopie meer: `x` staat gespiegeld.** De
 * foto's in `public/fotos-web` zijn horizontaal gespiegeld, omdat de site de compositie van
 * de gedrukte kaart gespiegeld toont - op papier loopt de ronde foto links buiten het kader,
 * op de site rechts. `object-position: x%` wijst een punt ín de foto aan, dus bij een
 * gespiegeld bestand hoort `100 - x`. `y` en `zoom` zijn wel gelijk gebleven.
 *
 * Verandert er iets in de hoofdmap, kopieer dan niet klakkeloos: spiegel `x` opnieuw. Het
 * bestand in de hoofdmap hoort bij het drukwerk en blijft ongespiegeld.
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
