'use client';

import { useEffect, useRef, useState } from 'react';
import { katernKanten, katernOmvang } from '@/app/lib/boekjeVellen';
import { laadSymboolbronnen } from '../Plattegrond';

type Modus = 'lees' | 'omslag' | 'binnenwerk';

/** "09/2026": de maand waarin het omslag wordt afgedrukt, volgens de klok van deze computer. */
function afdrukmaand(nu = new Date()) {
  return `${String(nu.getMonth() + 1).padStart(2, '0')}/${nu.getFullYear()}`;
}

/**
 * Legt de A5-pagina's van het boekje op vellen: los in leesvolgorde om na te kijken, of in
 * katernvolgorde op A4 liggend om te printen. Zie `app/lib/boekjeVellen.ts`.
 *
 * Overloop: de Python-generator stopte wanneer een plant niet op één A5-pagina paste
 * (EEN_PAGINA_PER_PLANT). Hier stopt niets, maar een pagina waarvan de inhoud buiten het
 * blad valt wordt rood omrand en bovenaan genoemd. Stilletjes afkappen zou op papier een
 * halve zin opleveren die niemand opmerkt.
 */
export default function BoekjeVellen({ paginas }: { paginas: React.ReactNode[] }) {
  const [modus, setModus] = useState<Modus>('lees');
  const [overloop, setOverloop] = useState<string[] | null>(null);
  const [klaar, setKlaar] = useState(false);
  const [beeldfouten, setBeeldfouten] = useState<string[]>([]);
  const vellen = useRef<HTMLDivElement>(null);
  const datum = useRef<SVGTextElement>(null);

  const omvang = katernOmvang(paginas.length);
  const pagina = (nr: number) => nr <= paginas.length ? paginas[nr - 1] : <div className="bp-pagina bp-blanco" />;

  useEffect(() => {
    const wortel = vellen.current;
    if (!wortel) return undefined;
    let actief = true;
    setKlaar(false);
    setOverloop(null);
    setBeeldfouten([]);
    const meet = () => {
      if (!actief) return;
      const te = [...wortel.querySelectorAll<HTMLElement>('.bp-pagina[data-paginanaam]')].filter((el) => {
        // Ook tekst die de vaste kalender bereikt is overloop, zelfs als hij nog
        // binnen het A5-vel valt. 1 px speling voor afronding tussen mm en pixels.
        const inhoud = el.querySelector<HTMLElement>('.bp-inhoud');
        const vol = el.scrollHeight > el.clientHeight + 1
          || (inhoud !== null && inhoud.scrollHeight > inhoud.clientHeight + 1)
          || [...el.querySelectorAll<HTMLElement>('.bv-sectie-namen')].some((blok) => blok.scrollHeight > blok.clientHeight + 1);
        el.classList.toggle('bp-overloop', vol);
        return vol;
      });
      setOverloop([...new Set(te.map((el) => `${el.dataset.pagina}: ${el.dataset.paginanaam}`))]);
    };
    // Pas meten als lettertypen en afbeeldingen er zijn: die bepalen de hoogte.
    const fouten: string[] = [];
    const wachtOpBeeld = (img: HTMLImageElement) => new Promise<void>((resolve) => {
      const controleer = () => {
        if (!img.naturalWidth) fouten.push(img.alt || img.src.split('/').pop() || 'Afbeelding');
        resolve();
      };
      if (img.complete) controleer();
      else {
        img.addEventListener('load', controleer, { once: true });
        img.addEventListener('error', controleer, { once: true });
      }
    });
    const beelden = [...wortel.querySelectorAll('img')].map(wachtOpBeeld);
    // SVG-achtergronden zijn geen HTML-img. Laat de printknop ook daarop wachten.
    const svgBeelden = [...wortel.querySelectorAll('svg image')].map((el) => {
      const img = new Image();
      img.src = el.getAttribute('href') || '';
      return wachtOpBeeld(img);
    });
    const observer = new ResizeObserver(meet);
    const kaart = wortel.querySelector('.bv-kaart') ? laadSymboolbronnen() : null;
    void Promise.all([document.fonts.ready, kaart, ...beelden, ...svgBeelden]).then(() => {
      if (!actief) return;
      // De kaart zet na het ophalen nog React-elementen in de pagina.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!actief) return;
        meet();
        setBeeldfouten([...new Set(fouten)]);
        setKlaar(true);
        wortel.querySelectorAll('.bp-inhoud, .bp-inhoud > *, .bp-onderkant, .bv-sectie-namen')
          .forEach((el) => observer.observe(el));
      }));
    });
    // Een pagina die over de maandgrens open bleef staan, drukt toch de juiste maand af.
    const zetDatum = () => { if (datum.current) datum.current.textContent = afdrukmaand(); };
    window.addEventListener('beforeprint', meet);
    window.addEventListener('beforeprint', zetDatum);
    return () => {
      window.removeEventListener('beforeprint', zetDatum);
      actief = false;
      observer.disconnect();
      window.removeEventListener('beforeprint', meet);
    };
  }, [modus, paginas.length]);

  return <>
    <div className="proef-bediening">
      <label>
        Wat bekijken of afdrukken
        <select value={modus} onChange={(e) => { setKlaar(false); setModus(e.target.value as Modus); }}>
          <option value="lees">Leesvolgorde, losse A5 (nakijken)</option>
          <option value="omslag">Alleen omslag (enkelzijdig, A4 liggend)</option>
          <option value="binnenwerk">Alleen binnenwerk (dubbelzijdig, A4 liggend)</option>
        </select>
      </label>
      <button type="button" className="print-knop" disabled={!klaar || beeldfouten.length > 0} onClick={() => window.print()}>
        {klaar ? 'Afdrukken / PDF opslaan' : 'Boekje wordt klaargemaakt…'}
      </button>
    </div>

    <p className="proef-uitleg">
      {paginas.length} pagina&rsquo;s binnenwerk
      {omvang > paginas.length ? `, aangevuld met ${omvang - paginas.length} blanco tot ${omvang}` : ''}.{' '}
      {modus === 'binnenwerk' && `${omvang / 2} bedrukte kanten op ${omvang / 4} vel.`}
    </p>

    {beeldfouten.length > 0 && <p className="proef-uitleg bp-meting bp-meting-fout" role="alert">Afbeeldingen niet geladen: {beeldfouten.join(', ')}. Herlaad de pagina voordat je afdrukt.</p>}
    {modus !== 'omslag' && (overloop === null
      ? <p className="proef-uitleg bp-meting">Pagina&rsquo;s worden gemeten…</p>
      : overloop.length > 0
        ? <p className="proef-uitleg bp-meting bp-meting-fout" role="alert">
            <b>Past niet op één pagina:</b> {overloop.join(', ')}. Deze pagina&rsquo;s zijn rood omrand; controleer de opmaak voordat je afdrukt. Behoud waarschuwingen en verzorgingsinformatie.
          </p>
        : <p className="proef-uitleg bp-meting">Alle pagina&rsquo;s passen op één A5.</p>)}

    <div className="proef-vellen" ref={vellen}>
      {modus === 'lees' && Array.from({ length: omvang }, (_, i) =>
        <div className="boek-vel los" key={i}>{pagina(i + 1)}</div>)}

      {/* Omslag: ontwerpen uit Inkscape (voorkant.pdf en achterkant.pdf in de projectmap, omgezet naar
          SVG). Ze zijn 138 × 200 mm, 10 mm kleiner dan A5: de printer houdt zelf een marge aan,
          en zo valt er niets weg zonder randloos te hoeven printen. Elk staat midden in zijn helft. */}
      {modus === 'omslag' && <div className="boek-vel katern">
        <div className="bp-pagina bp-omslag">
          <div className="bp-omslagbeeld">
            <img src="/boekje/achterkant.svg" alt="Achterkant van het plantenboekje" />
            {/* Afdrukmaand, op de plek waar "08/2026" in het ontwerp stond: Poppins Bold 10 pt,
                frisgroen, gemeten op de oorspronkelijke export. SVG-tekst zodat de basislijn exact is. */}
            <svg className="bp-omslagdatum" viewBox="0 0 138.29 200" aria-hidden="true">
              <text x="10.70" y="148.84" ref={datum}>{afdrukmaand()}</text>
            </svg>
          </div>
        </div>
        <div className="bp-pagina bp-omslag"><div className="bp-omslagbeeld"><img src="/boekje/voorkant.svg" alt="Voorkant van het plantenboekje" /></div></div>
      </div>}

      {modus === 'binnenwerk' && katernKanten(omvang).map((kant) =>
        <div className="boek-vel katern" key={`${kant.vel}-${kant.achterkant}`}>
          {pagina(kant.helften[0])}
          {pagina(kant.helften[1])}
        </div>)}
    </div>
  </>;
}
