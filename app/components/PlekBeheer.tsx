'use client';

import Link from '@/app/components/NativeLink';
import { useEffect, useState } from 'react';

/**
 * De ingang naar het beheren, vanaf de plek die je net op de plattegrond hebt aangeklikt.
 *
 * Alle drie de handelingen bestonden al in /beheren; wat ontbrak was de weg ernaartoe. Wie
 * op de kaart ziet dat er iets niet klopt, moest terug naar het begin en de plek daar
 * opnieuw aanwijzen. Nu is de plek al bekend en slaat elke link die stap over.
 *
 * `/plattegrond` is een openbare pagina, dus dit verschijnt alleen na inloggen - net als
 * "Deze plant aanpassen" op de plantenpagina (`Beheerknop.tsx`). Het is geen beveiliging:
 * die zit op de API (`geldigeSessie`). Het voorkomt alleen dat een bezoeker knoppen ziet
 * waar hij niets mee kan.
 */
export default function PlekBeheer({ plekId, aantalPlanten, isBak }: { plekId: string; aantalPlanten: number; isBak: boolean }) {
  const [ingelogd, setIngelogd] = useState(false);
  const [bevestigen, setBevestigen] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');

  useEffect(() => {
    fetch('/api/auth/status')
      .then((antwoord) => antwoord.json() as Promise<{ ingelogd: boolean }>)
      .then((gegevens) => setIngelogd(gegevens.ingelogd))
      .catch(() => setIngelogd(false));
  }, []);

  if (!ingelogd) return null;
  const id = encodeURIComponent(plekId);

  const verwijder = async () => {
    setBezig(true);
    setFout('');
    try {
      const antwoord = await fetch('/api/plekken', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: plekId }),
      });
      if (!antwoord.ok) {
        const gegevens = await antwoord.json().catch(() => ({})) as { error?: string };
        throw new Error(gegevens.error || 'Verwijderen is niet gelukt.');
      }
      window.location.reload();
    } catch (probleem) {
      setFout(probleem instanceof Error ? probleem.message : 'Verwijderen is niet gelukt.');
      setBezig(false);
    }
  };

  return <details className="plek-beheer">
    <summary>Aanpassen</summary>
    <Link href={`/beheren/toevoegen/${id}`}>Plant toevoegen</Link>
    {/* Verplaatsen en weghalen hebben een plant nodig om mee te beginnen. Op een lege plek
        zouden ze naar een scherm leiden dat "hier staat niets" zegt. */}
    {aantalPlanten > 0 && <Link href={`/beheren/verplaatsen/${id}`}>Plant verplaatsen</Link>}
    {aantalPlanten > 0 && <Link href={`/beheren/weghalen/${id}`}>Plant weghalen</Link>}
    {isBak && <div className="plek-verwijderen">
      {!bevestigen
        ? <button type="button" className="plek-verwijder-link" onClick={() => { setBevestigen(true); setFout(''); }}>
          Plantenbak verwijderen
        </button>
        : <div className="plek-verwijder-bevestiging">
          <p>{aantalPlanten > 0 ? 'Haal eerst alle planten uit deze bak.' : 'Weet je zeker dat je deze plantenbak wilt verwijderen?'}</p>
          {fout && <p className="plek-verwijder-fout" role="alert">{fout}</p>}
          <div className="plek-verwijder-knoppen">
            {aantalPlanten === 0 && <button type="button" className="plek-verwijder-bevestig" disabled={bezig} onClick={() => void verwijder()}>
              {bezig ? 'Bezig…' : 'Ja, verwijderen'}
            </button>}
            <button type="button" className="plek-verwijder-annuleer" onClick={() => setBevestigen(false)}>Annuleren</button>
          </div>
        </div>}
    </div>}
  </details>;
}
