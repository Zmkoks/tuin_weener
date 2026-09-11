'use client';

import Link from '@/app/components/NativeLink';
import { PlantFoto } from '@/app/components/paspoortDelen';
import { korteBotanischeNaam } from '@/app/data/tuinTekst';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, NietGevonden, Terug } from '../../onderdelen';

export default function PlantKiezen({ plekId }: { plekId: string }) {
  const { plekVan, plantenOp } = useBeheer();

  if (!plekVan(plekId)) return <NietGevonden
    titel="Deze plek bestaat niet meer"
    tekst="Een plek die hier is bijgemaakt en leeg kwam te staan, wordt opgeruimd. Kies de plek opnieuw op de kaart."
    naar="/beheren/weghalen"
    tekstTerug="Een plek kiezen"
  />;

  const hier = plantenOp(plekId);

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren/weghalen" tekst="Een andere plek kiezen" />
    <h1>Welke plant wil je verwijderen?</h1>
    <p className="lead">Kies de plant die hier niet meer staat. Hij blijft wel in de bibliotheek staan.</p>
    <div className="beheer-lijst">
      {hier.map((plant) => <Link key={plant.slug} href={`/beheren/weghalen/${encodeURIComponent(plekId)}/${encodeURIComponent(plant.slug)}`}>
        <PlantFoto plant={plant} />
        <span><b>{plant.naam}</b><i>{korteBotanischeNaam(plant.botanischeNaam)}</i></span>
        <strong aria-hidden="true">→</strong>
      </Link>)}
      {hier.length === 0 && <p className="beheer-leeg">Hier staat volgens de gegevens niets meer.</p>}
    </div>
  </div>;
}
