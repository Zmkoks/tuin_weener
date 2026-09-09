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
export default function PlekBeheer({ plekId, aantalPlanten }: { plekId: string; aantalPlanten: number }) {
  const [ingelogd, setIngelogd] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((antwoord) => antwoord.json() as Promise<{ ingelogd: boolean }>)
      .then((gegevens) => setIngelogd(gegevens.ingelogd))
      .catch(() => setIngelogd(false));
  }, []);

  if (!ingelogd) return null;
  const id = encodeURIComponent(plekId);

  return <details className="plek-beheer">
    <summary>Aanpassen</summary>
    <Link href={`/beheren/toevoegen/${id}`}>Plant toevoegen</Link>
    {/* Verplaatsen en weghalen hebben een plant nodig om mee te beginnen. Op een lege plek
        zouden ze naar een scherm leiden dat "hier staat niets" zegt. */}
    {aantalPlanten > 0 && <Link href={`/beheren/verplaatsen/${id}`}>Plant verplaatsen</Link>}
    {aantalPlanten > 0 && <Link href={`/beheren/weghalen/${id}`}>Plant weghalen</Link>}
  </details>;
}
