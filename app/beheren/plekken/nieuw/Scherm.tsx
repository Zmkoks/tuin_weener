'use client';

import { useState } from 'react';
import type { Vorm } from '@/app/data/plekTypes';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, Kaart, Melding, Terug, useHandeling } from '../../onderdelen';

type VormType = 'rect' | 'circle' | 'oval';

export default function Scherm() {
  const { plekken, planten, beplanting, namen, maakPlek } = useBeheer();
  const [isBak, setIsBak] = useState(true);
  const [vormType, setVormType] = useState<VormType>('rect');
  const [vorm, setVorm] = useState<Vorm | null>(null);
  const { bezig, fout, doe } = useHandeling();

  const kiesVorm = (nieuwType: VormType) => {
    setVormType(nieuwType);
    setVorm(null);
  };

  const kiesSoort = (nieuweIsBak: boolean) => {
    setIsBak(nieuweIsBak);
    setVormType(nieuweIsBak ? 'rect' : 'oval');
    setVorm(null);
  };

  const maat = vorm?.type === 'rect' && vorm.b && vorm.h
    ? `${vorm.b} × ${vorm.h} mm`
    : vorm?.type === 'ellipse' && vorm.rx && vorm.ry
      ? Math.abs(vorm.rx - vorm.ry) < 0.01
        ? `doorsnee ${vorm.rx * 2} mm`
        : `${vorm.rx * 2} × ${vorm.ry * 2} mm`
      : '';

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren" tekst="Terug naar het begin" />
    <h1>Een plek toevoegen</h1>
    <p className="lead">Kies eerst of je een plantenbak of een vrije plek wilt tekenen. Daarna teken je de vorm op de kaart.</p>

    <div className="beheer-werkblad">
      <Kaart
        plekken={plekken}
        gekozen=""
        onKies={() => {}}
        namen={namen}
        planten={planten}
        beplanting={beplanting}
        tekenVorm={vormType}
        onVorm={setVorm}
        vormPreview={vorm}
      />
      <aside>
        <div className="beheer-paneel">
          <h2>Wat wil je tekenen?</h2>
          <div className="soort-keuze" role="radiogroup" aria-label="Soort plek">
            <button type="button" className={isBak ? 'gekozen' : ''} role="radio" aria-checked={isBak} onClick={() => kiesSoort(true)}>
              <b>Dit is een plantenbak</b>
              <small>Een afgebakende bak: kies daarna een rechthoek of cirkel.</small>
            </button>
            <button type="button" className={!isBak ? 'gekozen' : ''} role="radio" aria-checked={!isBak} onClick={() => kiesSoort(false)}>
              <b>Dit is geen plantenbak</b>
              <small>Een vrije plek in de grond: die teken je als ovaal.</small>
            </button>
          </div>
          <h2 className="vorm-kop">Vorm tekenen</h2>
          {isBak
            ? <div className="vorm-keuze" role="group" aria-label="Vorm van de plantenbak">
              <button type="button" className={vormType === 'rect' ? 'gekozen' : ''} aria-pressed={vormType === 'rect'} onClick={() => kiesVorm('rect')}>
                <span className="vorm-icoon rechthoek" aria-hidden="true" />
                Rechthoek
              </button>
              <button type="button" className={vormType === 'circle' ? 'gekozen' : ''} aria-pressed={vormType === 'circle'} onClick={() => kiesVorm('circle')}>
                <span className="vorm-icoon cirkel" aria-hidden="true" />
                Cirkel
              </button>
            </div>
            : <div className="vorm-vrije-plek">
              <span className="vorm-icoon ovaal" aria-hidden="true" />
              <p>Deze vrije plek teken je als een ovaal. Sleep over de kaart in de richting en maat die klopt.</p>
            </div>}
          <p className="teken-uitleg">Sleep op de kaart om de gekozen vorm te tekenen.</p>
          {vorm && <p className="teken-maat">Gekozen: {maat}</p>}
          <Melding fout={fout} />
          <button type="button" className="beheer-doen" disabled={!vorm || bezig} onClick={() => vorm && void doe(() => maakPlek(vorm, isBak ? 'bak' : 'vrij'))}>
            {bezig ? 'Bezig met opslaan…' : isBak ? 'Plantenbak opslaan' : 'Vrije plek opslaan'}
          </button>
          <p className="beheer-let-op">De nieuwe plek staat na opslaan meteen op de kaart. Voeg er daarna planten aan toe via “Een plant toevoegen op een plek”.</p>
        </div>
      </aside>
    </div>
  </div>;
}
