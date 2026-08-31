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
    try { return [JSON.parse(row.plant_json) as Plant]; } catch { return []; }
  });
}

export async function readAllPlants(): Promise<Plant[]> {
  return [...(staticPlants as Plant[]), ...(await readCustomPlants())];
}

export async function createCustomPlant(plant: Plant) {
  await ensurePlantsTable();
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO custom_plants (slug, plant_json, created_at, updated_at) VALUES (?, ?, ?, ?)').bind(plant.slug, JSON.stringify(plant), now, now).run();
  return plant;
}
