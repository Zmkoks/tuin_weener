'use client';

import { useState } from 'react';
import { useBeheer } from '../../../BeheerContext';
import { BovenaanBeginnen, Kaart, Melding, NietGevonden, Terug, useHandeling } from '../../../onderdelen';

export default function PuntAanwijzen({ slug }: { slug: string }) {
  const { planten, plantVan, plekken, beplanting, namen, maakPlekEnZet } = useBeheer();
  const [punt, setPunt] = useState<{ x: number; y: number } | null>(null);
  const { bezig, fout, doe } = useHandeling();

  const plant = plantVan(slug);
  if (!plant) return <NietGevonden
    titel="Deze plant staat niet in de bibliotheek"
    tekst="Misschien is de naam veranderd of is de plant verwijderd. Kies hem opnieuw uit de lijst."
    naar="/beheren/plaatsen"
    tekstTerug="Een plant kiezen"
  />;

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar={`/beheren/plaatsen/${encodeURIComponent(plant.slug)}`} tekst="Toch een bestaande plek kiezen" />
    <h1>Waar precies staat de {plant.naam}?</h1>
    <p className="lead">Klik op de kaart de plek aan waar de plant staat. Daar komt een nieuwe plek.</p>
    <div className="beheer-werkblad">
      <Kaart plekken={plekken} gekozen="" onKies={() => {}} namen={namen} planten={planten} beplanting={beplanting} opPunt={(x, y) => setPunt({ x, y })} punt={punt} />
      <aside>
        <div className="beheer-paneel">
          <h2>Nieuwe plek</h2>
          {punt
            ? <p>Je hebt een plek aangewezen. Klopt hij niet? Klik dan gewoon opnieuw op de kaart.</p>
            : <p>Klik op de kaart om de plek aan te wijzen.</p>}
          <Melding fout={fout} />
          <button type="button" className="beheer-doen" disabled={!punt || bezig} onClick={() => punt && void doe(() => maakPlekEnZet(plant, punt))}>
            {bezig ? 'Bezig met opslaan…' : `Hier een plek maken met de ${plant.naam}`}
          </button>
          <p className="beheer-let-op">Op het scherm staat de nieuwe plek er meteen bij. Op de gedrukte plattegrond komt hij pas als die opnieuw wordt gemaakt.</p>
        </div>
      </aside>
    </div>
  </div>;
}
