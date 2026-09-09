'use client';

import Link from '@/app/components/NativeLink';
import { useState } from 'react';
import { useBeheer } from '../BeheerContext';
import { BovenaanBeginnen, Kaart, Terug } from '../onderdelen';

/**
 * Verhuizen begint bij de plek waar de plant stónd, en niet bij de plant. Dat is dezelfde
 * volgorde als bij weghalen, om dezelfde reden: iemand loopt door de tuin, ziet een lege
 * plek, en weet dan nog niet hoe de plant heet die er hoorde te staan.
 *
 * Vanaf de plattegrond wordt deze stap overgeslagen: daar is de plek al aangewezen en gaat
 * de knop rechtstreeks naar /beheren/verplaatsen/<plekId>.
 */
export default function OudePlekKiezen() {
  const { planten, plekken, beplanting, namen, plantenOp } = useBeheer();
  const [gekozenPlek, setGekozenPlek] = useState('');
  const hier = gekozenPlek ? plantenOp(gekozenPlek) : [];

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren" tekst="Terug naar het begin" />
    <h1>Waar stond de plant eerst?</h1>
    <p className="lead">Klik de plek aan waar hij volgens de kaart hoort te staan. Daarna wijs je aan waar hij nu staat.</p>
    <div className="beheer-werkblad">
      <Kaart plekken={plekken} gekozen={gekozenPlek} onKies={setGekozenPlek} namen={namen} planten={planten} beplanting={beplanting} />
      <aside>
        <div className="beheer-paneel">
          {gekozenPlek ? <>
            <h2>Deze plek</h2>
            {hier.length === 0
              ? <p>Hier staat volgens de gegevens niets. Er valt dus niets te verhuizen.</p>
              : <>
                <p>Hier staat nu:</p>
                <ul>{hier.map((plant) => <li key={plant.slug}>{plant.naam}</li>)}</ul>
                <Link className="beheer-doen" href={`/beheren/verplaatsen/${encodeURIComponent(gekozenPlek)}`}>Kies welke plant is verhuisd</Link>
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
