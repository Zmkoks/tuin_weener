'use client';

import Link from '@/app/components/NativeLink';
import { useBeheer } from './BeheerContext';
import { BovenaanBeginnen } from './onderdelen';

/**
 * Beheren begint bij wat iemand in de tuin tegenkwam, niet bij hoe wij de gegevens hebben
 * opgeslagen. Vandaar vijf vragen als ingang; elke vraag is een eigen adres.
 *
 * Verhuizen staat er sinds 9 september bij. Vanaf de plattegrond is dat een knop bij de plek
 * (`PlekBeheer.tsx`), maar het moet ook hier staan: wie via de kaart binnenkomt weet al
 * wélke plek het is, wie hier binnenkomt niet, en dan hoort de vraag gesteld te worden.
 */
const VRAGEN = [
  { naar: '/beheren/plaatsen', vraag: 'Ik heb een plant gevonden die niet op de plattegrond staat' },
  { naar: '/beheren/verplaatsen', vraag: 'Een plant staat ergens anders dan op de plattegrond' },
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
      <Link className="beheer-doen" href="/plattegrond">Bekijk de plattegrond</Link>
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
