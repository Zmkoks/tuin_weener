'use client';

import { useEffect, useRef, useState } from 'react';
import type { Vaktermgroep } from '../data/vaktermen';
import { springNaar } from '../lib/springNaar';

/**
 * Eén groep tuinwoorden: de illustratie uit het boekje met over elk label een
 * onzichtbaar knopje, en daarnaast dezelfde woorden met hun uitleg. Klik je op de
 * tekening, dan licht het woord in de lijst op; klik je op een woord, dan licht het
 * label op de tekening op. Waar het label staat, komt uit maak_uitleg_web.py.
 */
export default function Vaktermenkaart({ groep }: { groep: Vaktermgroep }) {
  const [gekozen, setGekozen] = useState<string | null>(null);
  const tekening = useRef<HTMLElement>(null);

  // Een link als /uitleg/vaktermen#term-uitloper opent meteen het juiste woord.
  useEffect(() => {
    const uitAdres = () => {
      if (!window.location.hash.startsWith('#term-')) return;
      const slug = decodeURIComponent(window.location.hash.slice('#term-'.length));
      // Wijst het adres een woord uit een andere groep aan, dan laat deze tekening los,
      // zodat er nooit twee woorden tegelijk oplichten.
      const hier = groep.termen.find((term) => term.slug === slug);
      setGekozen(hier ? slug : null);

      // Wie via een woord op een plantenpagina binnenkomt, wil de plánt zien, niet een
      // regel in een lijst. Staat het woord op de tekening, dan brengen we de tekening in
      // beeld — met het plekje al opgelicht en de uitleg eronder. Staat het er niet op
      // (Stengel, Tak, Pol, Wortelblok), dan is de lijst wél de juiste plek.
      //
      // Al het springen voor `#term-…` gebeurt hier; SpringNaarAnker laat die ankers met
      // rust, zodat er niet twee stukken code om dezelfde scrollpositie vechten.
      if (!hier) return;
      const regel = document.getElementById(`term-${slug}`);
      // Op een breed scherm staat de tekening `sticky` naast de lijst en blijft hij dus
      // vanzelf in beeld; daar is de regel in de lijst het betere doel. Op een smal scherm
      // staat de lijst ónder de tekening, en dan moet de tekening in beeld komen.
      const plakt = tekening.current && getComputedStyle(tekening.current).position === 'sticky';
      springNaar(hier.plek && !plakt ? tekening.current : regel);
    };
    uitAdres();
    window.addEventListener('hashchange', uitAdres);
    return () => window.removeEventListener('hashchange', uitAdres);
  }, [groep]);

  // Geen sprong naar de lijst meer: de uitleg staat nu onder de tekening, dus wegscrollen
  // van het plekje dat je net hebt aangetikt zou je juist het antwoord afpakken.
  const kiesOpTekening = (slug: string) => setGekozen((vorige) => (vorige === slug ? null : slug));

  const kiesInLijst = (slug: string, heeftPlek: boolean) => {
    setGekozen((vorige) => (vorige === slug ? null : slug));
    if (heeftPlek) tekening.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const opTekening = groep.termen.filter((term) => term.plek);
  const gekozenTerm = groep.termen.find((term) => term.slug === gekozen);

  return <section className="vakterm-groep" id={groep.id}>
    <h2>{groep.titel}</h2>
    <p className="uitleg-inleiding">{groep.inleiding}</p>

    <div className="vakterm-lay">
      <figure className="vakterm-tekening" ref={tekening}>
        <div className="vakterm-vlak" style={{ aspectRatio: `${groep.breedte} / ${groep.hoogte}` }}>
          <img
            src={groep.illustratie}
            width={groep.breedte}
            height={groep.hoogte}
            alt={`Tekening uit het plantenboekje met de woorden ${opTekening.map((term) => term.term.toLowerCase()).join(', ')}.`}
          />
          {opTekening.map((term) => <button
            type="button"
            key={term.slug}
            className={`vakterm-plek${gekozen === term.slug ? ' aan' : ''}`}
            style={{ left: `${term.plek!.x}%`, top: `${term.plek!.y}%`, width: `${term.plek!.b}%`, height: `${term.plek!.h}%` }}
            aria-pressed={gekozen === term.slug}
            onClick={() => kiesOpTekening(term.slug)}
          >
            <span className="alleen-voorlezen">{term.term}</span>
          </button>)}
        </div>
        {/* Het bijschrift is de uitleg van wat je nu aanwijst. Zo staan tekening en tekst
            bij elkaar: op een telefoon is de lijst eronder anders buiten beeld, en dan
            kijk je naar een opgelicht plekje zonder te lezen wat het betekent. */}
        {gekozenTerm
          ? <figcaption className="vakterm-nu" aria-live="polite">
              <b>{gekozenTerm.term}</b>
              <span>{gekozenTerm.uitleg}</span>
            </figcaption>
          : <figcaption>Klik op een woord in de tekening.</figcaption>}
      </figure>

      <dl className="vakterm-lijst">
        {groep.termen.map((term) => <div
          className={`vakterm${gekozen === term.slug ? ' aan' : ''}`}
          id={`term-${term.slug}`}
          key={term.slug}
        >
          <dt>
            <button type="button" aria-pressed={gekozen === term.slug} onClick={() => kiesInLijst(term.slug, Boolean(term.plek))}>
              {term.term}
              {!term.plek && <em> · niet op de tekening</em>}
            </button>
          </dt>
          <dd>{term.uitleg}</dd>
        </div>)}
      </dl>
    </div>
  </section>;
}
