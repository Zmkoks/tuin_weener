'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Plant } from '@/app/data/plantTypes';
import type { Vorm } from '@/app/data/plekTypes';
import { berekenPlantPlaatsingen, type KaartSymbool } from '@/app/lib/plattegrondPlaatsing';

/**
 * De plattegrond zoals hij altijd bedoeld was: een vaste ondergrond met daarbovenop
 * aanklikbare plekken. Als `plants` wordt meegegeven, komt de beplanting ook uit de
 * actuele gegevens in plaats van uit een oude, gegenereerde SVG.
 */
export type PlattegrondZone = {
  id: string;
  label: string;
  soort: string;
  planten?: string[];
  vorm: Vorm;
};

type Props = {
  zones: PlattegrondZone[];
  gekozen: string;
  onKies?: (id: string) => void;
  /** Voor de tekst die verschijnt als je met de muis boven een vak hangt. */
  namen?: Record<string, string[]>;
  /** Aanwijsmodus voor een nieuwe plek bij het beheren. */
  opPunt?: (x: number, y: number) => void;
  /** Het aangewezen punt, om te laten zien waar het terechtkomt. */
  punt?: { x: number; y: number } | null;
  /** De actuele planten en beplanting; zonder deze props blijft de oude kaart werken. */
  plants?: Plant[];
  placements?: Record<string, string[]>;
  /** Nummers en legenda (`KaartIndex`), boven de plantlaag en onder de klikvlakken. */
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

type SymboolDocument = Document | null;

let symbolenBronnen: Promise<{ bibliotheek: SymboolDocument; eigen: SymboolDocument }> | null = null;

function parseerSymboolbron(tekst: string) {
  return new DOMParser().parseFromString(tekst, 'image/svg+xml');
}

function laadSymboolbronnen() {
  symbolenBronnen ??= Promise.all([
    fetch('/symbolen/bibliotheek.svg').then((antwoord) => antwoord.text()).then(parseerSymboolbron),
    fetch('/api/symbolen')
      .then((antwoord) => antwoord.ok ? antwoord.text() : '')
      .then((tekst) => tekst ? parseerSymboolbron(tekst) : null)
      .catch(() => null),
  ]).then(([bibliotheek, eigen]) => ({ bibliotheek, eigen }));
  return symbolenBronnen;
}

/** De hele bibliotheek blijft in de pagina staan, omdat symbolen onderling `<use>` delen. */
function voegBronToe(document_: Document, id: string, bron: SymboolDocument) {
  if (!bron || document_.getElementById(id)) return;
  const houder = document_.createElement('div');
  houder.id = id;
  houder.setAttribute('aria-hidden', 'true');
  houder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  houder.appendChild(bron.documentElement.cloneNode(true));
  document_.body.appendChild(houder);
}

function leesSymbolen(document_: SymboolDocument) {
  if (!document_) return [];
  return [...document_.querySelectorAll<SVGElement>('g[id^="plant-"], symbol[id^="plant-"]')]
    .map((groep) => ({
      id: groep.id,
      verhouding: Number(groep.getAttribute('data-verhouding')) || 0.8,
    }));
}

function symbolenPerPlant(plants: Plant[], bibliotheek: SymboolDocument, eigen: SymboolDocument) {
  const alleBibliotheekSymbolen = leesSymbolen(bibliotheek);
  const alleEigenSymbolen = leesSymbolen(eigen);
  return Object.fromEntries(plants.map((plant) => {
    const prefix = `plant-${plant.slug}`;
    const vast = alleBibliotheekSymbolen.filter(({ id }) => id === prefix || id.startsWith(`${prefix}-`));
    const toegestane = plant.symbolen?.bibliotheek == null
      ? vast
      : vast.filter(({ id }) => plant.symbolen?.bibliotheek.includes(id));
    const eigenBestanden = plant.symbolen?.eigen ?? [];
    const eigenVoorPlant = alleEigenSymbolen
      .filter(({ id }) => id.startsWith(`${prefix}-eigen`))
      .map((symbool, index) => ({ ...symbool, bestand: eigenBestanden[index]?.bestand }));
    return [plant.slug, [...toegestane, ...eigenVoorPlant.filter((symbool) => symbool.bestand)]];
  })) as Record<string, KaartSymbool[]>;
}

function PlantVorm({ kleur, hoogte, x, y, spiegel, scheef }: {
  kleur: string;
  hoogte: number;
  x: number;
  y: number;
  spiegel: boolean;
  scheef: number;
}) {
  const breedte = hoogte * 0.55;
  return <g transform={`translate(${x},${y}) rotate(${scheef}) scale(${spiegel ? -1 : 1},1)`} opacity=".92">
    <line x1="0" y1="0" x2="0" y2={-hoogte * 0.55} stroke="#3f6b32" strokeWidth=".4" />
    <ellipse cx="0" cy={-hoogte * 0.62} rx={breedte / 2} ry={hoogte * 0.38} fill={kleur} stroke="#2f5326" strokeWidth=".25" />
    <ellipse cx={-breedte * 0.28} cy={-hoogte * 0.42} rx={breedte * 0.3} ry={hoogte * 0.2} fill={kleur} stroke="#2f5326" strokeWidth=".2" opacity=".85" />
  </g>;
}

function Plantenlaag({ zones, plants, placements }: { zones: PlattegrondZone[]; plants: Plant[]; placements: Record<string, string[]> }) {
  const [bronnen, setBronnen] = useState<{ bibliotheek: SymboolDocument; eigen: SymboolDocument } | null>(null);

  useEffect(() => {
    let actief = true;
    void laadSymboolbronnen().then((nieuweBronnen) => {
      if (!actief) return;
      voegBronToe(document, 'symbolenbibliotheek', nieuweBronnen.bibliotheek);
      voegBronToe(document, 'symboleneigen', nieuweBronnen.eigen);
      setBronnen(nieuweBronnen);
    });
    return () => { actief = false; };
  }, []);

  const catalogus = useMemo(
    () => bronnen ? symbolenPerPlant(plants, bronnen.bibliotheek, bronnen.eigen) : {},
    [bronnen, plants],
  );
  const tekeningen = useMemo(
    () => berekenPlantPlaatsingen(zones, plants, placements, catalogus),
    [catalogus, placements, plants, zones],
  );

  return <g className="plattegrond-planten" aria-hidden="true">
    {tekeningen.map((tekening) => tekening.symbool
      ? <use key={tekening.id} href={`#${tekening.symbool}`} transform={`translate(${tekening.x},${tekening.y}) rotate(${tekening.scheef}) scale(${tekening.spiegel ? -tekening.hoogte : tekening.hoogte},${tekening.hoogte})`} />
      : <PlantVorm key={tekening.id} kleur={tekening.kleur} hoogte={tekening.hoogte} x={tekening.x} y={tekening.y} spiegel={tekening.spiegel} scheef={tekening.scheef} />)}
  </g>;
}

export default function Plattegrond({ zones, gekozen, onKies, namen, opPunt, punt, plants, placements, indexLaag }: Props) {
  const dynamisch = Array.isArray(plants);
  const actueleBeplanting = placements ?? Object.fromEntries(zones.map((zone) => [zone.id, zone.planten ?? []]));

  return <svg className={`plattegrond${opPunt ? ' aanwijzen' : ''}`} viewBox="0 0 210 297" role="group" aria-label="Plattegrond van de tuin">
    <image href={dynamisch ? '/plattegrond_ondergrond.svg' : '/plattegrond-tuin.svg'} x="0" y="0" width="210" height="297" />
    {dynamisch && <g className="plattegrond-gebieden" aria-hidden="true">
      {zones.filter((zone) => zone.soort !== 'vrij' && zone.vorm.type !== 'punt').map((zone) => <Vorm key={zone.id} zone={zone} />)}
    </g>}
    {dynamisch && plants && <Plantenlaag zones={zones} plants={plants} placements={actueleBeplanting} />}
    {indexLaag}
    {zones.map((zone) => {
      const hier = namen?.[zone.id] || [];
      const omschrijving = hier.length > 0 ? hier.join(', ') : 'nog leeg';
      return <g
        key={zone.id}
        className={`plattegrond-vak ${zone.vorm.type === 'punt' ? 'punt' : ''} ${gekozen === zone.id ? 'gekozen' : ''}`}
        role={onKies ? 'button' : undefined}
        tabIndex={onKies ? 0 : undefined}
        aria-pressed={onKies ? gekozen === zone.id : undefined}
        aria-label={omschrijving}
        onClick={onKies ? () => onKies(zone.id) : undefined}
        onKeyDown={onKies ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onKies(zone.id);
          }
        } : undefined}
      >
        <title>{omschrijving}</title>
        <Vorm zone={zone} />
      </g>;
    })}
    {/* In de aanwijsmodus vangt dit vlak elke klik; getScreenCTM rekent de klik terug naar millimeters. */}
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
