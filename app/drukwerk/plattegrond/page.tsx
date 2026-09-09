import type { Metadata } from 'next';
import Link from '@/app/components/NativeLink';
import Kopbalk from '../../components/Kopbalk';
import Plattegrond from '../../components/Plattegrond';
import KaartIndex from '../../components/kaartIndex';
import PrintKnop from '../../components/PrintKnop';
import type { Plek } from '../../data/plekTypes';
import { laadBeplanting, laadPlanten, laadZones } from '../../lib/tuinData';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Plattegrond printen · tuin van Weener XL',
  description: 'Print of bewaar de actuele plattegrond van de tuin van Weener XL als PDF.',
};

export default async function PlattegrondPrintPagina() {
  const [plekken, planten, beplanting] = await Promise.all([laadZones(), laadPlanten(), laadBeplanting()]);
  const namen: Record<string, string[]> = Object.fromEntries(plekken.map((plek: Plek) => [
    plek.id,
    (beplanting[plek.id] || plek.planten)
      .map((slug) => planten.find((plant) => plant.slug === slug)?.naam)
      .filter((naam): naam is string => Boolean(naam)),
  ]));

  return <main className="drukwerk-plattegrond">
    <Kopbalk actief="drukwerk" />
    <section className="workspace print-workspace">
      <div className="print-bediening">
        <Link href="/drukwerk">← Terug naar drukwerk</Link>
        <PrintKnop />
      </div>
      <p className="eyebrow">LOSSE PLATTEGROND</p>
      <h1>Print de actuele plattegrond.</h1>
      <p className="lead">A4 staand. De planten en de legenda hieronder komen uit de actuele tuinadministratie.</p>
      <div className="print-vel">
        <Plattegrond
          zones={plekken}
          gekozen=""
          namen={namen}
          plants={planten}
          placements={beplanting}
          indexLaag={<KaartIndex plekken={plekken} namen={namen} />}
        />
      </div>
    </section>
  </main>;
}
