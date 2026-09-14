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
    tekst="Deze plek bestaat niet meer. Alleen een tijdelijke puntplek wordt na het weghalen van de laatste plant automatisch opgeruimd."
    naar="/beheren/verplaatsen"
    tekstTerug="Een plek kiezen"
  />;

  const hier = plantenOp(plekId);

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren/verplaatsen" tekst="Een andere plek kiezen" />
    <h1>Welke plant is verhuisd?</h1>
    <p className="lead">Kies de plant die ergens anders blijkt te staan.</p>
    <div className="beheer-lijst">
      {hier.map((plant) => <Link key={plant.slug} href={`/beheren/verplaatsen/${encodeURIComponent(plekId)}/${encodeURIComponent(plant.slug)}`}>
        <PlantFoto plant={plant} />
        <span><b>{plant.naam}</b><i>{korteBotanischeNaam(plant.botanischeNaam)}</i></span>
        <strong aria-hidden="true">→</strong>
      </Link>)}
      {hier.length === 0 && <p className="beheer-leeg">Hier staat volgens de gegevens niets.</p>}
    </div>
  </div>;
}
