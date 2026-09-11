'use client';

import { useState } from 'react';
import { useBeheer } from '../../../BeheerContext';
import { BovenaanBeginnen, Kaart, Melding, NietGevonden, Terug, useHandeling } from '../../../onderdelen';

/**
 * De nieuwe plek aanwijzen. Dit lijkt op /beheren/plaatsen/<slug>, met één verschil dat er
 * toe doet: de oude plek is bekend, dus die kan hier niet gekozen worden en het verhuizen
 * gebeurt als één handeling (zie `verplaats` in BeheerContext).
 */
export default function NieuwePlekKiezen({ plekId, slug }: { plekId: string; slug: string }) {
  const { plekVan, plantVan, plekken, planten, beplanting, namen, plantenOp, verplaats } = useBeheer();
  const [nieuwePlek, setNieuwePlek] = useState('');
  const { bezig, fout, doe } = useHandeling();

  const terug = `/beheren/verplaatsen/${encodeURIComponent(plekId)}`;
  const plant = plantVan(slug);
  const oud = plekVan(plekId);

  if (!oud || !plant || !(beplanting[plekId] || []).includes(slug)) return <NietGevonden
    titel="Deze plant staat hier niet"
    tekst="Volgens de gegevens staat deze plant niet op deze plek. Misschien is hij al verplaatst."
    naar={terug}
    tekstTerug="Terug naar deze plek"
  />;

  const hier = nieuwePlek ? plantenOp(nieuwePlek) : [];
  const zelfdePlek = nieuwePlek === plekId;
  // Zelfde regel als bij het plaatsen: een boom- of heesterpunt is de boom zelf.
  const opPunt = plekVan(nieuwePlek)?.soort === 'heester';
  const magHier = !opPunt || Boolean(plant.boomHeester);
  const staatEr = Boolean(nieuwePlek) && (beplanting[nieuwePlek] || []).includes(slug);

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar={terug} tekst="Een andere plant kiezen" />
    <h1>Waar staat de {plant.naam} nu?</h1>
    <p className="lead">Klik de plek aan waar je hem hebt gevonden. Hij wordt daar neergezet en van de oude plek gehaald.</p>
    <div className="beheer-werkblad">
      <Kaart plekken={plekken} gekozen={nieuwePlek} onKies={setNieuwePlek} namen={namen} planten={planten} beplanting={beplanting} />
      <aside>
        {!nieuwePlek && <div className="beheer-paneel">
          <h2>Nog geen plek gekozen</h2>
          <p>Klik op een vak, een boom of een heester op de kaart.</p>
        </div>}
        {nieuwePlek && <div className="beheer-paneel">
          <h2>Deze plek</h2>
          {hier.length === 0 ? <p>Hier staat nog niets.</p> : <>
            <p>Hier staat nu:</p>
            <ul>{hier.map((ander) => <li key={ander.slug}>{ander.naam}</li>)}</ul>
          </>}
          <Melding fout={fout} />
          {zelfdePlek
            ? <p className="beheer-let-op">Dit is de plek waar hij nu al staat. Kies een andere plek.</p>
            : !magHier
            ? <p className="beheer-let-op">Dit is een boom of heester. Zo&apos;n plek is één punt op de kaart en dat punt is de boom zelf, dus er kan geen andere plant bij. Kies een plantvak.</p>
            : <>
              {/* Staat de plant op allebei de plekken, dan komt verhuizen neer op alleen
                  weghalen bij de oude. Dat mag gewoon: `verplaats` schrijft de nieuwe plek
                  zonder dubbele regel. Het bijschrift vertelt wel wat er dan echt gebeurt. */}
              {staatEr && <p className="beheer-let-op">Hier staat al {plant.naam}. Die wordt dan alleen van de oude plek gehaald.</p>}
              <button type="button" className="beheer-doen" disabled={bezig} onClick={() => void doe(() => verplaats(plant, plekId, nieuwePlek))}>
                {bezig ? 'Bezig met opslaan…' : `${plant.naam} hierheen verplaatsen`}
              </button>
            </>}
        </div>}
      </aside>
    </div>
  </div>;
}
