'use client';

import { useEffect, useState } from 'react';
import { laadSymboolbronnen } from './Plattegrond';

/**
 * Afdrukken kan pas als de kaart af is.
 *
 * De plantsymbolen worden na het laden van de pagina opgehaald; wie meteen op afdrukken
 * drukte, kreeg een plattegrond zonder planten op papier. Dat is bij de acceptatieproef van
 * 10 september 2026 echt gebeurd. `laadSymboolbronnen` bewaart zijn belofte, dus deze knop
 * en de kaart wachten op dezelfde ophaalactie en niet elk op een eigen.
 */
export default function PrintKnop() {
  const [klaar, setKlaar] = useState(false);

  useEffect(() => {
    let actief = true;
    void laadSymboolbronnen()
      // Ook wanneer het ophalen niet lukt de knop vrijgeven: de kaart tekent dan eenvoudige
      // vormen, en dat is nog altijd beter dan een knop die niets meer doet.
      .catch(() => null)
      .then(() => { if (actief) setKlaar(true); });
    return () => { actief = false; };
  }, []);

  return <button type="button" className="print-knop" disabled={!klaar} onClick={() => window.print()}>
    {klaar ? 'Afdrukken / PDF opslaan' : 'Kaart wordt getekend…'}
  </button>;
}
