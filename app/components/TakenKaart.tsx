'use client';

import Link from '@/app/components/NativeLink';
import type { Vorm } from '../data/plekTypes';
import { icoonPad } from '../data/iconen';
import { middenVan } from './PlekjesKaart';
import { TAAK_NAAM, type PlekTaak } from '../lib/taken';

/**
 * De maandtaak op de kaart: op elke bak waar deze maand iets te doen is staat het icoon van
 * die taak — dezelfde schaar en dezelfde vrucht als in de lijst ernaast.
 *
 * De lijst vertelt *wat* er moet gebeuren, maar niet *waar*. Dit kaartje maakt van die lijst
 * een rondje door de tuin. De bak eronder krijgt een randje, want een los icoon boven het
 * gazon zegt niet in welke bak je moet zijn.
 *
 * Zelfde stelsel als overal (§3): viewBox "0 0 210 297", millimeters op A4 staand, dus de
 * vormen uit tuin.json vallen zonder omrekenen over de ondergrond heen.
 */

/** Alles in millimeters op de kaart. */
const RING = 4.6;
const BOL = 4.1;
const ICOON = 5.2;
/** Staan er twee iconen op één bak, dan schuift elk er zoveel vanaf. */
const UIT_ELKAAR = 4.6;
/** Straal van een boom of heester; gelijk aan `PUNT_STRAAL` in Plattegrond.tsx. */
const PUNT_STRAAL = 3.1;

function Omtrek({ vorm }: { vorm: Vorm }) {
  if (vorm.type === 'rect') return <rect x={vorm.x} y={vorm.y} width={vorm.b} height={vorm.h} rx={0.8} />;
  if (vorm.type === 'ellipse') return <ellipse cx={vorm.cx} cy={vorm.cy} rx={vorm.rx} ry={vorm.ry} />;
  return <circle cx={vorm.x} cy={vorm.y} r={PUNT_STRAAL} />;
}

type Props = {
  plekken: PlekTaak[];
  maand: string;
  /** De plant waar de bezoeker in de lijst boven hangt; die bak licht dan mee op. */
  actief?: string | null;
};

export default function TakenKaart({ plekken, maand, actief }: Props) {
  const gemerkt = plekken
    .map((plek) => ({ ...plek, midden: middenVan(plek.plek.vorm) }))
    .filter((plek): plek is PlekTaak & { midden: { x: number; y: number } } => plek.midden !== null);
  if (gemerkt.length === 0) return null;

  return <Link className="nu-kaart" href="/plattegrond" aria-label={`Bekijk de plattegrond; er is deze maand iets te doen op ${gemerkt.length === 1 ? 'één plek' : `${gemerkt.length} plekken`}`}>
    <svg viewBox="0 0 210 297" role="img" aria-label={`Plattegrond met de plekken waar in ${maand.toLowerCase()} iets te doen is`}>
      {/* De kale ondergrond en niet de volledige kaart: die laatste heeft de planten er al in
          getekend, en dan kijk je naar een bevroren tekening met verse markeringen erover. */}
      <image href="/plattegrond_ondergrond.svg" x="0" y="0" width="210" height="297" />
      {gemerkt.map((plek) => {
        // Het tekstballonnetje noemt de planten één keer, ook als er twee taken bij horen.
        const namen = [...new Set(plek.taken.map((taak) => taak.plant.naam))].join(', ');
        const wat = plek.soorten.map((soort) => TAAK_NAAM[soort].toLowerCase()).join(' en ');
        const aan = Boolean(actief) && plek.taken.some((taak) => taak.plant.slug === actief);
        return <g className={`nu-plek${aan ? ' aan' : ''}`} key={plek.plek.id}>
          <title>{`${namen} — ${wat}`}</title>
          <g className="nu-omtrek"><Omtrek vorm={plek.plek.vorm} /></g>
          {plek.soorten.map((soort, nummer) => {
            const x = plek.midden.x + (plek.soorten.length === 1 ? 0 : (nummer === 0 ? -UIT_ELKAAR : UIT_ELKAAR) / 2);
            const y = plek.midden.y;
            return <g className={`nu-speld nu-${soort}`} key={soort}>
              {/* Witte ring eronder, zodat het icoon leesbaar blijft op zowel het gazon als
                  de beige paden en de getekende beplanting. Zelfde truc als PlekjesKaart. */}
              <circle className="nu-ring" cx={x} cy={y} r={RING} />
              <circle className="nu-bol" cx={x} cy={y} r={BOL} />
              <image href={icoonPad(soort)} x={x - ICOON / 2} y={y - ICOON / 2} width={ICOON} height={ICOON} />
            </g>;
          })}
        </g>;
      })}
    </svg>
    <span>Bekijk de hele plattegrond →</span>
  </Link>;
}
