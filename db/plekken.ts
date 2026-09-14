import { env } from 'cloudflare:workers';
import type { Plek, Vorm } from '@/app/data/plekTypes';
import { nummerPositie } from '@/app/lib/plekVorm';
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
 * drukwerk mee. Een vaste plantenbak mag in het beheer alsnog worden opgeruimd; andere
 * vaste punten blijven beschermd.
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

export async function leesPlek(id: string): Promise<Plek | null> {
  await klaar();
  const regel = await env.DB.prepare('SELECT * FROM plekken WHERE id = ?').bind(id).first<Regel>();
  return regel ? plekUitRegel(regel) : null;
}

/** Alleen de geometrie verandert; koppelingen, identiteit en startvulling blijven intact. */
export async function wijzigPlekVorm(plek: Plek, vorm: Vorm): Promise<Plek | null> {
  await klaar();
  const badge = nummerPositie(vorm, plek.soort);
  const regel = await env.DB.prepare(`UPDATE plekken SET
    badge_x = ?, badge_y = ?, x = ?, y = ?, b = ?, h = ?, cx = ?, cy = ?, rx = ?, ry = ?
    WHERE id = ? AND soort = ? AND vorm_type = ? RETURNING *`)
    .bind(badge.x, badge.y, vorm.x ?? null, vorm.y ?? null, vorm.b ?? null, vorm.h ?? null,
      vorm.cx ?? null, vorm.cy ?? null, vorm.rx ?? null, vorm.ry ?? null, plek.id, plek.soort, vorm.type)
    .first<Regel>();
  return regel ? plekUitRegel(regel) : null;
}

/** Of een plek op de site is bijgemaakt. Dit blijft nodig voor het automatisch opruimen van lege punten. */
export async function isBijgemaakt(id: string): Promise<boolean> {
  await klaar();
  const regel = await env.DB.prepare('SELECT vast FROM plekken WHERE id = ?').bind(id).first<{ vast: number }>();
  return Boolean(regel) && !regel!.vast;
}

/** Hoeveel plekken er op de site zijn bijgemaakt. */
export async function aantalBijgemaakt(): Promise<number> {
  await klaar();
  const regel = await env.DB.prepare('SELECT COUNT(*) AS aantal FROM plekken WHERE vast = 0').first<{ aantal: number }>();
  return regel?.aantal ?? 0;
}

/** Het hoogste eigen nummer plus één; verwijderen mag geen bestaand id opnieuw gebruiken. */
export async function volgendBijgemaaktNummer(): Promise<number> {
  await klaar();
  const regels = await env.DB.prepare("SELECT id FROM plekken WHERE vast = 0 AND id LIKE 'eigen-%'").all<{ id: string }>();
  const hoogste = regels.results.reduce((max, regel) => {
    const nummer = Number.parseInt(regel.id.slice('eigen-'.length), 10);
    return Number.isFinite(nummer) ? Math.max(max, nummer) : max;
  }, 0);
  return hoogste + 1;
}

/** Het volgende kaartnummer; bakken en vrije plantvakken delen één nummerreeks. */
export async function volgendPlekNummer(): Promise<string> {
  await klaar();
  const regels = await env.DB.prepare("SELECT label FROM plekken WHERE label <> ''").all<{ label: string }>();
  const hoogste = regels.results.reduce((max, regel) => {
    const nummer = Number.parseInt(regel.label, 10);
    return Number.isFinite(nummer) ? Math.max(max, nummer) : max;
  }, 0);
  return String(hoogste + 1);
}

/** Metadata voor de verwijderactie; vaste bakken mogen bewust ook worden opgeruimd. */
export async function plekMetadata(id: string): Promise<{ vast: boolean; soort: string } | null> {
  await klaar();
  const regel = await env.DB.prepare('SELECT vast, soort FROM plekken WHERE id = ?').bind(id).first<{ vast: number; soort: string }>();
  return regel ? { vast: Boolean(regel.vast), soort: regel.soort } : null;
}

export async function maakPlek(plek: Plek): Promise<Plek> {
  await klaar();
  const laatste = await env.DB.prepare('SELECT MAX(volgorde) AS hoogste FROM plekken').first<{ hoogste: number | null }>();
  await bewaarPlekOpdracht(plek, false, (laatste?.hoogste ?? 0) + 1, new Date().toISOString()).run();
  return plek;
}

/** Verwijder een lege plek en de bijbehorende koppelingen. Vaste bakken mogen expliciet mee. */
export async function verwijderPlek(id: string, ookVasteBak = false) {
  await klaar();
  const plekOpdracht = ookVasteBak
    ? env.DB.prepare('DELETE FROM plekken WHERE id = ? AND vast = 1 AND soort = ?').bind(id, 'bak')
    : env.DB.prepare('DELETE FROM plekken WHERE id = ? AND vast = 0').bind(id);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM beplanting WHERE plek_id = ?').bind(id),
    plekOpdracht,
  ]);
}
