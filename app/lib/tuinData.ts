import vastePlekken from '@/app/data/tuin.json';
import startPlanten from '@/app/data/planten.json';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek } from '@/app/data/plekTypes';
import { leesBeplanting } from '@/db/beplanting';
import { leesPlanten } from '@/db/planten';
import { leesPlekken } from '@/db/plekken';

/**
 * De tuin ophalen, met een terugval als de database niet bereikbaar is.
 *
 * De JSON-bestanden zijn sinds de database-omzetting **startvulling** en geen bron meer:
 * `db/vulling.ts` zet ze één keer in de tabellen. Ze staan hier nog als noodgreep, zodat de
 * site iets laat zien in plaats van een foutmelding wanneer D1 wegvalt. Wat je dan ziet is
 * de tuin van de laatste export, niet de actuele.
 */

/** De plekken uit tuin.json. Alleen nog terugval en startvulling. */
export const vasteZones = vastePlekken as Plek[];

export async function laadZones(): Promise<Plek[]> {
  try {
    return await leesPlekken();
  } catch {
    return vasteZones;
  }
}

export async function laadPlanten(): Promise<Plant[]> {
  try {
    return await leesPlanten();
  } catch {
    return startPlanten as Plant[];
  }
}

export async function laadBeplanting(): Promise<Record<string, string[]>> {
  try {
    return await leesBeplanting();
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
