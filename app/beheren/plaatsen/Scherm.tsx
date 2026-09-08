'use client';

import Link from '@/app/components/NativeLink';
import { useBeheer } from '../BeheerContext';
import { BovenaanBeginnen, PlantZoeker, Terug } from '../onderdelen';

export default function PlantZoekenOmTePlaatsen() {
  const { planten, plekkenVan } = useBeheer();

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren" tekst="Terug naar het begin" />
    <h1>Om welke plant gaat het?</h1>
    <p className="lead">Zoek de plant op. Achter elke plant zie je of hij al ergens anders in de tuin staat.</p>
    <PlantZoeker
      planten={planten}
      adres={(plant) => `/beheren/plaatsen/${encodeURIComponent(plant.slug)}`}
      bijschrift={(plant) => {
        const hier = plekkenVan(plant.slug);
        return hier.length === 0
          ? 'Staat nog nergens in de tuin'
          : `Staat al op ${hier.length} ${hier.length === 1 ? 'plek' : 'plekken'}`;
      }}
    />
    <Link className="beheer-uitweg" href="/beheren/nieuw">
      <b>Deze plant staat er niet bij</b>
    </Link>
  </div>;
}
