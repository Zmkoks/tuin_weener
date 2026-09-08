'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from '@/app/components/NativeLink';
import { icoonPad } from '../data/iconen';

/** Breedte van het paneel in px; ook de afstand waarover je veegt. */
const BREEDTE = 300;
/** Vanaf hoeveel px van de linkerrand een veeg als "menu openen" telt. */
const RANDBREEDTE = 28;
/** Hoeveel px eerst in één richting moet bewegen voordat we weten of je veegt of scrolt. */
const DREMPEL = 10;

/**
 * De onderdelen van de site, in dezelfde volgorde als de balk op de homepage.
 *
 * De tabbladen van de homepage zijn geen eigen adres maar een `#`-stukje. Daarom staan
 * die hier als gewoon anker en niet als <Link>: springt Next er met de router heen, dan
 * krijgt de homepage geen `hashchange` en blijft hij op het oude tabblad staan.
 */
const ONDERDELEN = [
  { pad: '/', naam: 'Planten', anker: true },
  { pad: '/plattegrond', naam: 'Plattegrond', anker: false },
  {
    pad: '/uitleg',
    naam: 'Uitleg',
    anker: false,
    onder: [
      { pad: '/uitleg/water', naam: 'Water geven' },
      { pad: '/uitleg/functies', naam: 'Functies, standplaats en kalender' },
      { pad: '/uitleg/vaktermen', naam: 'Tuinwoorden' },
    ],
  },
  { pad: '/drukwerk', naam: 'Drukwerk', anker: false },
];

/**
 * Zijmenu dat vanaf de linkerrand naar binnen schuift: met de knop in de balk, of door
 * met je duim vanaf de rand naar rechts te vegen. Terug met een veeg naar links, met
 * Escape, of door naast het paneel te tikken.
 *
 * Staat op elke pagina, want de plantenpagina's achter een QR-code hebben verder geen
 * navigatie: wie in de tuin een bordje scant, kan zo alsnog de hele site in.
 */
