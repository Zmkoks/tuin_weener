import type { Metadata } from 'next';
import Link from '@/app/components/NativeLink';
import Kopbalk from '../../components/Kopbalk';
import BoekPlantPagina from '../../components/boekje/BoekPlantPagina';
import BoekjeVellen from '../../components/boekje/BoekjeVellen';
import { maakVoorwerk } from '../../components/boekje/BoekVoorwerk';
import { maakBoekjeInhoud } from '../../lib/boekjeInhoud';
import { laadBeplanting, laadPlanten, laadZones } from '../../lib/tuinData';
import '../../boekje.css';
import '../../boekjeVoorwerk.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Plantenboekje printen · tuin van Weener XL',
  description: 'Print het actuele plantenboekje van de tuin van Weener XL.',
};

/**
 * Het plantenboekje uit de actuele tuinadministratie.
 *
 * Voorwerk en planten delen één paginaplan. Het omslag volgt afzonderlijk.
 *
 * Alleen planten die ergens in de tuin staan: het boekje beschrijft deze tuin, niet de hele
 * bibliotheek. Alfabetisch, net als in het vorige boekje.
 */
export default async function BoekjePagina() {
  const [plekken, planten, beplanting] = await Promise.all([laadZones(), laadPlanten(), laadBeplanting()]);
  const plan = maakBoekjeInhoud(planten, plekken, beplanting);
  const jaar = new Date().getFullYear();
  const paginas = [...maakVoorwerk({ plan, plekken, planten, beplanting, jaar }),
    ...plan.planten.map((plant) => <BoekPlantPagina plant={plant} nummer={plan.paginaVan[plant.slug]} jaar={jaar} key={plant.slug} />)];

  return <main className="katernproef boekje-drukwerk">
    <Kopbalk actief="drukwerk" />
    <section className="workspace">
      <div className="proef-bediening-terug"><Link href="/drukwerk">← Terug naar drukwerk</Link></div>
      <p className="eyebrow">PLANTENBOEKJE</p>
      <h1>Print het actuele boekje.</h1>
      <p className="lead proef-uitleg">
        Het omslag print je enkelzijdig, bij voorkeur op dikker papier. Het binnenwerk print je
        dubbelzijdig en vouw je in het omslag. Beide op A4 liggend.
      </p>
      <BoekjeVellen paginas={paginas} />
    </section>
  </main>;
}
