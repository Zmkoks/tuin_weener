import { env } from 'cloudflare:workers';
import zones from '@/app/data/tuin.json';
import { readCustomZones } from '@/db/zones';

const createTableSql = `CREATE TABLE IF NOT EXISTS zone_plants (
  zone_id TEXT NOT NULL,
  plant_slug TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (zone_id, plant_slug)
)`;

let initialized = false;

async function ensureDatabase() {
  if (initialized) return;
  const db = env.DB;
  if (!db) throw new Error('De tuinopslag is niet beschikbaar.');
  await db.prepare(createTableSql).run();
  const count = await db.prepare('SELECT COUNT(*) AS count FROM zone_plants').first<{ count: number }>();
  if (!count?.count) {
    const now = new Date().toISOString();
    const inserts = zones.flatMap((zone) => zone.planten.map((slug) =>
      db.prepare('INSERT OR IGNORE INTO zone_plants (zone_id, plant_slug, updated_at) VALUES (?, ?, ?)').bind(zone.id, slug, now),
    ));
    for (let index = 0; index < inserts.length; index += 50) {
      await db.batch(inserts.slice(index, index + 50));
    }
  }
  initialized = true;
}

export async function readPlacements() {
  await ensureDatabase();
  const result = await env.DB.prepare('SELECT zone_id, plant_slug FROM zone_plants ORDER BY zone_id, plant_slug').all<{ zone_id: string; plant_slug: string }>();
  const placements: Record<string, string[]> = {};
  for (const zone of zones) placements[zone.id] = [];
  for (const zone of await readCustomZones()) placements[zone.id] = [];
  for (const row of result.results) (placements[row.zone_id] ??= []).push(row.plant_slug);
  return placements;
}

export async function replaceZonePlants(zoneId: string, plantSlugs: string[]) {
  await ensureDatabase();
  const db = env.DB;
  const now = new Date().toISOString();
  const statements = [db.prepare('DELETE FROM zone_plants WHERE zone_id = ?').bind(zoneId)];
  for (const slug of plantSlugs) {
    statements.push(db.prepare('INSERT INTO zone_plants (zone_id, plant_slug, updated_at) VALUES (?, ?, ?)').bind(zoneId, slug, now));
  }
  await db.batch(statements);
  return { zoneId, plantSlugs, updatedAt: now };
}
