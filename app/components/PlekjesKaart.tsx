import Link from '@/app/components/NativeLink';
import type { Plek, Vorm } from '../data/plekTypes';

/**
 * Een klein kaartje met een stip op elke plek waar déze plant staat.
 *
 * De grote plattegrond op de homepage vertelt pas waar iets staat als je erop klikt. Voor
 * één plant is dat onnodig werk: hier zie je in één oogopslag waar je moet zijn.
 *
 * Zelfde stelsel als overal (§3): viewBox "0 0 210 297", millimeters op A4 staand, dus de
 * vormen uit tuin.json vallen zonder omrekenen over de gegenereerde ondergrond heen.
 */

/** Het midden van een vorm, in millimeters op de kaart. */
export function middenVan(vorm: Vorm): { x: number; y: number } | null {
  if (vorm.type === 'rect' && vorm.x !== undefined && vorm.y !== undefined) {
    return { x: vorm.x + (vorm.b ?? 0) / 2, y: vorm.y + (vorm.h ?? 0) / 2 };
  }
  if (vorm.type === 'ellipse' && vorm.cx !== undefined && vorm.cy !== undefined) {
    return { x: vorm.cx, y: vorm.cy };
  }
  if (vorm.x !== undefined && vorm.y !== undefined) return { x: vorm.x, y: vorm.y };
  return null;
}

export default function PlekjesKaart({ plekken, naam }: { plekken: Plek[]; naam: string }) {
  const stippen = plekken.map((plek) => ({ id: plek.id, midden: middenVan(plek.vorm) }))
    .filter((stip): stip is { id: string; midden: { x: number; y: number } } => stip.midden !== null);
  if (stippen.length === 0) return null;

  return <Link className="plekjes-kaart" href="/plattegrond" aria-label={`Bekijk de plattegrond; de ${naam} staat op ${stippen.length === 1 ? 'één plek' : `${stippen.length} plekken`}`}>
    <svg viewBox="0 0 210 297" role="img" aria-label={`Plattegrond met ${stippen.length === 1 ? 'de plek' : 'de plekken'} van de ${naam}`}>
      <image href="/plattegrond-tuin.svg" x="0" y="0" width="210" height="297" />
      {stippen.map((stip) => <g className="plekje" key={stip.id}>
        {/* Witte ring eronder, zodat de stip leesbaar blijft op zowel het gazon als de
            beige paden en de getekende beplanting. */}
        <circle cx={stip.midden.x} cy={stip.midden.y} r={5.4} />
        <circle cx={stip.midden.x} cy={stip.midden.y} r={3.1} />
      </g>)}
    </svg>
  </Link>;
}
