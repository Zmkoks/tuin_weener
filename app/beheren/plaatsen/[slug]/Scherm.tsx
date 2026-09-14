'use client';

import Link from '@/app/components/NativeLink';
import { useState } from 'react';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, Kaart, Melding, NietGevonden, Terug, useHandeling } from '../../onderdelen';

export default function PlekAanwijzen({ slug }: { slug: string }) {
  const { planten, plantVan, plekVan, plekken, beplanting, namen, plantenOp, zetOpPlek } = useBeheer();
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
  // Een boom- of heesterplek is geen bak maar één punt op de kaart, en dat punt ís de boom.
  // Daar kan dus geen andere plant bij. Andersom mag wel: een boom of heester kan ook in een
  // bak staan, bijvoorbeeld zolang hij nog klein is.
  const opPunt = plekVan(gekozenPlek)?.soort === 'heester';
  const magHier = !opPunt || Boolean(plant.boomHeester);

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren/plaatsen" tekst="Een andere plant kiezen" />
    <h1>Waar staat de {plant.naam}?</h1>
    <p className="lead">Klik op de kaart de plek aan waar je de plant hebt gevonden.{plant.boomHeester ? '' : ' Kies een plantvak; bomen en heesters staan als los punt op de kaart.'}</p>
    <div className="beheer-werkblad">
      <Kaart plekken={plekken} gekozen={gekozenPlek} onKies={setGekozenPlek} namen={namen} planten={planten} beplanting={beplanting} />
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
          {!magHier
            ? <p className="beheer-let-op">Dit is een boom of heester. Zo&apos;n plek is één punt op de kaart en dat punt is de boom zelf, dus er kan geen andere plant bij. Kies een plantvak.</p>
            : staatEr
              ? <p className="beheer-let-op">Hier staat al {plant.naam}.</p>
              : <button type="button" className="beheer-doen" disabled={bezig} onClick={() => void doe(() => zetOpPlek(plant, gekozenPlek))}>
                  {bezig ? 'Bezig met opslaan…' : `${plant.naam} op deze plek zetten`}
                </button>}
        </div>}
        <Link className="beheer-uitweg" href={`/beheren/plaatsen/${encodeURIComponent(plant.slug)}/nieuwe-plek`}>
          <b>{plant.boomHeester ? 'Deze boom staat nog niet op de kaart' : 'Ik kan de juiste plek niet aanwijzen'}</b>
        </Link>
      </aside>
    </div>
  </div>;
}
