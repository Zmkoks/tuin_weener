'use client';

import Link from '@/app/components/NativeLink';
import { useBeheer } from '../../../BeheerContext';
import { BovenaanBeginnen, Melding, NietGevonden, Terug, useHandeling } from '../../../onderdelen';

/**
 * Het "weet je het zeker"-scherm. Dit is wél een eigen adres: er valt hier nog iets te
 * kiezen, en de terugknop hoort naar de lijst met planten op deze plek te gaan. Het
 * scherm ná het opslaan heeft juist géén adres — zie BeheerContext.
 */
export default function Bevestigen({ plekId, slug }: { plekId: string; slug: string }) {
  const { plekVan, plantVan, beplanting, haalWeg } = useBeheer();
  const { bezig, fout, doe } = useHandeling();

  const terug = `/beheren/weghalen/${encodeURIComponent(plekId)}`;
  const plant = plantVan(slug);

  if (!plekVan(plekId) || !plant || !(beplanting[plekId] || []).includes(slug)) return <NietGevonden
    titel="Deze plant staat hier niet"
    tekst="Volgens de gegevens staat deze plant niet op deze plek. Misschien is hij al weggehaald."
    naar={terug}
    tekstTerug="Terug naar deze plek"
  />;

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar={terug} tekst="Een andere plant kiezen" />
    <h1>Welke plant wil je verwijderen?</h1>
    <Melding fout={fout} />
    <div className="beheer-paneel beheer-bevestig">
      <h2>{plant.naam} van deze plek halen?</h2>
      <p>De plant blijft in de bibliotheek staan, met zijn eigen pagina en QR-code. Hij verdwijnt alleen van deze plek op de kaart.</p>
      <div className="beheer-knoppen">
        <Link href={terug}>Nee, toch niet</Link>
        <button type="button" className="beheer-doen beheer-weg" disabled={bezig} onClick={() => void doe(() => haalWeg(plant, plekId))}>
          {bezig ? 'Bezig…' : 'Ja, weghalen'}
        </button>
      </div>
    </div>
  </div>;
}
