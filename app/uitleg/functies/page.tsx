import type { Metadata } from 'next';
import Link from '@/app/components/NativeLink';
import { alleFuncties } from '@/app/data/functies';
import ScanKop from '@/app/components/ScanKop';
import SpringNaarAnker from '@/app/components/SpringNaarAnker';
import { UitlegTerug, UitlegVoet } from '@/app/components/uitlegDelen';
import { functieIcoon, icoonPad, standplaatsIcoon } from '@/app/data/iconen';
import { laadPlanten } from '@/app/lib/tuinData';
import { hoofdletter } from '@/app/data/tuinTekst';
import type { Plant } from '@/app/data/plantTypes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Functies, standplaats en kalender · tuin van Weener XL',
  description: 'Waarom een plant in deze tuin staat, hoeveel zon hij krijgt en wat de kleuren in de jaarkalender betekenen.',
};

/** Dezelfde legenda als voorin het boekje (maak_plantenboekje.py). */
const FUNCTIES = [
  { sleutel: 'fruit', naam: 'Fruit', tekst: 'Geeft eetbare vruchten of bessen.' },
  { sleutel: 'kruid', naam: 'Kruid', tekst: 'Blaadjes voor in de thee of het eten.' },
  { sleutel: 'insecten', naam: 'Insecten', tekst: 'De bloemen geven eten aan bijen, hommels en vlinders.' },
  { sleutel: 'vogel', naam: 'Vogel', tekst: 'Vogels eten de bessen of zaden, of schuilen in de plant.' },
  { sleutel: 'sier', naam: 'Sier', tekst: 'Staat er vooral omdat hij mooi is.' },
  { sleutel: 'boom', naam: 'Boom', tekst: 'Wordt groot en geeft schaduw en beschutting.' },
  { sleutel: 'onkruid', naam: 'Onkruid', tekst: 'Komt vanzelf op. Ook onkruid heeft een functie; daarom staat er altijd nog iets naast.' },
];

const STANDPLAATSEN = [
  { icoon: 'zon', naam: 'Zon', tekst: 'Staat het grootste deel van de dag in de volle zon.' },
  { icoon: 'halfschaduw', naam: 'Halfschaduw', tekst: 'Krijgt een paar uur zon per dag, of licht door bladeren heen.' },
  { icoon: 'schaduw', naam: 'Schaduw', tekst: 'Staat vrijwel de hele dag uit de zon.' },
];

const KALENDER = [
  { kleur: 'grow', icoon: 'groei', naam: 'Groei', tekst: 'De plant maakt nieuwe blaadjes en stengels.' },
  { kleur: 'bloom', icoon: 'bloei', naam: 'Bloei', tekst: 'De plant heeft bloemen.' },
  { kleur: 'harvest', icoon: 'oogst', naam: 'Oogst', tekst: 'In deze maanden kun je plukken of knippen om te gebruiken.' },
  { kleur: 'prune', icoon: 'snoei', naam: 'Snoei', tekst: 'In deze maanden mag deze plant gesnoeid worden.' },
  { kleur: 'rest', icoon: '', naam: 'Rust', tekst: 'De plant trekt zich terug. Hij is niet dood; hij komt in het voorjaar terug.' },
];

/** Rijtje aanklikbare plantennamen onder een legenda-item. */
function Plantenrij({ planten }: { planten: Plant[] }) {
  if (planten.length === 0) return <p className="legenda-planten leeg">Staat op dit moment niet in onze tuin.</p>;
  return <p className="legenda-planten">{planten.map((plant, index) => <span key={plant.slug}>
    {index > 0 && ', '}
    <Link href={`/plant/${plant.slug}`}>{hoofdletter(plant.naam)}</Link>
  </span>)}</p>;
}

export default async function FunctiesPagina() {
  const planten = [...await laadPlanten()].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));

  return <main className="scan uitleg">
    <ScanKop actief="uitleg" />
    <div className="scan-vel">
    <SpringNaarAnker />
    <UitlegTerug />

    <header className="uitleg-kop">
      <p className="eyebrow">HOE LEES JE DIT?</p>
      <h1>Functies, standplaats en kalender</h1>
      <p className="uitleg-inleiding">De iconen bij een plant vertellen waarom hij hier staat en wat hij nodig heeft. De kalender onderaan vertelt wanneer er iets gebeurt.</p>
    </header>

    <section className="uitleg-blok" id="functies">
      <h2>Functies</h2>
      <p>Bij iedere plant staat waarom hij in onze tuin staat. Sommige planten doen meer dan één ding: de belangrijkste functies staan voorop, de rest lees je verderop in de tekst.</p>
      <dl className="legenda">
        {FUNCTIES.map((functie) => <div className="legenda-item" id={`functie-${functie.sleutel}`} key={functie.sleutel}>
          <dt><img src={icoonPad(functieIcoon[functie.sleutel])} alt="" /></dt>
          <dd>
            <b>{functie.naam}</b>
            <p>{functie.tekst}</p>
            <Plantenrij planten={planten.filter((plant) => alleFuncties(plant).includes(functie.sleutel))} />
          </dd>
        </div>)}
      </dl>
    </section>

    <section className="uitleg-blok" id="standplaats">
      <h2>Standplaats</h2>
      <p>Hoeveel zon een plant op zijn plek krijgt.</p>
      <dl className="legenda">
        {STANDPLAATSEN.map((plek) => <div className="legenda-item" id={`standplaats-${plek.icoon}`} key={plek.icoon}>
          <dt><img src={icoonPad(plek.icoon)} alt="" /></dt>
          <dd>
            <b>{plek.naam}</b>
            <p>{plek.tekst}</p>
            <Plantenrij planten={planten.filter((plant) => plant.zon && standplaatsIcoon(plant.zon) === plek.icoon)} />
          </dd>
        </div>)}
      </dl>
    </section>

    <section className="uitleg-blok" id="kalender">
      <h2>De jaarkalender</h2>
      <p>Onderaan iedere plantenpagina staat een kalender. Een gekleurd vakje betekent: in deze maand gebeurt dit.</p>
      <dl className="kalenderlegenda">
        {KALENDER.map((rij) => <div className="kalenderregel" id={`kalender-${rij.kleur}`} key={rij.kleur}>
          <dt><span className={`kalendervak ${rij.kleur}`} aria-hidden="true" />
            {rij.icoon && <img className="kalender-icoon" src={icoonPad(rij.icoon)} alt="" />}
            {rij.naam}</dt>
          <dd>{rij.tekst}</dd>
        </div>)}
      </dl>
      <p className="kernregel">Het snoeimoment verschilt per plant. Algemene regels zoals &ldquo;snoeien als de r in de maand zit&rdquo; kloppen daarom lang niet altijd — kijk altijd naar de kalender van de plant zelf. Hóé je snoeit, staat op de pagina van die plant. En de woorden die daarbij horen, staan bij de <Link href="/uitleg/vaktermen">tuinwoorden</Link>.</p>
    </section>

    <UitlegVoet nu="/uitleg/functies" />
    </div>
  </main>;
}
