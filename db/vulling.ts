import { env } from 'cloudflare:workers';
import startPlanten from '@/app/data/planten.json';
import startPlekken from '@/app/data/tuin.json';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek } from '@/app/data/plekTypes';
import { zorgVoorDatabase } from '@/db/opzet';
import { bewaarPlantOpdracht, bewaarPlekOpdracht, symboolOpdrachten } from '@/db/regels';

/**
 * De eerste vulling van een lege database.
 *
 * `planten.json` en `tuin.json` zijn hiermee **startvulling** geworden en geen bron meer.
 * Ze gaan één keer de database in; daarna is de tabel de waarheid en raken de bestanden
 * alleen nog een nieuwe, lege installatie. Wijzigt iemand via Beheren een plant, dan
 * verandert die plant zelf — er komt geen tweede versie naast te staan die de eerste
 * overschaduwt, zoals met `custom_plants` gebeurde.
 *
 * Dit draait alleen als de tabel leeg is. Wie de tuin leeghaalt, krijgt hem dus niet
 * ongevraagd terug.
 */

let gedaan: Promise<void> | null = null;

export function zorgVoorVulling(): Promise<void> {
  gedaan ??= vul().catch((fout) => {
    gedaan = null;
    throw fout;
  });
  return gedaan;
}

/** D1 doet maximaal honderd opdrachten per keer; dit blijft daar ruim onder. */
const PER_KEER = 20;

async function inStukken(opdrachten: D1PreparedStatement[]) {
  for (let begin = 0; begin < opdrachten.length; begin += PER_KEER) {
    await env.DB.batch(opdrachten.slice(begin, begin + PER_KEER));
  }
}

async function vul() {
  await zorgVoorDatabase();
  const nu = new Date().toISOString();

  const planten = await env.DB.prepare('SELECT COUNT(*) AS aantal FROM planten').first<{ aantal: number }>();
  if (!planten?.aantal) {
    const opdrachten = (startPlanten as Plant[]).flatMap((plant) => [
      bewaarPlantOpdracht(plant, nu, nu),
      ...symboolOpdrachten(plant),
    ]);
    await inStukken(opdrachten);
  }

  const plekken = await env.DB.prepare('SELECT COUNT(*) AS aantal FROM plekken').first<{ aantal: number }>();
  if (!plekken?.aantal) {
    // `vast: true`: deze plekken komen uit tuin.json en tekent het drukwerk mee, dus ze
    // mogen niet van de site verwijderd worden. De volgorde uit het bestand blijft staan,
    // want daar hangen de nummers op de gedrukte kaart aan.
    const lijst = startPlekken as Plek[];
    await inStukken(lijst.map((plek, nummer) => bewaarPlekOpdracht(plek, true, nummer, nu)));

    // De beplanting hoort bij de plek en staat in hetzelfde bestand.
    const beplanting = lijst.flatMap((plek) => (plek.planten ?? []).map((slug) => env.DB
      .prepare('INSERT OR IGNORE INTO beplanting (plek_id, plant_slug, gewijzigd_op) VALUES (?, ?, ?)')
      .bind(plek.id, slug, nu)));
    await inStukken(beplanting);
  }
}
