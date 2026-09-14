import Link from '@/app/components/NativeLink';
import { icoonPad } from '../data/iconen';
import { vaktermgroepen } from '../data/vaktermen';

/* De tuinwoorden worden door maak_uitleg_web.py gegenereerd; tel ze dus, schrijf het aantal
   niet op. Komt er een woord bij, dan klopt de kaart op /uitleg vanzelf nog. */
const aantalWoorden = vaktermgroepen.reduce((som, groep) => som + groep.termen.length, 0);
const aantalTekeningen = vaktermgroepen.reduce((som, groep) => som + (groep.soort === 'los' ? groep.stukken.length : 1), 0);

/**
 * De drie uitlegpagina's, in de volgorde van het boekje: water, functies, woorden.
 *
 * `inhoud` is wat er op die pagina staat. Alleen het portaal (/uitleg) toont dat; in de rij
 * "Verder lezen" onderaan een uitlegpagina zou het de voet groter maken dan de tekst erboven.
 */
export const uitlegPaginas = [
  {
    pad: '/uitleg/water',
    icoon: 'drop',
    titel: 'Water geven',
    tekst: 'Wat de druppels bij een plant betekenen, en wanneer je wel en niet water geeft.',
    inhoud: ['De vijf niveaus, met de planten die eronder vallen', 'Wat twee getallen samen betekenen', 'Meer planten in één bak'],
  },
  {
    pad: '/uitleg/functies',
    icoon: 'bij',
    titel: 'Functies, standplaats en kalender',
    tekst: 'Waarom een plant hier staat, hoeveel zon hij krijgt en wat de kleuren in de jaarkalender betekenen.',
    inhoud: ['De zeven functie-iconen', 'Zon, halfschaduw of schaduw', 'De vijf kleuren van de jaarkalender'],
  },
  {
    pad: '/uitleg/vaktermen',
    icoon: 'boom',
    titel: 'Tuinwoorden',
    tekst: 'Van basis tot uitloper: welk woord hoort bij welk deel van de plant. Met tekeningen om aan te wijzen.',
    inhoud: [`${aantalWoorden} woorden op ${aantalTekeningen} tekeningen`, 'Aanwijzen waar een woord op de plant zit', 'Dezelfde woorden als in de snoeitekst'],
  },
];

/** Kaarten naar de uitlegpagina's. `behalve` laat de pagina weg waar je al bent. */
export function UitlegKaarten({ behalve }: { behalve?: string }) {
  return <nav className="uitleg-kaarten" aria-label="Uitleg">
    {uitlegPaginas.filter((pagina) => pagina.pad !== behalve).map((pagina) => <Link className="uitleg-kaart" href={pagina.pad} key={pagina.pad}>
      <img src={icoonPad(pagina.icoon)} alt="" />
      <span>
        <b>{pagina.titel}</b>
        <small>{pagina.tekst}</small>
      </span>
      <strong aria-hidden="true">→</strong>
    </Link>)}
  </nav>;
}

/** Terug naar het overzicht, boven aan elke losse uitlegpagina. */
export function UitlegTerug() {
  return <Link className="uitleg-terug" href="/uitleg">← Alle uitleg</Link>;
}

/** Sluit een uitlegpagina af: verder lezen, of terug naar de tuin. */
export function UitlegVoet({ nu }: { nu: string }) {
  return <>
    <h2 className="uitleg-verder">Verder lezen</h2>
    <UitlegKaarten behalve={nu} />
    <footer className="scan-voet"><Link href="/">Bekijk de hele tuin</Link></footer>
  </>;
}
