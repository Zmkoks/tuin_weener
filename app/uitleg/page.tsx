import type { Metadata } from 'next';
import Link from 'next/link';
import Kopbalk from '@/app/components/Kopbalk';
import { Druppels } from '@/app/components/paspoortDelen';
import { uitlegPaginas } from '@/app/components/uitlegDelen';
import { icoonPad } from '@/app/data/iconen';

export const metadata: Metadata = {
  title: 'Zo lees je de tuin · Weener XL',
  description: 'Wat de druppels, de iconen en de jaarkalender bij een plant betekenen, en welke woorden we in de tuin gebruiken.',
};

/** De vijf kleuren van de jaarkalender, in de volgorde van het jaar. */
const KALENDERKLEUREN = ['grow', 'bloom', 'harvest', 'prune', 'rest'];

/** Drie functies die veel planten in deze tuin hebben; hier alleen als voorbeeld. */
const VOORBEELDFUNCTIES = ['fruit', 'bij', 'vogel'];

/**
 * Het portaal naar de uitleg.
 *
 * De drie uitlegpagina's zelf zijn bladzijden uit het boekje: een smalle kolom op een wit
 * vel, met `ScanKop`. Dit overzicht is dat níét — het is een ingang, net als de homepage,
 * en stond op een breed scherm als een smalle strook in een grijze zee met alleen een
 * menuknop erboven. Daarom staat hier de gewone `Kopbalk` met de navigatie en loopt de
 * opmaak over de volle breedte.
 */
export default function UitlegOverzicht() {
  return <main className="uitlegportaal">
    <Kopbalk actief="uitleg" />

    <section className="portaal-kop">
      <div>
        <p className="eyebrow">HOE LEES JE DIT?</p>
        <h1>Zo lees je de tuin.</h1>
        <p className="lead">Bij iedere plant staan druppels, iconen en een jaarkalender. Hier lees je wat ze betekenen. En de woorden die we bij het snoeien en oogsten gebruiken, kun je op een tekening aanwijzen.</p>
      </div>

      {/* Geen plaatje maar de tekens zelf, in dezelfde maat en kleur als op een
          plantenpagina: eerst zien wat er staat, dan pas waar je het naleest. Geen links —
          dat doen de kaarten hieronder, en twee wegen naar dezelfde pagina naast elkaar
          maken de keuze alleen maar groter. */}
      <aside className="portaal-proef">
        <p className="portaal-proef-kop">Dit staat bij iedere plant</p>
        <dl>
          <div>
            <dt><Druppels van={2} tot={3} /></dt>
            <dd>Hoe droog de grond mag worden voordat je water geeft.</dd>
          </div>
          <div>
            <dt className="portaal-proef-iconen" aria-hidden="true">
              {VOORBEELDFUNCTIES.map((icoon) => <img src={icoonPad(icoon)} alt="" key={icoon} />)}
            </dt>
            <dd>Waarom deze plant in de tuin staat: fruit, kruid, insecten, vogel, sier, boom of onkruid.</dd>
          </div>
          <div>
            <dt className="standplaats"><img src={icoonPad('zon')} alt="" /><em>Zon</em></dt>
            <dd>Hoeveel zon deze plek krijgt.</dd>
          </div>
          <div>
            <dt className="portaal-proef-kalender" aria-hidden="true">
              {KALENDERKLEUREN.map((kleur) => <i className={`kalendervak ${kleur}`} key={kleur} />)}
            </dt>
            <dd>Wat er per maand gebeurt: groei, bloei, oogst, snoei of rust.</dd>
          </div>
        </dl>
      </aside>
    </section>

    <section className="portaal-kaarten">
      <p className="number">DRIE ONDERWERPEN</p>
      <h2>Waar lees je wat?</h2>
      <nav className="portaal-rij" aria-label="Uitleg">
        {uitlegPaginas.map((pagina) => <Link className="portaal-kaart" href={pagina.pad} key={pagina.pad}>
          <span className="portaal-kaart-icoon"><img src={icoonPad(pagina.icoon)} alt="" /></span>
          <b>{pagina.titel}</b>
          <p>{pagina.tekst}</p>
          <ul>{pagina.inhoud.map((regel) => <li key={regel}>{regel}</li>)}</ul>
          <strong>Lees verder →</strong>
        </Link>)}
      </nav>
    </section>

    <section className="portaal-boekje">
      <div>
        <p className="eyebrow">OOK OP PAPIER</p>
        <h2>Dezelfde uitleg staat voorin het plantenboekje.</h2>
        <p>Wie liever bladert dan klikt, neemt het boekje mee de tuin in. De tekst is dezelfde; op het scherm staat er bij elk niveau en elk icoon ook welke planten van ons het betreft.</p>
      </div>
      <div className="pdf-list">
        <a href="/pdf/plantenboekje.pdf" download>
          <span>PDF</span>
          <div><b>Compleet plantenboekje</b><small>38 pagina’s · alle planten</small></div>
          <strong>Download ↓</strong>
        </a>
      </div>
    </section>

    <footer className="portaal-voet"><Link href="/">Bekijk de hele tuin</Link></footer>
  </main>;
}
