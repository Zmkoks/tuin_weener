import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Kopbalk from '@/app/components/Kopbalk';
import { laadBeplanting, laadPlanten, laadZones } from '@/app/lib/tuinData';
import { BeheerProvider } from './BeheerContext';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Beheren · tuin van Weener XL',
  description: 'Pas aan wat er in de tuin is veranderd.',
};

/**
 * Elke stap van het beheren is een eigen adres, en dit is wat ze delen: de balk, het
 * werkblad en de gegevens van de tuin. Die worden hier één keer op de server geladen en
 * blijven staan terwijl je van stap naar stap loopt — een layout wordt bij het navigeren
 * binnen /beheren niet opnieuw opgebouwd.
 *
 * Beheren heeft daarmee nog steeds geen tabblad op de homepage nodig: het scherm staat er
 * meteen, met de planten, plekken en beplanting erbij in plaats van erna.
 */
export default async function BeheerLayout({ children }: { children: ReactNode }) {
  const [planten, plekken, beplanting] = await Promise.all([laadPlanten(), laadZones(), laadBeplanting()]);
  return <main>
    <Kopbalk actief="beheren" />
    <section className="workspace">
      <BeheerProvider planten={planten} plekken={plekken} beplanting={beplanting}>
        {children}
      </BeheerProvider>
    </section>
  </main>;
}
