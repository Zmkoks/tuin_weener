'use client';

import { useBeheer } from '../BeheerContext';
import { BovenaanBeginnen, PlantZoeker, Terug } from '../onderdelen';

export default function PlantZoekenOmTeWijzigen() {
  const { planten } = useBeheer();

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren" tekst="Terug naar het begin" />
    <h1>Van welke plant klopt de informatie niet?</h1>
    <p className="lead">Zoek de plant op waarvan je de informatie wilt aanpassen.</p>
    <PlantZoeker planten={planten} adres={(plant) => `/beheren/aanpassen/${encodeURIComponent(plant.slug)}`} />
  </div>;
}
