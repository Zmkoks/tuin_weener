'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useBeheer } from '../BeheerContext';
import { BovenaanBeginnen, Kaart, Terug } from '../onderdelen';

export default function PlekKiezen() {
  const { plekken, namen, plantenOp } = useBeheer();
  const [gekozenPlek, setGekozenPlek] = useState('');
  const hier = gekozenPlek ? plantenOp(gekozenPlek) : [];

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren" tekst="Terug naar het begin" />
    <h1>Op welke plek stond de plant?</h1>
    <p className="lead">Klik de plek aan op de kaart. Daarna kies je welke plant er weg moet.</p>
    <div className="beheer-werkblad">
      <Kaart plekken={plekken} gekozen={gekozenPlek} onKies={setGekozenPlek} namen={namen} />
      <aside>
        <div className="beheer-paneel">
          {gekozenPlek ? <>
            <h2>Deze plek</h2>
            {hier.length === 0
              ? <p>Hier staat volgens de gegevens niets. Er valt dus niets weg te halen.</p>
              : <>
                <p>Hier staat nu:</p>
                <ul>{hier.map((plant) => <li key={plant.slug}>{plant.naam}</li>)}</ul>
                <Link className="beheer-doen" href={`/beheren/weghalen/${encodeURIComponent(gekozenPlek)}`}>Kies welke plant weg moet</Link>
              </>}
          </> : <>
            <h2>Nog geen plek gekozen</h2>
            <p>Klik op een vak, een boom of een heester op de kaart.</p>
          </>}
        </div>
      </aside>
    </div>
  </div>;
}
