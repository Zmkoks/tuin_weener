import { env } from 'cloudflare:workers';
import type { Plek } from '@/app/data/plekTypes';

/**
 * Plekken die op de site zijn bijgemaakt, bijvoorbeeld omdat iemand een plant vond op
 * een plek die nog niet op de kaart stond. De vaste plekken staan in `tuin.json`; die
 * blijven de bron voor het drukwerk.
 */
const createTableSql = `CREATE TABLE IF NOT EXISTS custom_zones (
  id TEXT PRIMARY KEY,
  zone_json TEXT NOT NULL,
  created_at TEXT NOT NULL
)`;

let initialized = false;

async function ensureZonesTable() {
  if (initialized) return;
  const db = env.DB;
  if (!db) throw new Error('De tuinopslag is niet beschikbaar.');
  await db.prepare(createTableSql).run();
  initialized = true;
}

export async function readCustomZones(): Promise<Plek[]> {
  await ensureZonesTable();
  const result = await env.DB.prepare('SELECT zone_json FROM custom_zones ORDER BY created_at, id').all<{ zone_json: string }>();
  return result.results.flatMap((row) => {
    try { return [JSON.parse(row.zone_json) as Plek]; } catch { return []; }
  });
}

/** Een bijgemaakte plek weghalen. De vaste plekken uit `tuin.json` blijven altijd staan. */
export async function deleteCustomZone(id: string) {
  await ensureZonesTable();
  await env.DB.prepare('DELETE FROM custom_zones WHERE id = ?').bind(id).run();
}

export async function createCustomZone(plek: Plek) {
  await ensureZonesTable();
  await env.DB.prepare('INSERT INTO custom_zones (id, zone_json, created_at) VALUES (?, ?, ?)')
    .bind(plek.id, JSON.stringify(plek), new Date().toISOString())
    .run();
  return plek;
}
