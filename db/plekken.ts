import { env } from 'cloudflare:workers';
import type { Plek } from '@/app/data/plekTypes';
import { zorgVoorDatabase } from '@/db/opzet';
import { bewaarPlekOpdracht } from '@/db/regels';
import { plekUitRegel, type Regel } from '@/db/velden';
import { zorgVoorVulling } from '@/db/vulling';

/**
 * De plekken in de tuin: plantvakken, vrije vakken, bomen en heesters.
 *
 * Hiervoor stonden de vaste plekken in `tuin.json` en werden bijgemaakte plekken als
 * JSON-tekst in `custom_zones` bewaard. Nu staat alles in één tabel, met de vorm als losse
 * kolommen. Daardoor kan een vorm straks verplaatst of aangepast worden zonder de hele plek
 * te herschrijven — precies wat er nodig is om op de site een echte plantenbak bij te maken.
 *
 * `vast` bewaart het onderscheid dat er altijd al was: plekken uit `tuin.json` tekent het
 * drukwerk mee en die blijven staan; bijgemaakte plekken mogen weer weg.
 */

async function klaar() {
  await zorgVoorDatabase();
  await zorgVoorVulling();
}

export async function leesPlekken(): Promise<Plek[]> {
  await klaar();
  const regels = await env.DB.prepare('SELECT * FROM plekken ORDER BY volgorde, id').all<Regel>();
  return regels.results.map(plekUitRegel);
}

/** Of een plek op de site is bijgemaakt. Alleen die mag weer weg. */
export async function isBijgemaakt(id: string): Promise<boolean> {
  await klaar();
  const regel = await env.DB.prepare('SELECT vast FROM plekken WHERE id = ?').bind(id).first<{ vast: number }>();
  return Boolean(regel) && !regel!.vast;
}

/** Hoeveel plekken er op de site zijn bijgemaakt; bepaalt het nummer van de volgende. */
export async function aantalBijgemaakt(): Promise<number> {
  await klaar();
  const regel = await env.DB.prepare('SELECT COUNT(*) AS aantal FROM plekken WHERE vast = 0').first<{ aantal: number }>();
  return regel?.aantal ?? 0;
}

export async function maakPlek(plek: Plek): Promise<Plek> {
  await klaar();
  const laatste = await env.DB.prepare('SELECT MAX(volgorde) AS hoogste FROM plekken').first<{ hoogste: number | null }>();
  await bewaarPlekOpdracht(plek, false, (laatste?.hoogste ?? 0) + 1, new Date().toISOString()).run();
  return plek;
}

/** Alleen bijgemaakte plekken verdwijnen; de beplanting die eraan hing gaat mee. */
export async function verwijderPlek(id: string) {
  await klaar();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM beplanting WHERE plek_id = ?').bind(id),
    env.DB.prepare('DELETE FROM plekken WHERE id = ? AND vast = 0').bind(id),
  ]);
}
