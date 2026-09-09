'use client';

import { useEffect, useState } from 'react';
import Link from '@/app/components/NativeLink';
import { PlantFoto } from '@/app/components/paspoortDelen';
import { korteBotanischeNaam } from '@/app/data/tuinTekst';
import Plattegrond from '@/app/components/Plattegrond';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek } from '@/app/data/plekTypes';

/** De weg terug is nu een echt adres, dus een link en geen knop. */
export function Terug({ naar, tekst }: { naar: string; tekst: string }) {
  return <Link className="beheer-terug" href={naar}>← {tekst}</Link>;
}

export function Melding({ fout }: { fout: string }) {
  return fout ? <p className="beheer-fout" role="alert">{fout}</p> : null;
}

/**
 * Elke stap is een eigen pagina en hoort dus bovenaan te beginnen. De router bewaart de
 * scrollpositie bij het navigeren; zonder dit blijf je hangen op de hoogte van de vorige
 * stap, halverwege het volgende scherm.
 */
export function BovenaanBeginnen() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, []);
  return null;
}

/**
 * Eén handeling die kan mislukken: houdt bij of hij loopt en wat er misging. Per scherm,
 * niet gedeeld — een fout hoort te verdwijnen zodra je naar een andere stap gaat.
 */
export function useHandeling() {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  const doe = async (handeling: () => Promise<void>) => {
    setBezig(true); setFout('');
    try {
      await handeling();
    } catch (probleem) {
      setFout(probleem instanceof Error ? probleem.message : 'Opslaan is niet gelukt.');
      setBezig(false);
    }
    // Bij succes blijft `bezig` staan: het scherm gaat weg, en de knop hoort niet nog
    // even weer aanklikbaar te worden terwijl de volgende pagina laadt.
  };

  return { bezig, fout, doe };
}

export function Kaart({ plekken, gekozen, onKies, namen, planten, beplanting, opPunt, punt }: {
  plekken: Plek[];
  gekozen: string;
  onKies: (id: string) => void;
  namen: Record<string, string[]>;
  planten?: Plant[];
  beplanting?: Record<string, string[]>;
  opPunt?: (x: number, y: number) => void;
  punt?: { x: number; y: number } | null;
}) {
  return <div className="beheer-kaart">
    <Plattegrond zones={plekken} gekozen={gekozen} onKies={onKies} namen={namen} plants={planten} placements={beplanting} opPunt={opPunt} punt={punt} />
  </div>;
}

/** De plant opzoeken. Elke regel is een link naar de volgende stap voor die plant. */
export function PlantZoeker({ planten, adres, bijschrift }: {
  planten: Plant[];
  adres: (plant: Plant) => string;
  bijschrift?: (plant: Plant) => string;
}) {
  const [zoek, setZoek] = useState('');
  const woorden = zoek.trim().toLowerCase();
  const gevonden = woorden
    ? planten.filter((plant) => `${plant.naam} ${plant.botanischeNaam}`.toLowerCase().includes(woorden))
    : planten;

  return <>
    <label className="beheer-zoek">
      <span aria-hidden="true">⌕</span>
      <input aria-label="Zoek een plant" placeholder="Zoek op naam of soort…" value={zoek} onChange={(gebeurtenis) => setZoek(gebeurtenis.target.value)} />
    </label>
    <div className="beheer-lijst">
      {gevonden.map((plant) => <Link key={plant.slug} href={adres(plant)}>
        <PlantFoto plant={plant} />
        <span>
          <b>{plant.naam}</b>
          <i>{korteBotanischeNaam(plant.botanischeNaam)}</i>
          {bijschrift && <small>{bijschrift(plant)}</small>}
        </span>
        <strong aria-hidden="true">→</strong>
      </Link>)}
      {gevonden.length === 0 && <p className="beheer-leeg">Geen plant gevonden met deze naam.</p>}
    </div>
  </>;
}

/**
 * Een adres kan naar iets wijzen dat er niet (meer) is: een plant die is weggehaald, of
 * een plek die is opgeruimd. Dat is met echte adressen geen randgeval meer — mensen
 * bewaren links en gebruiken de terugknop.
 */
export function NietGevonden({ titel, tekst, naar, tekstTerug }: {
  titel: string;
  tekst: string;
  naar: string;
  tekstTerug: string;
}) {
  return <div className="beheer">
    <Terug naar={naar} tekst={tekstTerug} />
    <h1>{titel}</h1>
    <p className="lead">{tekst}</p>
  </div>;
}
