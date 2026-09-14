import type { Metadata } from 'next';
import ScanKop from '@/app/components/ScanKop';
import SpringNaarAnker from '@/app/components/SpringNaarAnker';
import Vaktermenkaart from '@/app/components/Vaktermenkaart';
import Vaktermstukken from '@/app/components/Vaktermstukken';
import { UitlegTerug, UitlegVoet } from '@/app/components/uitlegDelen';
import { vaktermgroepen } from '@/app/data/vaktermen';

export const metadata: Metadata = {
  title: 'Tuinwoorden · tuin van Weener XL',
  description: 'Van basis tot uitloper: de woorden die we in de tuin gebruiken, aangewezen op de tekeningen uit het plantenboekje.',
};

export default function VaktermenPagina() {
  const alleWoorden = vaktermgroepen
    .flatMap((groep) => groep.termen)
    .sort((links, rechts) => links.term.localeCompare(rechts.term, 'nl'));

  return <main className="scan uitleg uitleg-breed">
    <ScanKop actief="uitleg" />
    <div className="scan-vel">
    <SpringNaarAnker />
    <UitlegTerug />

    <header className="uitleg-kop">
      <p className="eyebrow">HOE LEES JE DIT?</p>
      <h1>Tuinwoorden</h1>
      <p className="uitleg-inleiding">Op de plantenpagina’s staan woorden die je in de tuin gebruikt. Op de tekeningen hieronder zie je precies waar je ze op de plant terugvindt.</p>
    </header>

    {/* Gewone ankers en geen <Link>: die laatste springt via de router en dan krijgt de
        tekening geen hashchange, waardoor het woord niet oplicht. */}
    <nav className="woordenwolk" aria-label="Alle woorden">
      {alleWoorden.map((term) => <a href={`#term-${term.slug}`} key={term.slug}>{term.term}</a>)}
    </nav>

    {/* De hele plant is één tekening om op in te zoomen; de losse tekeningen van pagina 2 en
        3 krijgen elk een eigen kaartje. */}
    {vaktermgroepen.map((groep) => groep.soort === 'los'
      ? <Vaktermstukken groep={groep} key={groep.id} />
      : <Vaktermenkaart groep={groep} key={groep.id} />)}

    <UitlegVoet nu="/uitleg/vaktermen" />
    </div>
  </main>;
}
