'use client';

import { useState } from 'react';
import type { Vorm } from '@/app/data/plekTypes';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, Kaart, Melding, Terug, useHandeling } from '../../onderdelen';

type VormType = 'rect' | 'ellipse';

export default function Scherm() {
  const { plekken, planten, beplanting, namen, maakPlek } = useBeheer();
  const [vormType, setVormType] = useState<VormType>('rect');
  const [vorm, setVorm] = useState<Vorm | null>(null);
  const { bezig, fout, doe } = useHandeling();

  const kiesVorm = (nieuwType: VormType) => {
    setVormType(nieuwType);
    setVorm(null);
  };

  const maat = vorm?.type === 'rect' && vorm.b && vorm.h
    ? `${vorm.b} × ${vorm.h} mm`
    : vorm?.type === 'ellipse' && vorm.rx
      ? `doorsnee ${vorm.rx * 2} mm`
      : '';

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren" tekst="Terug naar het begin" />
    <h1>Een plantvak tekenen</h1>
    <p className="lead">Kies een vorm en sleep die op de plattegrond. Zo maak je een rechthoekige of ronde plantenbak waar je later planten aan kunt toevoegen.</p>

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
          <h2>Vorm kiezen</h2>
          <p>Sleep op de kaart om het vak te tekenen. Een cirkel blijft rond, ook als je niet precies vierkant sleept.</p>
          <div className="vorm-keuze" role="group" aria-label="Vorm van het nieuwe plantvak">
            <button type="button" className={vormType === 'rect' ? 'gekozen' : ''} aria-pressed={vormType === 'rect'} onClick={() => kiesVorm('rect')}>
              <span className="vorm-icoon rechthoek" aria-hidden="true" />
              Rechthoek
            </button>
            <button type="button" className={vormType === 'ellipse' ? 'gekozen' : ''} aria-pressed={vormType === 'ellipse'} onClick={() => kiesVorm('ellipse')}>
              <span className="vorm-icoon cirkel" aria-hidden="true" />
              Cirkel
            </button>
          </div>
          {vorm && <p className="teken-maat">Gekozen: {maat}</p>}
          <Melding fout={fout} />
          <button type="button" className="beheer-doen" disabled={!vorm || bezig} onClick={() => vorm && void doe(() => maakPlek(vorm))}>
            {bezig ? 'Bezig met opslaan…' : 'Plantvak opslaan'}
          </button>
          <p className="beheer-let-op">Het nieuwe vak staat na opslaan meteen op de kaart. Voeg er daarna planten aan toe via “Een plant toevoegen op een plek”.</p>
        </div>
      </aside>
    </div>
  </div>;
}
