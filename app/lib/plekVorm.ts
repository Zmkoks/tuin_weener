import type { Plek, Vorm } from '../data/plekTypes';

export const KAART_B = 210;
export const KAART_H = 297;
export const MIN_MAAT = 5;
export const rond = (n: number) => Math.round(n * 100) / 100;
const rondOvaal = (n: number) => Math.round(n * 1000) / 1000;
const begrens = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function bewerkbaar(plek: Pick<Plek, 'soort' | 'vorm'>) {
  return (plek.soort === 'bak' && ['rect', 'ellipse'].includes(plek.vorm.type))
    || (plek.soort === 'vrij' && plek.vorm.type === 'ellipse');
}

/** Alleen een oude, losse punt-aanwijzing mag verdwijnen zodra de laatste plant is weggehaald. */
export function isTijdelijkePuntplek(plek: Pick<Plek, 'id' | 'vorm'> | null | undefined) {
  return Boolean(plek && plek.id.startsWith('eigen-') && plek.vorm.type === 'punt');
}

export function kader(v: Vorm) {
  return v.type === 'rect'
    ? { x: v.x!, y: v.y!, b: v.b!, h: v.h! }
    : { x: v.cx! - v.rx!, y: v.cy! - v.ry!, b: 2 * v.rx!, h: 2 * v.ry! };
}

/** Gedeeld door aanmaken en wijzigen; alleen echte, eindige getallen accepteren. */
export function keurVorm(invoer: unknown, soort: string): Vorm {
  if (!invoer || typeof invoer !== 'object' || Array.isArray(invoer)) throw new Error('De vorm ontbreekt.');
  const v = invoer as Record<string, unknown>;
  if (!['bak', 'vrij'].includes(soort) || typeof v.type !== 'string' || !['rect', 'ellipse'].includes(v.type)
    || (soort === 'vrij' && v.type !== 'ellipse')) throw new Error('Kies een rechthoekige of ronde bak, of een vrije ovale plek.');
  const keys = v.type === 'rect' ? ['x', 'y', 'b', 'h'] : ['cx', 'cy', 'rx', 'ry'];
  if (keys.some((key) => typeof v[key] !== 'number' || !Number.isFinite(v[key]))) throw new Error('De plaats en grootte moeten geldige getallen zijn.');
  const afronden = v.type === 'ellipse' ? rondOvaal : rond;
  const vorm = Object.fromEntries([['type', v.type], ...keys.map((key) => [key, afronden(v[key] as number)])]) as Vorm;
  if (vorm.type === 'ellipse' && soort === 'bak') {
    if (Math.abs(vorm.rx! - vorm.ry!) > 0.020001) throw new Error('Een ronde plantenbak moet rond blijven.');
    vorm.rx = vorm.ry = rondOvaal((vorm.rx! + vorm.ry!) / 2);
  }
  const { x, y, b, h } = kader(vorm);
  if (b < MIN_MAAT || h < MIN_MAAT || x < -0.000001 || y < -0.000001
    || x + b > KAART_B + 0.000001 || y + h > KAART_H + 0.000001) {
    throw new Error('De plek moet binnen de plattegrond vallen en minstens 5 mm breed en hoog zijn.');
  }
  return vorm;
}

export function nummerPositie(v: Vorm, soort: string) {
  if (v.type === 'rect') return { x: rond(v.x! + v.b! / 2), y: rond(v.y! + v.h!) };
  if (v.type === 'ellipse') return {
    x: rond(v.cx!),
    y: rond(v.cy! + v.ry! - (soort === 'vrij' ? Math.min(3.2, Math.max(1, v.ry! / 4)) : 0)),
  };
  return { x: v.x!, y: v.y! };
}

export type Greep = 'verplaats' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

/** Delta ten opzichte van het begin van één sleepactie; geen cumulatieve afrondingsdrift. */
export function veranderVorm(v: Vorm, soort: string, greep: Greep, dx: number, dy: number): Vorm {
  const k = kader(v);
  if (greep === 'verplaats') {
    const x = begrens(k.x + dx, 0, KAART_B - k.b);
    const y = begrens(k.y + dy, 0, KAART_H - k.h);
    return v.type === 'rect' ? { ...v, x: rond(x), y: rond(y) }
      : { ...v, cx: rondOvaal(x + v.rx!), cy: rondOvaal(y + v.ry!) };
  }
  if (soort === 'bak' && v.type === 'ellipse') {
    const delta = greep === 'e' ? dx : greep === 'w' ? -dx : greep === 's' ? dy : -dy;
    const max = Math.min(v.cx!, KAART_B - v.cx!, v.cy!, KAART_H - v.cy!);
    const r = rondOvaal(begrens(v.rx! + delta, MIN_MAAT / 2, max));
    return { ...v, rx: r, ry: r };
  }
  let { x, y } = k;
  let rechts = k.x + k.b;
  let onder = k.y + k.h;
  if (greep.includes('w')) x = begrens(x + dx, 0, rechts - MIN_MAAT);
  if (greep.includes('e')) rechts = begrens(rechts + dx, x + MIN_MAAT, KAART_B);
  if (greep.includes('n')) y = begrens(y + dy, 0, onder - MIN_MAAT);
  if (greep.includes('s')) onder = begrens(onder + dy, y + MIN_MAAT, KAART_H);
  // Ovale grenzen op honderdsten houden: centrum en straal kunnen halve honderdsten zijn.
  x = rond(x); y = rond(y); rechts = rond(rechts); onder = rond(onder);
  return v.type === 'rect' ? { type: 'rect', x, y, b: rond(rechts - x), h: rond(onder - y) }
    : { type: 'ellipse', cx: rondOvaal((x + rechts) / 2), cy: rondOvaal((y + onder) / 2), rx: rondOvaal((rechts - x) / 2), ry: rondOvaal((onder - y) / 2) };
}
