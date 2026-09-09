import { env } from 'cloudflare:workers';
import { zorgVoorDatabase } from '@/db/opzet';
import { zorgVoorVulling } from '@/db/vulling';

/**
 * Welke plant op welke plek staat. Dit is het enige deel van de oude opslag dat al klopte
 * (het heette `zone_plants`); alleen de namen zijn meeverhuisd naar het Nederlands.
 */

async function klaar() {
  await zorgVoorDatabase();
  await zorgVoorVulling();
}

/**
 * De beplanting per plek. Elke bestaande plek komt in het antwoord voor, ook als er niets
 * staat — anders kan de kaart geen verschil zien tussen "leeg" en "bestaat niet".
 */
export async function leesBeplanting(): Promise<Record<string, string[]>> {
  await klaar();
  const [plekken, regels] = await Promise.all([
    env.DB.prepare('SELECT id FROM plekken ORDER BY volgorde, id').all<{ id: string }>(),
    env.DB.prepare('SELECT plek_id, plant_slug FROM beplanting ORDER BY plek_id, plant_slug')
      .all<{ plek_id: string; plant_slug: string }>(),
  ]);

  const beplanting: Record<string, string[]> = {};
  for (const plek of plekken.results) beplanting[plek.id] = [];
  for (const regel of regels.results) (beplanting[regel.plek_id] ??= []).push(regel.plant_slug);
  return beplanting;
}

/** De hele plek in één keer opnieuw invullen: eerst leeg, dan de nieuwe lijst erin. */
export async function vervangBeplanting(plekId: string, slugs: string[]) {
  await klaar();
  const nu = new Date().toISOString();
  const opdrachten = [env.DB.prepare('DELETE FROM beplanting WHERE plek_id = ?').bind(plekId)];
  for (const slug of slugs) {
    opdrachten.push(env.DB
      .prepare('INSERT INTO beplanting (plek_id, plant_slug, gewijzigd_op) VALUES (?, ?, ?)')
      .bind(plekId, slug, nu));
  }
  await env.DB.batch(opdrachten);
  return { zoneId: plekId, plantSlugs: slugs, updatedAt: nu };
}
