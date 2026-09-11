'use client';

import Link from '@/app/components/NativeLink';
import { plekNaam } from '@/app/data/tuinTekst';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, NietGevonden, PlantZoeker, Terug } from '../../onderdelen';

/**
 * De omgekeerde volgorde van /beheren/plaatsen: daar kies je eerst de plant en wijs je
 * daarna de plek aan, hier is de plek al bekend en zoek je alleen nog de plant. Dat is de
 * volgorde die je vanaf de plattegrond wilt, want daar heb je de bak net aangeklikt.
 *
 * Het bijschrift zegt niet "staat al op 2 plekken" zoals bij /beheren/plaatsen, maar iets
 * dat hier telt: staat hij al op déze plek, dan valt er niets toe te voegen.
 */
export default function PlantZoekenVoorPlek({ plekId }: { plekId: string }) {
  const { planten, plekVan, beplanting, plekkenVan } = useBeheer();
  const plek = plekVan(plekId);

  if (!plek) return <NietGevonden
    titel="Deze plek bestaat niet meer"
    tekst="Een plek die hier is bijgemaakt en leeg kwam te staan, wordt opgeruimd. Kies de plek opnieuw op de kaart."
    naar="/beheren/plaatsen"
    tekstTerug="Een plant kiezen"
  />;

  const hier = new Set(beplanting[plekId] || []);
  // Op een boom- of heesterpunt hoort alleen een soort die zelf een boom of heester is; de
  // rest van de bibliotheek zou hier toch geweigerd worden, dus die tonen we niet eens.
  const opPunt = plek.soort === 'heester';
  const teKiezen = opPunt ? planten.filter((kandidaat) => kandidaat.boomHeester) : planten;

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/plattegrond" tekst="Terug naar de plattegrond" />
    <h1>Wat staat er op {plekNaam(plek)}?</h1>
    <p className="lead">{opPunt
      ? 'Dit is een boom- of heesterplek: één punt op de kaart. Je ziet daarom alleen soorten die als boom of heester in de tuin staan.'
      : 'Zoek de plant op die je hier hebt gevonden.'}</p>
    <PlantZoeker
      planten={teKiezen}
      adres={(plant) => `/beheren/toevoegen/${encodeURIComponent(plekId)}/${encodeURIComponent(plant.slug)}`}
      bijschrift={(plant) => {
        if (hier.has(plant.slug)) return 'Staat hier al';
        const elders = plekkenVan(plant.slug);
        return elders.length === 0
          ? 'Staat nog nergens in de tuin'
          : `Staat al op ${elders.length} ${elders.length === 1 ? 'andere plek' : 'andere plekken'}`;
      }}
    />
    <Link className="beheer-uitweg" href="/beheren/nieuw">
      <b>Deze plant staat er niet bij</b>
    </Link>
  </div>;
}
