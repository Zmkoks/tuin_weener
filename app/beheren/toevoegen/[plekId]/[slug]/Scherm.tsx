'use client';

import Link from '@/app/components/NativeLink';
import { plekNaam } from '@/app/data/tuinTekst';
import { useBeheer } from '../../../BeheerContext';
import { BovenaanBeginnen, Melding, NietGevonden, Terug, useHandeling } from '../../../onderdelen';

/** Dezelfde bevestigingsstap als bij weghalen, zodat de twee richtingen hetzelfde voelen. */
export default function Bevestigen({ plekId, slug }: { plekId: string; slug: string }) {
  const { plekVan, plantVan, beplanting, plantenOp, zetOpPlek } = useBeheer();
  const { bezig, fout, doe } = useHandeling();

  const terug = `/beheren/toevoegen/${encodeURIComponent(plekId)}`;
  const plek = plekVan(plekId);
  const plant = plantVan(slug);

  if (!plek || !plant) return <NietGevonden
    titel="Dit kan niet meer"
    tekst="De plek of de plant bestaat niet meer. Kies opnieuw."
    naar={terug}
    tekstTerug="Terug naar deze plek"
  />;

  const hier = plantenOp(plekId);
  const staatEr = (beplanting[plekId] || []).includes(slug);

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar={terug} tekst="Een andere plant kiezen" />
    <h1>Klopt dit?</h1>
    <Melding fout={fout} />
    <div className="beheer-paneel beheer-bevestig">
      <h2>Zet je de {plant.naam} op {plekNaam(plek)}?</h2>
      {hier.length === 0
        ? <p>Op deze plek staat volgens de gegevens nog niets.</p>
        : <p>Hier staat nu: {hier.map((ander) => ander.naam).join(', ')}.</p>}
      {staatEr
        ? <p className="beheer-let-op">Hier staat al {plant.naam}. Er valt niets toe te voegen.</p>
        : <div className="beheer-knoppen">
          <Link href={terug}>Nee, toch niet</Link>
          <button type="button" className="beheer-doen" disabled={bezig} onClick={() => void doe(() => zetOpPlek(plant, plekId))}>
            {bezig ? 'Bezig…' : 'Ja, hier neerzetten'}
          </button>
        </div>}
    </div>
  </div>;
}
