import vastePlekken from '@/app/data/tuin.json';
import staticPlants from '@/app/data/planten.json';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek } from '@/app/data/plekTypes';
import { readAllPlants } from '@/db/plants';
import { readPlacements } from '@/db/garden';
import { readCustomZones } from '@/db/zones';

/** De plekken uit tuin.json: de vaste tuin, ook de bron voor het drukwerk. */
export const vasteZones = vastePlekken as Plek[];

/** Alle plekken, inclusief de plekken die op de site zijn bijgemaakt. */
export async function laadZones(): Promise<Plek[]> {
  try {
    return [...vasteZones, ...await readCustomZones()];
  } catch {
    return vasteZones;
  }
}

/** Alle planten, inclusief zelf toegevoegde. Valt terug op het JSON-bestand als de database wegvalt. */
export async function laadPlanten(): Promise<Plant[]> {
  try {
    return await readAllPlants();
  } catch {
    return staticPlants as Plant[];
  }
}

/** Welke planten op welke plek staan. Valt terug op de uitgangssituatie als de database wegvalt. */
export async function laadBeplanting(): Promise<Record<string, string[]>> {
  try {
    return await readPlacements();
  } catch {
    return Object.fromEntries(vasteZones.map((zone) => [zone.id, [...zone.planten]]));
  }
}

export async function zoekZone(id: string) {
  return (await laadZones()).find((zone) => zone.id === id);
}

/** Op welke plekken staat deze plant? */
export function plekkenVanPlant(zones: Plek[], beplanting: Record<string, string[]>, slug: string) {
  return zones.filter((zone) => (beplanting[zone.id] || []).includes(slug));
}
