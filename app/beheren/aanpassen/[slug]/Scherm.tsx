'use client';

import { useState } from 'react';
import { PlantFormFields, formVanPlant, type PlantForm } from '@/app/components/plantFormulier';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, Melding, NietGevonden, Terug, useHandeling } from '../../onderdelen';
import type { Plant } from '@/app/data/plantTypes';

function Formulier({ plant }: { plant: Plant }) {
  const { bewaarPlant } = useBeheer();
  const [waarden, setWaarden] = useState<PlantForm>(() => formVanPlant(plant));
  const { bezig, fout, doe } = useHandeling();

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren/aanpassen" tekst="Een andere plant kiezen" />
    <h1>Informatie over de {plant.naam}</h1>
    <p className="lead">Pas aan wat er niet klopt en sla het op. De plantenpagina en de QR-code laten daarna de nieuwe tekst zien.</p>
    <Melding fout={fout} />
    <form className="plant-creator" onSubmit={(gebeurtenis) => { gebeurtenis.preventDefault(); void doe(() => bewaarPlant(plant, waarden)); }}>
      <div className="plant-form">
        <PlantFormFields form={waarden} setForm={setWaarden} />
        <div className="plant-form-actions">
          <p>De naam mag veranderen; het adres van de plantenpagina blijft hetzelfde, zodat de bordjes in de tuin blijven werken.</p>
          <button type="submit" className="primary-action" disabled={bezig}>{bezig ? 'Opslaan…' : 'Wijziging opslaan'}</button>
        </div>
      </div>
    </form>
  </div>;
}

export default function PlantWijzigen({ slug }: { slug: string }) {
  const plant = useBeheer().plantVan(slug);
  if (!plant) return <NietGevonden
    titel="Deze plant staat niet in de bibliotheek"
    tekst="Misschien is de naam veranderd of is de plant verwijderd. Kies hem opnieuw uit de lijst."
    naar="/beheren/aanpassen"
    tekstTerug="Een plant kiezen"
  />;

  // De sleutel zorgt dat het formulier opnieuw begint als je binnen dit adres van plant
  // wisselt; anders blijven de waarden van de vorige plant in de velden staan.
  return <Formulier key={plant.slug} plant={plant} />;
}
