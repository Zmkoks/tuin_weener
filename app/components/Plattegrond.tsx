'use client';

import type { ReactNode } from 'react';

/**
 * De plattegrond zoals hij altijd bedoeld was: de vaste ondergrond als achtergrond,
 * en daarbovenop de plantvakken uit tuin.json als aanklikbare vormen.
 *
 * De ondergrond (plattegrond_ondergrond.svg) en de vormen in tuin.json delen hetzelfde
 * stelsel: viewBox "0 0 210 297", oftewel millimeters op A4. Daarom vallen ze zonder
 * omrekenen precies over elkaar heen.
 */

export type PlattegrondZone = {
  id: string;
  label: string;
  soort: string;
  vorm: { type: string; x?: number; y?: number; b?: number; h?: number; cx?: number; cy?: number; rx?: number; ry?: number };
};

type Props = {
  zones: PlattegrondZone[];
  gekozen: string;
  onKies: (id: string) => void;
  /** Voor de tekst die verschijnt als je met de muis boven een vak hangt. */
  namen?: Record<string, string[]>;
  /**
   * Aanwijsmodus: een klik levert millimeters op de kaart op in plaats van een bestaande
   * plek. Gebruikt bij het beheren, om een plek bij te maken waar er nog geen was.
   */
  opPunt?: (x: number, y: number) => void;
  /** Het aangewezen punt, om te laten zien waar het terechtkomt. */
  punt?: { x: number; y: number } | null;
  /**
   * Extra tekening tussen de achtergrond en de klikvlakken — in de praktijk de nummers en
   * de legenda (`KaartIndex`). Die komt als prop binnen en niet uit deze component, omdat
   * `PlattegrondZone` bewust alleen de vorm kent en niet het badge-punt.
   */
  indexLaag?: ReactNode;
};

/** Straal van een boom of heester, in millimeters op de kaart. */
const PUNT_STRAAL = 3.1;

function Vorm({ zone }: { zone: PlattegrondZone }) {
  const { vorm } = zone;
  if (vorm.type === 'rect') return <rect x={vorm.x} y={vorm.y} width={vorm.b} height={vorm.h} rx={0.8} />;
  if (vorm.type === 'ellipse') return <ellipse cx={vorm.cx} cy={vorm.cy} rx={vorm.rx} ry={vorm.ry} />;
  return <circle cx={vorm.x} cy={vorm.y} r={PUNT_STRAAL} />;
}

export default function Plattegrond({ zones, gekozen, onKies, namen, opPunt, punt, indexLaag }: Props) {
  return <svg className={`plattegrond${opPunt ? ' aanwijzen' : ''}`} viewBox="0 0 210 297" role="group" aria-label="Plattegrond van de tuin">
    <image href="/plattegrond-tuin.svg" x="0" y="0" width="210" height="297" />
    {indexLaag}
    {zones.map((zone) => {
      const hier = namen?.[zone.id] || [];
      const omschrijving = hier.length > 0 ? hier.join(', ') : 'nog leeg';
      return <g
        key={zone.id}
        className={`plattegrond-vak ${zone.vorm.type === 'punt' ? 'punt' : ''} ${gekozen === zone.id ? 'gekozen' : ''}`}
        role="button"
        tabIndex={0}
        aria-pressed={gekozen === zone.id}
        aria-label={omschrijving}
        onClick={() => onKies(zone.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onKies(zone.id);
          }
        }}
      >
        <title>{omschrijving}</title>
        <Vorm zone={zone} />
      </g>;
    })}
    {/* In de aanwijsmodus vangt dit vlak elke klik; de bestaande vakken doen dan even
        niet mee (pointer-events in globals.css). getScreenCTM rekent de klik terug naar
        millimeters, dus het klopt bij elk schermformaat. */}
    {opPunt && <rect
      className="plattegrond-vlak"
      x="0" y="0" width="210" height="297"
      onClick={(gebeurtenis) => {
        const kaart = gebeurtenis.currentTarget.ownerSVGElement;
        const stelsel = kaart?.getScreenCTM();
        if (!kaart || !stelsel) return;
        const plek = kaart.createSVGPoint();
        plek.x = gebeurtenis.clientX;
        plek.y = gebeurtenis.clientY;
        const mm = plek.matrixTransform(stelsel.inverse());
        opPunt(Math.round(mm.x * 100) / 100, Math.round(mm.y * 100) / 100);
      }}
    />}
    {punt && <circle className="plattegrond-nieuw" cx={punt.x} cy={punt.y} r={PUNT_STRAAL} />}
  </svg>;
}
