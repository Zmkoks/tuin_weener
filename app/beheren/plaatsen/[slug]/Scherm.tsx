'use client';

import Link from '@/app/components/NativeLink';
import { useState } from 'react';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, Kaart, Melding, NietGevonden, Terug, useHandeling } from '../../onderdelen';

export default function PlekAanwijzen({ slug }: { slug: string }) {
  const { plantVan, plekken, beplanting, namen, plantenOp, zetOpPlek } = useBeheer();
  const [gekozenPlek, setGekozenPlek] = useState('');
  const { bezig, fout, doe } = useHandeling();

  const plant = plantVan(slug);
  if (!plant) return <NietGevonden
    titel="Deze plant staat niet in de bibliotheek"
    tekst="Misschien is de naam veranderd of is de plant verwijderd. Kies hem opnieuw uit de lijst."
    naar="/beheren/plaatsen"
    tekstTerug="Een plant kiezen"
  />;

  const hier = gekozenPlek ? plantenOp(gekozenPlek) : [];
  const staatEr = gekozenPlek ? (beplanting[gekozenPlek] || []).includes(plant.slug) : false;

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren/plaatsen" tekst="Een andere plant kiezen" />
    <h1>Waar staat de {plant.naam}?</h1>
    <p className="lead">Klik op de kaart de plek aan waar je de plant hebt gevonden.</p>
    <div className="beheer-werkblad">
      <Kaart plekken={plekken} gekozen={gekozenPlek} onKies={setGekozenPlek} namen={namen} />
      <aside>
        {!gekozenPlek && <div className="beheer-paneel">
          <h2>Nog geen plek gekozen</h2>
          <p>Klik op een vak, een boom of een heester op de kaart.</p>
        </div>}
        {gekozenPlek && <div className="beheer-paneel">
          <h2>Deze plek</h2>
          {hier.length === 0 ? <p>Hier staat nog niets.</p> : <>
            <p>Hier staat nu:</p>
            <ul>{hier.map((ander) => <li key={ander.slug}>{ander.naam}</li>)}</ul>
          </>}
          <Melding fout={fout} />
          {staatEr
            ? <p className="beheer-let-op">De {plant.naam} staat hier al.</p>
            : <button type="button" className="beheer-doen" disabled={bezig} onClick={() => void doe(() => zetOpPlek(plant, gekozenPlek))}>
                {bezig ? 'Bezig met opslaan…' : `${plant.naam} op deze plek zetten`}
              </button>}
        </div>}
        <Link className="beheer-uitweg" href={`/beheren/plaatsen/${encodeURIComponent(plant.slug)}/nieuwe-plek`}>
          <b>Ik kan de juiste plek niet aanwijzen</b>
        </Link>
      </aside>
    </div>
  </div>;
}
