import { normaliseerPlant } from '@/app/data/functies';
import { env } from 'cloudflare:workers';
import staticPlants from '@/app/data/planten.json';
import type { Plant } from '@/app/data/plantTypes';

const createTableSql = `CREATE TABLE IF NOT EXISTS custom_plants (
  slug TEXT PRIMARY KEY,
  plant_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

let initialized = false;

async function ensurePlantsTable() {
  if (initialized) return;
  const db = env.DB;
  if (!db) throw new Error('De tuinopslag is niet beschikbaar.');
  await db.prepare(createTableSql).run();
  initialized = true;
}

export async function readCustomPlants(): Promise<Plant[]> {
  await ensurePlantsTable();
  const result = await env.DB.prepare('SELECT plant_json FROM custom_plants ORDER BY created_at, slug').all<{ plant_json: string }>();
  return result.results.flatMap((row) => {
    try { const plant = JSON.parse(row.plant_json) as Plant; return [normaliseerPlant(plant, (staticPlants as Plant[]).find(p => p.slug === plant.slug))]; } catch { return []; }
  });
}

/**
 * Alle planten. De tabel `custom_plants` bevat twee soorten regels: planten die hier zijn
 * bijgemaakt, en gewijzigde versies van een plant uit `planten.json`. Beide herken je aan
 * de slug: staat die al in het vaste bestand, dan vervangt de eigen versie hem.
 */
export async function readAllPlants(): Promise<Plant[]> {
  const eigen = await readCustomPlants();
  const eigenPerSlug = new Map(eigen.map((plant) => [plant.slug, plant]));
  const vast = (staticPlants as Plant[]).map((plant) => eigenPerSlug.get(plant.slug) ?? plant);
  const vasteSlugs = new Set((staticPlants as Plant[]).map((plant) => plant.slug));
  return [...vast, ...eigen.filter((plant) => !vasteSlugs.has(plant.slug))];
}

export async function createCustomPlant(plant: Plant) {
  await ensurePlantsTable();
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO custom_plants (slug, plant_json, created_at, updated_at) VALUES (?, ?, ?, ?)').bind(plant.slug, JSON.stringify(plant), now, now).run();
  return plant;
}

/** Een gewijzigd paspoort bewaren. Ook voor een plant uit `planten.json`: die krijgt dan een eigen versie. */
export async function saveCustomPlant(plant: Plant) {
  await ensurePlantsTable();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO custom_plants (slug, plant_json, created_at, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET plant_json = excluded.plant_json, updated_at = excluded.updated_at`,
  ).bind(plant.slug, JSON.stringify(plant), now, now).run();
  return plant;
}
