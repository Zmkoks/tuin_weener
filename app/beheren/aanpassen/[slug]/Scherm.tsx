'use client';

import { useState } from 'react';
import { PlantFormFields, formVanPlant, type PlantForm } from '@/app/components/plantFormulier';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, Melding, NietGevonden, Terug, useHandeling } from '../../onderdelen';
import type { Plant } from '@/app/data/plantTypes';

function Formulier({ plant }: { plant: Plant }) {
  const { bewaarPlant, verwijderPlant, plekkenVan } = useBeheer();
  const [bevestigen, setBevestigen] = useState(false);
  const aantalPlekken = plekkenVan(plant.slug).length;
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
    {/* Onderaan en rustig: verwijderen is de uitzondering. Pas na de eerste klik wordt het een
        duidelijk waarschuwingsvak, met de gevolgen als lijstje in plaats van één lange zin. */}
    <section className={`plant-verwijderen${bevestigen ? ' bevestigen' : ''}`} aria-labelledby="verwijderen-kop">
      {!bevestigen ? <>
        <div>
          <h2 id="verwijderen-kop">Plant volledig verwijderen</h2>
          <p>{aantalPlekken
            ? `De ${plant.naam} staat op ${aantalPlekken} ${aantalPlekken === 1 ? 'plek' : 'plekken'} in de tuin en wordt daar ook weggehaald.`
            : `De ${plant.naam} staat niet in de tuin. Je kunt hem in de bibliotheek laten staan of helemaal verwijderen.`}</p>
        </div>
        <button type="button" className="verwijder-start" disabled={bezig} onClick={() => setBevestigen(true)}>Plant verwijderen…</button>
      </> : <>
        <span className="verwijder-teken" aria-hidden="true">!</span>
        <div>
          <h2 id="verwijderen-kop">De {plant.naam} definitief verwijderen?</h2>
          <ul role="alert">
            <li>Alle plantinformatie, foto&apos;s en symboolkeuzes verdwijnen.</li>
            {aantalPlekken > 0 && <li>Hij wordt van {aantalPlekken === 1 ? 'zijn plek' : `alle ${aantalPlekken} plekken`} in de tuin gehaald.</li>}
            <li>Het plantenadres en de QR-code werken daarna niet meer.</li>
          </ul>
          <p className="verwijder-onomkeerbaar">Dit kun je niet ongedaan maken.</p>
          <Melding fout={fout} />
          <div className="beheer-knoppen">
            <button type="button" className="beheer-doen beheer-weg" disabled={bezig} onClick={() => void doe(() => verwijderPlant(plant))}>
              {bezig ? 'Bezig met verwijderen…' : 'Ja, definitief verwijderen'}
            </button>
            <button type="button" disabled={bezig} onClick={() => setBevestigen(false)}>Nee, bewaren</button>
          </div>
        </div>
      </>}
    </section>
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
