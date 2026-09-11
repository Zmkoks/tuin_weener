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

/** Dezelfde vormen als op de grote kaart, zodat de bakken herkenbaar blijven. */
function Omtrek({ vorm }: { vorm: Vorm }) {
  if (vorm.type === 'rect') return <rect x={vorm.x} y={vorm.y} width={vorm.b} height={vorm.h} rx={0.8} />;
  if (vorm.type === 'ellipse') return <ellipse cx={vorm.cx} cy={vorm.cy} rx={vorm.rx} ry={vorm.ry} />;
  return null;
}

export default function PlekjesKaart({ plekken, alle, naam }: { plekken: Plek[]; alle?: Plek[]; naam: string }) {
  const stippen = plekken.map((plek) => ({ id: plek.id, midden: middenVan(plek.vorm) }))
    .filter((stip): stip is { id: string; midden: { x: number; y: number } } => stip.midden !== null);
  if (stippen.length === 0) return null;

  // Alle bakken meetekenen, niet alleen die van deze plant: op de kale ondergrond zweefden
  // de stippen zonder houvast, en dan zie je wel dát er twee zijn maar niet waar precies.
  // Dezelfde selectie als `.plattegrond-gebieden` op de grote kaart: bakken met een vorm,
  // geen vrije vakken en geen losse punten. De plek van deze plant licht op.
  const hier = new Set(plekken.map((plek) => plek.id));
  const vakken = (alle ?? plekken).filter((plek) => plek.soort !== 'vrij' && plek.vorm.type !== 'punt');

  return <Link className="plekjes-kaart" href="/plattegrond" aria-label={`Bekijk de plattegrond; de ${naam} staat op ${stippen.length === 1 ? 'één plek' : `${stippen.length} plekken`}`}>
    <svg viewBox="0 0 210 297" role="img" aria-label={`Plattegrond met ${stippen.length === 1 ? 'de plek' : 'de plekken'} van de ${naam}`}>
      {/* De kale ondergrond en niet de volledige kaart: die laatste heeft de planten er al in
          getekend, en dan kijk je naar een bevroren tekening met verse markeringen erover. */}
      <image href="/plattegrond_ondergrond.svg" x="0" y="0" width="210" height="297" />
      <g className="plekjes-vakken" aria-hidden="true">
        {vakken.map((plek) => <g className={`plekje-vak${hier.has(plek.id) ? ' aan' : ''}`} key={plek.id}>
          <Omtrek vorm={plek.vorm} />
        </g>)}
      </g>
      {stippen.map((stip) => <g className="plekje" key={stip.id}>
        {/* Witte ring eronder, zodat de stip leesbaar blijft op zowel het gazon als de
            beige paden en de getekende beplanting. */}
        <circle cx={stip.midden.x} cy={stip.midden.y} r={5.4} />
        <circle cx={stip.midden.x} cy={stip.midden.y} r={3.1} />
      </g>)}
    </svg>
  </Link>;
}