export default function Zijmenu() {
  const [open, setOpen] = useState(false);
  /** Pas na hydratie hangen we het paneel aan <body>; op de server bestaat dat niet. */
  const [gemonteerd, setGemonteerd] = useState(false);
  /** Tijdens het vegen: hoe ver het paneel staat, van -BREEDTE (dicht) tot 0 (open). */
  const [verschuiving, setVerschuiving] = useState<number | null>(null);
  const knop = useRef<HTMLButtonElement>(null);
  const sluitknop = useRef<HTMLButtonElement>(null);
  const stand = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setGemonteerd(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const zetVerschuiving = (waarde: number | null) => {
    stand.current = waarde;
    setVerschuiving(waarde);
  };

  // Vegen. De richting bepalen we pas na een paar pixels: beweeg je vooral omhoog of
  // omlaag, dan laten we los zodat de pagina gewoon scrolt.
  useEffect(() => {
    let bezig = false;
    let beginX = 0;
    let beginY = 0;
    let richtingBekend = false;

    const begin = (gebeurtenis: TouchEvent) => {
      const vinger = gebeurtenis.touches[0];
      if (!open && vinger.clientX > RANDBREEDTE) return;
      bezig = true;
      richtingBekend = false;
      beginX = vinger.clientX;
      beginY = vinger.clientY;
    };

    const beweeg = (gebeurtenis: TouchEvent) => {
      if (!bezig) return;
      const vinger = gebeurtenis.touches[0];
      const overX = vinger.clientX - beginX;
      const overY = vinger.clientY - beginY;
      if (!richtingBekend) {
        if (Math.abs(overX) < DREMPEL && Math.abs(overY) < DREMPEL) return;
        richtingBekend = true;
        if (Math.abs(overX) <= Math.abs(overY)) {
          bezig = false;
          return;
        }
      }
      zetVerschuiving(Math.max(-BREEDTE, Math.min(0, (open ? 0 : -BREEDTE) + overX)));
      gebeurtenis.preventDefault();
    };

    const eind = () => {
      if (!bezig) return;
      bezig = false;
      const waar = stand.current;
      zetVerschuiving(null);
      if (waar !== null) setOpen(waar > -BREEDTE / 2);
    };

    document.addEventListener('touchstart', begin, { passive: true });
    document.addEventListener('touchmove', beweeg, { passive: false });
    document.addEventListener('touchend', eind);
    document.addEventListener('touchcancel', eind);
    return () => {
      document.removeEventListener('touchstart', begin);
      document.removeEventListener('touchmove', beweeg);
      document.removeEventListener('touchend', eind);
      document.removeEventListener('touchcancel', eind);
    };
  }, [open]);

  // Escape sluit, de pagina eronder scrollt niet mee, en de aandacht springt netjes
  // van de knop naar het paneel en terug.
  useEffect(() => {
    if (!open) return;
    const opToets = (gebeurtenis: KeyboardEvent) => {
      if (gebeurtenis.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', opToets);
    const vorige = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sluitknop.current?.focus();
    return () => {
      document.removeEventListener('keydown', opToets);
      document.body.style.overflow = vorige;
      knop.current?.focus();
    };
  }, [open]);

  const veegt = verschuiving !== null;
  const positie = veegt ? verschuiving : open ? 0 : -BREEDTE;
  const doorzicht = (positie + BREEDTE) / BREEDTE;

  return <>
    <button
      type="button"
      className="menu-knop"
      ref={knop}
      aria-expanded={open}
      aria-controls="zijmenu"
      aria-label="Menu openen"
      onClick={() => setOpen(true)}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </g>
      </svg>
    </button>

    {/* Paneel en waas hangen aan <body> en niet in de balk waar de knop staat. In de
        balk van de homepage gelden regels als `.topbar nav {display:none}` (onder 900px
        staat de navigatie immers hier in het menu) en die sloegen anders ook op de
        <nav> ín dit paneel — dan is het menu leeg. Bijkomend voordeel: geen gedoe met
        de z-index van een balk die zelf al `sticky` is. */}
    {gemonteerd && createPortal(<>
    <div
      className={`menu-waas${open || veegt ? ' aan' : ''}`}
      style={{ opacity: doorzicht, transition: veegt ? 'none' : undefined }}
      onClick={() => setOpen(false)}
      aria-hidden="true"
    />

    <div
      className="zijmenu"
      id="zijmenu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
      style={{ transform: `translateX(${positie}px)`, transition: veegt ? 'none' : undefined }}
    >
      <div className="zijmenu-kop">
        <img src={icoonPad('WeenerLogo')} alt="Weener XL" className="zijmenu-logo" />
        <button type="button" className="menu-sluit" ref={sluitknop} aria-label="Menu sluiten" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </g>
          </svg>
        </button>
      </div>

      {/* Eén klik-vanger voor de hele lijst: elke link sluit het menu. */}
      <nav aria-label="Alle onderdelen" onClick={() => setOpen(false)}>
        {ONDERDELEN.map((onderdeel) => <div className="zijmenu-groep" key={onderdeel.pad}>
          {onderdeel.anker
            ? <a className="zijmenu-regel" href={onderdeel.pad}><b>{onderdeel.naam}</b></a>
            : <Link className="zijmenu-regel" href={onderdeel.pad}><b>{onderdeel.naam}</b></Link>}
          {onderdeel.onder && <div className="zijmenu-onder">
            {onderdeel.onder.map((sub) => <Link href={sub.pad} key={sub.pad}>{sub.naam}</Link>)}
          </div>}
        </div>)}

        <div className="zijmenu-scheiding">Voor medewerkers</div>
        <Link className="zijmenu-regel" href="/beheren"><b>Beheren</b></Link>
      </nav>
    </div>
    </>, document.body)}
  </>;
}
