import type { Metadata } from 'next';
import Home from './Home';
import { laadBeplanting, laadPlanten, laadZones } from './lib/tuinData';

/**
 * De homepage haalt zijn gegevens hier op, op de server, en geeft ze door aan `Home`.
 *
 * `force-dynamic`: de tuin verandert zodra iemand via Beheren iets aanpast, dus deze pagina
 * mag niet als vaste versie blijven staan. Dezelfde keuze als bij /beheren en de printpagina.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'De tuin van Weener XL',
  description: 'Zoek een plant op, lees hoe je hem verzorgt en zie wat er deze maand te doen is.',
};

export default async function Pagina() {
  const [planten, plekken, beplanting] = await Promise.all([laadPlanten(), laadZones(), laadBeplanting()]);
  return <Home planten={planten} plekkenVanaf={plekken} beplanting={beplanting} />;
}
