'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Vaktermgroep } from '../data/vaktermen';
import { springNaar } from '../lib/springNaar';

/**
 * Eén groep tuinwoorden: de illustratie uit het boekje met over elk label een
 * onzichtbaar knopje, en daarnaast dezelfde woorden met hun uitleg. Klik je op de
 * tekening, dan licht het woord in de lijst op; klik je op een woord, dan licht het
 * label op de tekening op. Waar het label staat, komt uit maak_uitleg_web.py.
 */
/**
 * Hoe ver er wordt ingezoomd, bij een woord en bij dubbelklikken. Eén vaste maat: de tekening
 * is sinds 11 september één doorzichtige bitmap, zonder losse stukken om de zoom per woord op
 * af te stemmen, en een vaste zoom op het eind van het wijslijntje is ruim genoeg gebleken.
 */
const ZOOM = 2.2;

/** Zoom naar een punt (in procenten van de tekening), met dat punt zo veel mogelijk in het midden. */
function inzoomenOpPunt(punt: { x: number; y: number }) {
  const schaal = ZOOM;
  const plaats = (waarde: number) => Math.min(0, Math.max(100 - 100 * schaal, 50 - waarde * schaal));
  return { schaal, x: plaats(punt.x), y: plaats(punt.y) };
}

export default function Vaktermenkaart({ groep }: { groep: Extract<Vaktermgroep, { soort: 'geheel' }> }) {
  const [gekozen, setGekozen] = useState<string | null>(null);
  // Uitgezoomd terwijl er wel een woord gekozen is: het plekje blijft oplichten en de uitleg
  // blijft staan, alleen zie je de hele tekening. Een nieuw woord zoomt weer in.
  const [heel, setHeel] = useState(false);
  const [vrijeZoom, setVrijeZoom] = useState<ReturnType<typeof inzoomenOpPunt> | null>(null);
  const tekening = useRef<HTMLElement>(null);
  /** Het raster met de tekening links en de lijst rechts; zie de sprong hieronder. */
  const raster = useRef<HTMLDivElement>(null);

  // Een link als /uitleg/vaktermen#term-uitloper opent meteen het juiste woord.
  useEffect(() => {
    const uitAdres = () => {
      if (!window.location.hash.startsWith('#term-')) return;
      const slug = decodeURIComponent(window.location.hash.slice('#term-'.length));
      // Wijst het adres een woord uit een andere groep aan, dan laat deze tekening los,
      // zodat er nooit twee woorden tegelijk oplichten.
      const hier = groep.termen.find((term) => term.slug === slug);
      setGekozen(hier ? slug : null);
      setHeel(false);
      setVrijeZoom(null);

      // Wie via een woord op een plantenpagina binnenkomt, wil de plánt zien, niet een
      // regel in een lijst. Staat het woord op de tekening, dan brengen we de tekening in
      // beeld — met het plekje al opgelicht en de uitleg eronder. Staat het er niet op
      // (Stengel, Tak, Pol, Wortelblok), dan is de lijst wél de juiste plek.
      //
      // Al het springen voor `#term-…` gebeurt hier; SpringNaarAnker laat die ankers met
      // rust, zodat er niet twee stukken code om dezelfde scrollpositie vechten.
      if (!hier) return;
      const regel = document.getElementById(`term-${slug}`);
      const plakt = tekening.current && getComputedStyle(tekening.current).position === 'sticky';
      // Staat het woord niet op de tekening (Stengel, Tak, Pol, Wortelblok), dan valt er niets
      // aan te wijzen en is de regel in de lijst het juiste doel.
      //
      // Anders moet de tékening in beeld. Op een smal scherm staat die boven de lijst, dus
      // daar mikken we er rechtstreeks op. Op een breed scherm staat hij `sticky` naast de
      // lijst; dan mikken we op het raster eromheen, want dat is het enige punt waar de
      // tekening bovenaan zijn kolom hangt en dus helemaal zichtbaar is. Eerder mikten we
      // hier op de lijstregel, in de veronderstelling dat sticky hem vanzelf in beeld houdt
      // - maar bij een woord onderaan de lijst is hij dan al voorbijgeschoven en zag je
      // alleen de onderkant van de illustratie.
      springNaar(!hier.plek ? regel : plakt ? raster.current : tekening.current);
    };
    uitAdres();
    window.addEventListener('hashchange', uitAdres);
    return () => window.removeEventListener('hashchange', uitAdres);
  }, [groep]);

  // Geen sprong naar de lijst meer: de uitleg staat nu onder de tekening, dus wegscrollen
  // van het plekje dat je net hebt aangetikt zou je juist het antwoord afpakken.
  const kiesOpTekening = (slug: string) => {
    setGekozen((vorige) => (vorige === slug ? null : slug));
    setHeel(false);
    setVrijeZoom(null);
  };

  const kiesInLijst = (slug: string, heeftPlek: boolean) => {
    setGekozen((vorige) => (vorige === slug ? null : slug));
    setHeel(false);
    setVrijeZoom(null);
    if (heeftPlek) tekening.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const laatsteTik = useRef<{ tijd: number; x: number; y: number } | null>(null);

  const dubbelklikOpFoto = (event: PointerEvent<HTMLImageElement>) => {
    const tijd = performance.now();
    const vorige = laatsteTik.current;
    const afstand = vorige ? Math.hypot(event.clientX - vorige.x, event.clientY - vorige.y) : Infinity;
    if (!vorige || tijd - vorige.tijd > 360 || afstand > 36) {
      laatsteTik.current = { tijd, x: event.clientX, y: event.clientY };
      return;
    }
    laatsteTik.current = null;
    event.preventDefault();
    if (vrijeZoom || (gekozenTerm?.wijst && !heel)) {
      setVrijeZoom(null);
      setHeel(true);
      return;
    }
    const rechthoek = event.currentTarget.getBoundingClientRect();
    if (!rechthoek.width || !rechthoek.height) return;
    const punt = {
      x: ((event.clientX - rechthoek.left) / rechthoek.width) * 100,
      y: ((event.clientY - rechthoek.top) / rechthoek.height) * 100,
    };
    setHeel(false);
    setVrijeZoom(inzoomenOpPunt(punt));
  };

  const opTekening = groep.termen.filter((term) => term.plek);
  const gekozenTerm = groep.termen.find((term) => term.slug === gekozen);
  const zoom = vrijeZoom ?? (gekozenTerm?.wijst && !heel ? inzoomenOpPunt(gekozenTerm.wijst) : null);

  return <section className="vakterm-groep" id={groep.id}>
    <h2>{groep.titel}</h2>
    <p className="uitleg-inleiding">{groep.inleiding}</p>

    <div className="vakterm-lay" ref={raster}>
      <figure className="vakterm-tekening" ref={tekening}>
        <div className="vakterm-vlak" style={{ aspectRatio: `${groep.breedte} / ${groep.hoogte}` }}>
          {/* Het doek draagt de tekening én de klikvlakjes, zodat die bij het inzoomen samen
              meeschuiven en je ook ingezoomd nog op een ander woord kunt tikken. */}
          <div
            className="vakterm-doek"
            style={zoom ? { transform: `translate(${zoom.x}%, ${zoom.y}%) scale(${zoom.schaal})` } : undefined}
          >
          <img
            src={groep.illustratie}
            width={groep.breedte}
            height={groep.hoogte}
            alt={`Tekening uit het plantenboekje met de woorden ${opTekening.map((term) => term.term.toLowerCase()).join(', ')}.`}
            onPointerUp={dubbelklikOpFoto}
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
        </div>
        {/* Het bijschrift is de uitleg van wat je nu aanwijst. Zo staan tekening en tekst
            bij elkaar: op een telefoon is de lijst eronder anders buiten beeld, en dan
            kijk je naar een opgelicht plekje zonder te lezen wat het betekent. */}
        {gekozenTerm
          ? <figcaption className="vakterm-nu" aria-live="polite">
              <b>{gekozenTerm.term}</b>
              <span>{gekozenTerm.uitleg}</span>
            </figcaption>
          : <figcaption>Klik op een woord, of dubbelklik op de tekening om hier in te zoomen.</figcaption>}
        {(gekozenTerm?.wijst || vrijeZoom) && <button type="button" className="vakterm-heel" onClick={() => {
          setVrijeZoom(null);
          setHeel((vorige) => !vorige);
        }}>
          {vrijeZoom ? 'Uitzoomen' : heel ? 'Inzoomen' : 'Hele tekening'}
        </button>}
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
