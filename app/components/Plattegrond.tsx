'use client';

import { useEffect, useMemo, useState, type PointerEvent, type ReactNode } from 'react';
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
  /** Welke plek oplicht. Een kaart die alleen laat zien wat er staat kiest niets. */
  gekozen?: string;
  onKies?: (id: string) => void;
  /** Voor de tekst die verschijnt als je met de muis boven een vak hangt. */
  namen?: Record<string, string[]>;
  /** Aanwijsmodus voor een nieuwe plek bij het beheren. */
  opPunt?: (x: number, y: number) => void;
  /** Het aangewezen punt, om te laten zien waar het terechtkomt. */
  punt?: { x: number; y: number } | null;
  /** Tekenmodus voor een nieuw rechthoekig of rond plantvak. */
  tekenVorm?: 'rect' | 'ellipse';
  /** Geeft tijdens het slepen de vorm door; `null` wist een vorige voorvertoning. */
  onVorm?: (vorm: Vorm | null) => void;
  /** De vorm die tijdens het tekenen of na een nieuwe poging als voorvertoning staat. */
  vormPreview?: Vorm | null;
  /** De actuele planten en beplanting; zonder deze props blijft het bij het kale terrein. */
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

const KAART_BREEDTE = 210;
const KAART_HOOGTE = 297;
const MIN_VORM_GROOTTE = 5;

function kaartPunt(gebeurtenis: PointerEvent<SVGRectElement>) {
  const kaart = gebeurtenis.currentTarget.ownerSVGElement;
  const stelsel = kaart?.getScreenCTM();
  if (!kaart || !stelsel) return null;
  const punt = kaart.createSVGPoint();
  punt.x = gebeurtenis.clientX;
  punt.y = gebeurtenis.clientY;
  const mm = punt.matrixTransform(stelsel.inverse());
  return {
    x: Math.max(0, Math.min(KAART_BREEDTE, mm.x)),
    y: Math.max(0, Math.min(KAART_HOOGTE, mm.y)),
  };
}

function afgerond(waarde: number) {
  return Math.round(waarde * 100) / 100;
}

function vormTussen(start: { x: number; y: number }, einde: { x: number; y: number }, type: 'rect' | 'ellipse'): Vorm | null {
  if (type === 'rect') {
    const breedte = Math.abs(einde.x - start.x);
    const hoogte = Math.abs(einde.y - start.y);
    if (breedte < MIN_VORM_GROOTTE || hoogte < MIN_VORM_GROOTTE) return null;
    return {
      type,
      x: afgerond(Math.min(start.x, einde.x)),
      y: afgerond(Math.min(start.y, einde.y)),
      b: afgerond(breedte),
      h: afgerond(hoogte),
    };
  }

  const straal = Math.min(Math.abs(einde.x - start.x), Math.abs(einde.y - start.y)) / 2;
  if (straal < MIN_VORM_GROOTTE / 2) return null;
  return {
    type,
    cx: afgerond((start.x + einde.x) / 2),
    cy: afgerond((start.y + einde.y) / 2),
    rx: afgerond(straal),
    ry: afgerond(straal),
  };
}

type SymboolDocument = Document | null;

let symbolenBronnen: Promise<{ bibliotheek: SymboolDocument; eigen: SymboolDocument }> | null = null;

function parseerSymboolbron(tekst: string) {
  return new DOMParser().parseFromString(tekst, 'image/svg+xml');
}

/**
 * De symbolen ophalen, één keer per pagina. De belofte wordt bewaard en niet het resultaat,
 * zodat de kaart en de printknop op dezelfde ophaalactie wachten.
 *
 * Mislukt de bibliotheek, dan geven we `null` terug in plaats van te struikelen: de kaart
 * tekent dan eenvoudige vormen in plaats van niets, en de printknop komt vrij. Wel wordt de
 * bewaarde belofte losgelaten, zodat een volgende poging het opnieuw probeert.
 */
