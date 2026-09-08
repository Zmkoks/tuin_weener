import type { Metadata } from 'next';
import Link from '@/app/components/NativeLink';
import ScanKop from '@/app/components/ScanKop';
import SpringNaarAnker from '@/app/components/SpringNaarAnker';
import { Druppels } from '@/app/components/paspoortDelen';
import { UitlegTerug, UitlegVoet } from '@/app/components/uitlegDelen';
import { hoofdletter, waterNiveaus } from '@/app/data/tuinTekst';
import { laadPlanten } from '@/app/lib/tuinData';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Water geven · tuin van Weener XL',
  description: 'De druppels bij een plant vertellen niet hoeveel water je geeft, maar hoe droog de grond mag worden voordat je water geeft.',
};

/** Dezelfde vijf niveaus als voorin het boekje (maak_plantenboekje.py). */
const NIVEAUS = [
  { niveau: 1, tekst: 'Alleen water geven bij lange, extreme droogte. Deze plant staat liever droog.' },
  { niveau: 2, tekst: 'Water geven wanneer de grond helemaal droog aanvoelt.' },
  { niveau: 3, tekst: 'Water geven wanneer de bovenste laag droog aanvoelt. Dieper mag de grond nog een beetje vochtig zijn.' },
  { niveau: 4, tekst: 'Water geven zodra de grond niet meer nat aanvoelt. Niet wachten tot de grond droog is.' },
  { niveau: 5, tekst: 'De grond altijd nat houden.' },
];

export default async function WaterPagina() {
  const planten = [...await laadPlanten()].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));

  // Een plant hoort bij elk niveau binnen zijn bereik: met 2-3 staat hij zowel bij 2 als bij 3.
  const bijNiveau = (niveau: number) => planten.filter((plant) => {
    const { laag, hoog } = waterNiveaus(plant);
    return laag > 0 && laag <= niveau && niveau <= hoog;
  });

  return <main className="scan uitleg">
    <ScanKop actief="uitleg" />
    <div className="scan-vel">
    <SpringNaarAnker />
    <UitlegTerug />

    <header className="uitleg-kop">
      <p className="eyebrow">HOE LEES JE DIT?</p>
      <h1>Water geven</h1>
      <p className="uitleg-inleiding">Bij iedere plant staan druppels. Die vertellen niet hoevéél water je moet geven. Ze vertellen hoe droog de grond mag worden voordat je water geeft.</p>
    </header>

    <p className="kernregel">Voel altijd eerst aan de grond, ongeveer twee tot drie centimeter diep. Is de grond nog te nat voor deze plant? Geef dan geen water — ook niet als je denkt dat het tijd is. Zo voorkom je dat een plant twee keer op een dag water krijgt.</p>

    <section className="uitleg-blok">
      <h2>De vijf niveaus</h2>
      <p>Klik op een plant om te zien hoe je hem verzorgt.</p>
      <dl className="niveaus">
        {NIVEAUS.map(({ niveau, tekst }) => {
          const hier = bijNiveau(niveau);
          return <div className={`niveau${hier.length === 0 ? ' niet-gebruikt' : ''}`} id={`niveau-${niveau}`} key={niveau}>
            <dt><Druppels van={niveau} /></dt>
            <dd>
              <p><b>Niveau {niveau}.</b> {tekst}</p>
              {hier.length > 0
                ? <p className="niveau-planten">{hier.map((plant, index) => <span key={plant.slug}>
                    {index > 0 && ', '}
                    <Link href={`/plant/${plant.slug}`}>{hoofdletter(plant.naam)}</Link>
                  </span>)}</p>
                : <p className="niveau-planten">Dit niveau komt in onze tuin niet voor.</p>}
            </dd>
          </div>;
        })}
      </dl>
    </section>

    <section className="uitleg-blok">
      <h2>Twee getallen: een bereik</h2>
      <div className="bereik">
        <div className="bereik-visual"><Druppels van={2} tot={3} /></div>
        <div>
          <p>De meeste planten hebben twee waardes. Dat betekent níét &ldquo;geef twee tot drie keer water&rdquo;. Het betekent:</p>
          <p><b>Het laagste getal</b> zegt hoe droog de plant kan staan. Bij deze plant: de grond mag helemaal droog worden (niveau 2), dan moet er uiterlijk water komen.</p>
          <p><b>Het hoogste getal</b> zegt hoe vroeg je veilig water mag geven. Bij deze plant: zodra de bovenste laag droog is (niveau 3) mag het al.</p>
          <p>Is de grond nog vochtiger dan het hoogste getal? Dan geef je niets.</p>
        </div>
      </div>
    </section>

    <section className="uitleg-blok">
      <h2>Meer planten in één bak</h2>
      <p>Staan er meerdere planten in één bak, zoek dan het niveau dat bij allebei past. Heeft plant A bereik 2&ndash;3 en plant B bereik 3&ndash;4, dan is niveau 3 het gezamenlijke moment: geef water wanneer de bovenste laag droog is. Hebben twee planten geen gezamenlijk niveau, dan staat dat bij die planten uitgelegd en geef je plaatselijk water.</p>
      <p>Op de <Link href="/plattegrond">plattegrond</Link> zie je welke planten bij elkaar in een bak staan.</p>
    </section>

    <UitlegVoet nu="/uitleg/water" />
    </div>
  </main>;
}
