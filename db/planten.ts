import { env } from 'cloudflare:workers';
import type { Plant } from '@/app/data/plantTypes';
import { zorgVoorDatabase } from '@/db/opzet';
import { bewaarPlantOpdracht, symboolOpdrachten } from '@/db/regels';
import { plantUitRegel, type Regel } from '@/db/velden';
import { zorgVoorVulling } from '@/db/vulling';

/**
 * De planten, uit de database.
 *
 * Hiervoor waren er twee waarheden: de 25 planten stonden in `app/data/planten.json` en een
 * wijziging werd als hele plant in JSON-tekst weggeschreven in `custom_plants`, die de oude
 * dan overschaduwde. Munt bestond dan twee keer en bij het lezen werd de winnaar gekozen.
 * Nu is er één tabel met een kolom per veld.
 */

async function klaar() {
  await zorgVoorDatabase();
  await zorgVoorVulling();
}

async function eigenSymbolenPerPlant() {
  const regels = await env.DB
    .prepare('SELECT plant_slug, bestand, bron FROM plant_symbolen ORDER BY plant_slug, volgorde')
    .all<{ plant_slug: string; bestand: string; bron: string }>();
  const perPlant = new Map<string, { bestand: string; bron: string }[]>();
  for (const regel of regels.results) {
    const lijst = perPlant.get(regel.plant_slug) ?? [];
    lijst.push({ bestand: regel.bestand, bron: regel.bron });
    perPlant.set(regel.plant_slug, lijst);
  }
  return perPlant;
}

/** Alle planten, in de volgorde waarin ze zijn toegevoegd. Sorteren op naam doet de pagina. */
export async function leesPlanten(): Promise<Plant[]> {
  await klaar();
  const [regels, symbolen] = await Promise.all([
    env.DB.prepare('SELECT * FROM planten ORDER BY aangemaakt_op, slug').all<Regel>(),
    eigenSymbolenPerPlant(),
  ]);
  return regels.results.map((regel) => plantUitRegel(regel, symbolen.get(String(regel.slug)) ?? []));
}

export async function leesPlant(slug: string): Promise<Plant | null> {
  await klaar();
  const regel = await env.DB.prepare('SELECT * FROM planten WHERE slug = ?').bind(slug).first<Regel>();
  if (!regel) return null;
  const symbolen = await eigenSymbolenPerPlant();
  return plantUitRegel(regel, symbolen.get(slug) ?? []);
}

export async function maakPlant(plant: Plant) {
  await klaar();
  const nu = new Date().toISOString();
  await env.DB.batch([bewaarPlantOpdracht(plant, nu, nu), ...symboolOpdrachten(plant)]);
  return plant;
}

/** Bijwerken laat `aangemaakt_op` staan, zodat de volgorde van de bibliotheek niet verspringt. */
export async function bewaarPlant(plant: Plant) {
  await klaar();
  const nu = new Date().toISOString();
  const bestaand = await env.DB.prepare('SELECT aangemaakt_op FROM planten WHERE slug = ?')
    .bind(plant.slug).first<{ aangemaakt_op: string }>();
  await env.DB.batch([
    bewaarPlantOpdracht(plant, bestaand?.aangemaakt_op ?? nu, nu),
    ...symboolOpdrachten(plant),
  ]);
  return plant;
}
