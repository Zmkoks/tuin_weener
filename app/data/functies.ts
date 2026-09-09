import type { Plant } from './plantTypes';

export type Functiegroepen = { primair: string[]; secundair: string[] };

/**
 * De functies van een plant als één lijst: eerst de primaire, dan de secundaire.
 *
 * Hier stond eerder ook `functieGroepen()`, dat een oude platte lijst nog kon opvangen, en
 * `normaliseerPlant()`, dat bij het lezen repareerde wat er misschien fout in de opslag
 * stond. Allebei overbodig sinds de planten in de database staan: `functies_primair` en
 * `functies_secundair` zijn eigen kolommen, dus de vorm ligt vast bij het opslaan en hoeft
 * bij elk verzoek niet opnieuw rechtgezet te worden.
 */
export function alleFuncties(plant: Pick<Plant, 'functies'>): string[] {
  return [...(plant.functies?.primair ?? []), ...(plant.functies?.secundair ?? [])];
}
