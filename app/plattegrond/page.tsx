import type { Metadata } from 'next';
import Scherm from './Scherm';
import { laadBeplanting, laadPlanten, laadZones } from '@/app/lib/tuinData';

/**
 * De kaartpagina laadde zijn gegevens eerst na het openen op met drie aanvragen, en tekende
 * ondertussen een lege tuin. Nu komt de tuin met de pagina mee en staat hij er in één keer.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Plattegrond · tuin van Weener XL',
  description: 'Bekijk waar elke plant in de tuin van Weener XL staat.',
};

export default async function Pagina() {
  const [plekken, plants, placements] = await Promise.all([laadZones(), laadPlanten(), laadBeplanting()]);
  return <Scherm plekken={plekken} plants={plants} placements={placements} />;
}
