'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { Vakterm, Vaktermgroep, Vaktermstuk } from '../data/vaktermen';
import { springNaar } from '../lib/springNaar';

/** Een liggende tekening, zoals de uitloper, krijgt de hele breedte. */
const isBreed = (stuk: Vaktermstuk) => stuk.breedte > 1.6 * stuk.hoogte;

/**
 * Twee tekeningen naast elkaar in één kaartje, zoals jonge en oude tak. Te herkennen aan de
 * labels: die staan dan op dezelfde hoogte. Bij scheut en oksel staan ze onder elkaar; dat is
 * één tekening met twee woorden. Op een telefoon krijgt een paar de hele breedte, anders wordt
 * elke tak maar een centimeter of twee breed.
 */
const isPaar = (stuk: Vaktermstuk) => {
  const hoogtes = stuk.termen.flatMap((term) => (term.plek ? [term.plek.y] : []));
  return hoogtes.some((hoogte, plaats) => hoogtes.some((ander, anderePlaats) => anderePlaats > plaats && Math.abs(hoogte - ander) < 2));
};

/**
 * Een groep tuinwoorden met losse tekeningen: de knop, het oog, de uitloper, jong en oud hout.
 *
 * In het boekje staan die samen op één A4, maar alleen omdat ze daar pasten. Hier krijgt elke
 * tekening een eigen kaartje, met eronder alleen de woorden die erbij horen. Inzoomen zoals in
 * Vaktermenkaart is dan niet nodig: elk kaartje ís al de uitsnede. Welk woord bij welke
 * tekening hoort, rekent maak_uitleg_web.py uit.
 */
export default function Vaktermstukken({ groep }: { groep: Extract<Vaktermgroep, { soort: 'los' }> }) {
  const [gekozen, setGekozen] = useState<string | null>(null);

  // Een link als /uitleg/vaktermen#term-uitloper opent het woord en brengt zijn kaartje in beeld.
  useEffect(() => {
    const uitAdres = () => {
      if (!window.location.hash.startsWith('#term-')) return;
      const slug = decodeURIComponent(window.location.hash.slice('#term-'.length));
      const hier = groep.termen.some((term) => term.slug === slug);
      setGekozen(hier ? slug : null);
      if (hier) springNaar(document.getElementById(`term-${slug}`));
    };
    uitAdres();
    window.addEventListener('hashchange', uitAdres);
    return () => window.removeEventListener('hashchange', uitAdres);
  }, [groep]);

  const kies = (slug: string) => setGekozen((vorige) => (vorige === slug ? null : slug));

  // Een woord dat bij geen enkele tekening hoort, verdwijnt niet: dat komt onderaan in een lijst.
  const inStuk = new Set(groep.stukken.flatMap((stuk) => stuk.termen.map((term) => term.slug)));
  const overig = groep.termen.filter((term) => !inStuk.has(term.slug));

  // Drie naast elkaar, behalve waar dat één kaartje alleen op een rij laat: vier tekeningen
  // worden twee bij twee. Op een telefoon zijn het er altijd twee; zie .vakterm-stukken.
  const staand = groep.stukken.filter((stuk) => !isBreed(stuk)).length;
  const kolommen = staand % 3 === 1 ? 2 : 3;

  // `metAnker`: alleen een woord zonder kaartje draagt zelf het id; zie .vakterm-anker.
  const woord = (term: Vakterm, metAnker = false) => <div
    className={`vakterm${gekozen === term.slug ? ' aan' : ''}`}
    id={metAnker ? `term-${term.slug}` : undefined}
    key={term.slug}
  >
    <dt>
      <button type="button" aria-pressed={gekozen === term.slug} onClick={() => kies(term.slug)}>{term.term}</button>
    </dt>
    <dd>{term.uitleg}</dd>
  </div>;

  return <section className="vakterm-groep" id={groep.id}>
    <h2>{groep.titel}</h2>
    <p className="uitleg-inleiding">{groep.inleiding}</p>

    <div className="vakterm-stukken" style={{ '--kolommen': kolommen } as CSSProperties}>
      {groep.stukken.map((stuk) => <figure
        className={`vakterm-stuk${isBreed(stuk) ? ' breed' : isPaar(stuk) ? ' paar' : ''}`}
        key={stuk.illustratie}
      >
        {/* Het adres #term-… wijst naar de bovenkant van het kaartje en niet naar de regel:
            bij het woord hoort de tekening. Het id kan niet op het kaartje zelf, want daar
            horen soms drie woorden bij. Het moet ook hier staan en niet alleen in springNaar,
            want vinext scrollt bij het laden zelf zacht naar het element met dat id. Mikken
            die twee op verschillende plekken, dan wint vinext en schiet de pagina voorbij. */}
        {stuk.termen.map((term) => <span className="vakterm-anker" id={`term-${term.slug}`} key={term.slug} />)}
        {/* De verhouding gaat als variabele mee; de CSS rekent er per schermbreedte een
            hoogtegrens mee uit (zie .vakterm-stuk in uitleg.css). Liggend: geen grens. */}
        <div className="vakterm-vlak" style={{
          aspectRatio: `${stuk.breedte} / ${stuk.hoogte}`,
          '--verhouding': isBreed(stuk) ? undefined : (stuk.breedte / stuk.hoogte).toFixed(4),
        } as CSSProperties}>
          <img
            src={stuk.illustratie}
            width={stuk.breedte}
            height={stuk.hoogte}
            alt={`Tekening uit het plantenboekje: ${stuk.termen.map((term) => term.term.toLowerCase()).join(', ')}.`}
          />
          {stuk.termen.filter((term) => term.plek).map((term) => <button
            type="button"
            key={term.slug}
            className={`vakterm-plek${gekozen === term.slug ? ' aan' : ''}`}
            style={{ left: `${term.plek!.x}%`, top: `${term.plek!.y}%`, width: `${term.plek!.b}%`, height: `${term.plek!.h}%` }}
            aria-pressed={gekozen === term.slug}
            onClick={() => kies(term.slug)}
          >
            <span className="alleen-voorlezen">{term.term}</span>
          </button>)}
        </div>
        <dl className="vakterm-lijst">{stuk.termen.map((term) => woord(term))}</dl>
      </figure>)}
    </div>

    {overig.length > 0 && <dl className="vakterm-lijst">{overig.map((term) => woord(term, true))}</dl>}
  </section>;
}
