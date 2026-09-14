'use client';

import Link from '@/app/components/NativeLink';
import { useBeheer } from './BeheerContext';
import { BovenaanBeginnen } from './onderdelen';

/**
 * Het beginscherm van Beheren: twee groepen, en per groep de handelingen die je kunt doen.
 *
 * Hiervoor stonden hier vijf vragen in de vorm "wat kom je tegen": *ik heb een plant gevonden
 * die niet op de plattegrond staat*, *er staat een plant niet meer op zijn plek*. Het idee was
 * om aan te sluiten bij wat iemand in de tuin ziet, maar het werkte averechts. De eerste twee
 * beschreven dezelfde situatie, de derde liet in het midden of het nú zo is of zo wórdt, en
 * geen van de vijf zei wat er zou gebeuren als je erop klikte.
 *
 * Nu staat er wat je gaat doen, in twee groepen die het verschil dragen dat er echt toe doet:
 * verandert er iets aan de **kaart** (waar staat wat), of aan de **plant** zelf (welke soort,
 * welke informatie). Zonder die groepen zouden "een plant toevoegen op een plek" en "een plant
 * toevoegen" bijna hetzelfde lezen, terwijl het twee heel verschillende handelingen zijn.
 *
 * Een plek toevoegen hoort in de eerste groep thuis, naast de handelingen voor planten die
 * al op de kaart staan.
 */
const GROEPEN = [
  {
    kop: 'Plattegrond aanpassen',
    uitleg: 'Verandert er iets aan wat er wáár in de tuin staat.',
    keuzes: [
      { naar: '/beheren/plaatsen', titel: 'Een plant toevoegen op een plek', uitleg: 'Zet een plant die al in de bibliotheek staat op een plek in de tuin.' },
      { naar: '/beheren/verplaatsen', titel: 'Een plant verplaatsen', uitleg: 'De plant staat ergens anders dan op de plattegrond.' },
      { naar: '/beheren/weghalen', titel: 'Een plant verwijderen van een plek', uitleg: 'De plant staat er niet meer. Hij blijft wel in de bibliotheek staan.' },
      { naar: '/beheren/plekken/nieuw', titel: 'Een plek toevoegen', uitleg: 'Maak een nieuwe plek op de plattegrond.' },
      { naar: '/beheren/plekken/aanpassen', titel: 'Plek verplaatsen of vergroten/verkleinen', uitleg: 'Pas de plaats of grootte van een plantenbak of vrije plek aan.' },
    ],
  },
  {
    kop: 'Planten aanpassen',
    uitleg: 'Verandert er iets aan de plant zelf, en niet aan de kaart.',
    keuzes: [
      { naar: '/beheren/nieuw', titel: 'Een plant toevoegen', uitleg: 'Een soort die nog niet in de bibliotheek staat.' },
      { naar: '/beheren/aanpassen', titel: 'Een plant aanpassen', uitleg: 'Er klopt iets niet in de tekst, de foto of het symbool.' },
    ],
  },
];

export default function Beginscherm() {
  const { melding } = useBeheer();

  return <div className="beheer">
    <BovenaanBeginnen />

    {/* Wat er zojuist is opgeslagen. Geen eigen adres: bij herladen hoort hier geen
        vinkje te staan bij iets dat niet gebeurd is. */}
    {melding && <div className="beheer-klaar" role="status">
      <span aria-hidden="true">✓</span>
      <h2>{melding.titel}</h2>
      <p>{melding.tekst}</p>
      <Link className="beheer-doen" href="/plattegrond">Bekijk de plattegrond</Link>
    </div>}

    <p className="eyebrow">BEHEREN</p>
    <h1>Wat wil je doen?</h1>

    {GROEPEN.map((groep) => <section className="beheer-groep" key={groep.kop}>
      <h2>{groep.kop}</h2>
      <p className="beheer-groep-uitleg">{groep.uitleg}</p>
      <div className="beheer-vragen">
        {groep.keuzes.map((keuze) => <Link className="beheer-vraag" key={keuze.naar} href={keuze.naar}>
          <span>
            <b>{keuze.titel}</b>
            <small>{keuze.uitleg}</small>
          </span>
          <strong aria-hidden="true">→</strong>
        </Link>)}
      </div>
    </section>)}
  </div>;
}
