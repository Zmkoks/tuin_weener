'use client';

import Link from 'next/link';
import { useBeheer } from './BeheerContext';
import { BovenaanBeginnen } from './onderdelen';

/**
 * Beheren begint bij wat iemand in de tuin tegenkwam, niet bij hoe wij de gegevens hebben
 * opgeslagen. Vandaar vier vragen als ingang; elke vraag is een eigen adres.
 */
const VRAGEN = [
  { naar: '/beheren/plaatsen', vraag: 'Ik heb een plant gevonden die niet op de plattegrond staat' },
  { naar: '/beheren/weghalen', vraag: 'Er staat een plant niet meer op zijn plek' },
  { naar: '/beheren/aanpassen', vraag: 'Er klopt iets niet in de informatie over een plant' },
  { naar: '/beheren/nieuw', vraag: 'Ik wil een plant toevoegen die nog niet in de tuin staat' },
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
      {/* Bewust een gewoon anker en geen <Link>: de tabbladen van de homepage zijn een
          `#`-stukje, en bij een <Link> navigeert de router zonder `hashchange`, waardoor
          de homepage op het verkeerde tabblad blijft staan. Zie Kopbalk.tsx. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a className="beheer-doen" href="/plattegrond">Bekijk de plattegrond</a>
    </div>}

    <p className="eyebrow">BEHEREN</p>
    <h1>Wat kom je tegen?</h1>
    <div className="beheer-vragen">
      {VRAGEN.map((vraag) => <Link className="beheer-vraag" key={vraag.naar} href={vraag.naar}>
        <b>{vraag.vraag}</b>
        <strong aria-hidden="true">→</strong>
      </Link>)}
    </div>
  </div>;
}