export function laadSymboolbronnen() {
  symbolenBronnen ??= Promise.all([
    fetch('/symbolen/bibliotheek.svg')
      .then((antwoord) => antwoord.ok ? antwoord.text() : '')
      .then((tekst) => tekst ? parseerSymboolbron(tekst) : null)
      .catch(() => { symbolenBronnen = null; return null; }),
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

  // Niets tekenen zolang de symbolen niet binnen zijn. Zonder deze regel werd de kaart in
  // twee stappen opgebouwd: eerst elke plant als een ruwe ovaal (`PlantVorm`, de terugval
  // wanneer er geen symbool is), daarna de echte tekeningen. Dat was niet alleen een andere
  // vorm maar ook een andere plaats: zonder symbool valt `verhouding` terug op 0.8, en die
  // waarde bepaalt via `berekenPlantPlaatsingen` de maat én de posities. De hele bak sprong
  // dus om zodra de symbolen binnenkwamen. Nu gaat de kaart in één stap van kale tuin naar
  // afgeronde tekening. `PlantVorm` blijft bestaan voor een plant die écht geen symbool
  // heeft, en voor het geval de bibliotheek niet opgehaald kon worden. Dat is dan een
  // blijvende toestand en geen tussenstap.
  if (!bronnen) return null;

  return <g className="plattegrond-planten" aria-hidden="true">
    {tekeningen.map((tekening) => tekening.symbool
      ? <use key={tekening.id} href={`#${tekening.symbool}`} transform={`translate(${tekening.x},${tekening.y}) rotate(${tekening.scheef}) scale(${tekening.spiegel ? -tekening.hoogte : tekening.hoogte},${tekening.hoogte})`} />
      : <PlantVorm key={tekening.id} kleur={tekening.kleur} hoogte={tekening.hoogte} x={tekening.x} y={tekening.y} spiegel={tekening.spiegel} scheef={tekening.scheef} />)}
  </g>;
}

export default function Plattegrond({ zones, gekozen, onKies, namen, opPunt, punt, tekenVorm, onVorm, vormPreview, plants, placements, indexLaag }: Props) {
  const actueleBeplanting = placements ?? Object.fromEntries(zones.map((zone) => [zone.id, zone.planten ?? []]));
  const [tekenStart, setTekenStart] = useState<{ x: number; y: number } | null>(null);
  const tekenActief = Boolean(tekenVorm && onVorm);

  const beginTekenen = (gebeurtenis: PointerEvent<SVGRectElement>) => {
    if (!tekenVorm || !onVorm) return;
    const start = kaartPunt(gebeurtenis);
    if (!start) return;
    gebeurtenis.preventDefault();
    gebeurtenis.currentTarget.setPointerCapture(gebeurtenis.pointerId);
    setTekenStart(start);
    onVorm(null);
  };

  const beweegTekenen = (gebeurtenis: PointerEvent<SVGRectElement>) => {
    if (!tekenStart || !tekenVorm || !onVorm) return;
    const vorm = kaartPunt(gebeurtenis);
    if (vorm) onVorm(vormTussen(tekenStart, vorm, tekenVorm));
  };

  const eindigTekenen = (gebeurtenis: PointerEvent<SVGRectElement>) => {
    if (!tekenStart || !tekenVorm || !onVorm) return;
    const einde = kaartPunt(gebeurtenis);
    const vorm = einde ? vormTussen(tekenStart, einde, tekenVorm) : null;
    setTekenStart(null);
    onVorm(vorm);
    if (gebeurtenis.currentTarget.hasPointerCapture(gebeurtenis.pointerId)) {
      gebeurtenis.currentTarget.releasePointerCapture(gebeurtenis.pointerId);
    }
  };

  return <svg className={`plattegrond${opPunt ? ' aanwijzen' : ''}${tekenActief ? ' tekenen' : ''}`} viewBox="0 0 210 297" role="group" aria-label="Plattegrond van de tuin">
    {/* Alleen het kale terrein: paden, gazon, banken, deur. De planten worden hierboven
        getekend uit de gegevens. Hier stond eerder een terugval naar `plattegrond-tuin.svg`,
        een volledige kaart die op 7 september is gegenereerd — die liep dus achter zodra
        iemand via Beheren iets veranderde. Geen enkele aanroep gebruikte die terugval nog. */}
    <image href="/plattegrond_ondergrond.svg" x="0" y="0" width="210" height="297" />
    <g className="plattegrond-gebieden" aria-hidden="true">
      {zones.filter((zone) => zone.soort !== 'vrij' && zone.vorm.type !== 'punt').map((zone) => <Vorm key={zone.id} zone={zone} />)}
    </g>
    {plants && <Plantenlaag zones={zones} plants={plants} placements={actueleBeplanting} />}
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
    {vormPreview && <g className="plattegrond-vorm-preview" aria-hidden="true">
      <Vorm zone={{ id: 'voorvertoning', label: '', soort: 'bak', planten: [], vorm: vormPreview }} />
    </g>}
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
    {tekenActief && <rect
      className="plattegrond-tekenvlak"
      x="0" y="0" width={KAART_BREEDTE} height={KAART_HOOGTE}
      onPointerDown={beginTekenen}
      onPointerMove={beweegTekenen}
      onPointerUp={eindigTekenen}
      onPointerCancel={eindigTekenen}
    />}
  </svg>;
}
