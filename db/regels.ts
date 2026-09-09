import { env } from 'cloudflare:workers';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek } from '@/app/data/plekTypes';
import { PLANTKOLOMMEN, waardenVanPlant, waardenVanPlek } from '@/db/velden';

/**
 * De schrijfopdrachten voor de database. De omzetting van en naar een regel staat in
 * `velden.ts`, dat de database niet aanraakt en daarom gewoon te testen is.
 *
 * Deze staan apart van `planten.ts` en `plekken.ts` omdat de eenmalige vulling ze ook nodig
 * heeft; anders zouden die bestanden elkaar over en weer importeren.
 */

/** Alle kolommen gaan mee, dus na het bijwerken blijft er nooit een oude waarde staan. */
export function bewaarPlantOpdracht(plant: Plant, aangemaaktOp: string, gewijzigdOp: string) {
  const vragen = PLANTKOLOMMEN.map(() => '?').join(', ');
  const bijwerken = PLANTKOLOMMEN
    .filter((kolom) => kolom !== 'slug' && kolom !== 'aangemaakt_op')
    .map((kolom) => `${kolom} = excluded.${kolom}`)
    .join(', ');
  return env.DB
    .prepare(`INSERT INTO planten (${PLANTKOLOMMEN.join(', ')}) VALUES (${vragen})
              ON CONFLICT(slug) DO UPDATE SET ${bijwerken}`)
    .bind(...waardenVanPlant(plant, aangemaaktOp, gewijzigdOp));
}

export function symboolOpdrachten(plant: Plant) {
  const opdrachten = [env.DB.prepare('DELETE FROM plant_symbolen WHERE plant_slug = ?').bind(plant.slug)];
  (plant.symbolen?.eigen ?? []).forEach((eigen, nummer) => {
    opdrachten.push(env.DB
      .prepare('INSERT INTO plant_symbolen (plant_slug, volgorde, bestand, bron) VALUES (?, ?, ?, ?)')
      .bind(plant.slug, nummer, eigen.bestand, eigen.bron ?? ''));
  });
  return opdrachten;
}

export function bewaarPlekOpdracht(plek: Plek, vast: boolean, volgorde: number, aangemaaktOp: string) {
  return env.DB.prepare(
    `INSERT INTO plekken (id, label, soort, svg_label, badge_x, badge_y, vorm_type,
       x, y, b, h, cx, cy, rx, ry, vast, volgorde, aangemaakt_op)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       label = excluded.label, soort = excluded.soort, svg_label = excluded.svg_label,
       badge_x = excluded.badge_x, badge_y = excluded.badge_y, vorm_type = excluded.vorm_type,
       x = excluded.x, y = excluded.y, b = excluded.b, h = excluded.h,
       cx = excluded.cx, cy = excluded.cy, rx = excluded.rx, ry = excluded.ry,
       volgorde = excluded.volgorde`,
  ).bind(...waardenVanPlek(plek, vast, volgorde, aangemaaktOp));
}
