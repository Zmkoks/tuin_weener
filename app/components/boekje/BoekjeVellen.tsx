'use client';

import { useEffect, useRef, useState } from 'react';
import { katernKanten, katernOmvang } from '@/app/lib/boekjeVellen';

type Modus = 'lees' | 'omslag' | 'binnenwerk';

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
  const vellen = useRef<HTMLDivElement>(null);

  const omvang = katernOmvang(paginas.length);
  const pagina = (nr: number) => nr <= paginas.length ? paginas[nr - 1] : <div className="bp-pagina bp-blanco" />;

  useEffect(() => {
    const wortel = vellen.current;
    if (!wortel) return undefined;
    let actief = true;
    const meet = () => {
      if (!actief) return;
      const te = [...wortel.querySelectorAll<HTMLElement>('.bp-pagina[data-plant]')].filter((el) => {
        // 1 px speling voor afronding tussen millimeters en pixels.
        const vol = el.scrollHeight > el.clientHeight + 1;
        el.classList.toggle('bp-overloop', vol);
        return vol;
      });
      setOverloop([...new Set(te.map((el) => el.dataset.plant || '?'))]);
    };
    // Pas meten als lettertypen en afbeeldingen er zijn: die bepalen de hoogte.
    const beelden = [...wortel.querySelectorAll('img')].map((img) => img.complete ? null : new Promise((klaar) => {
      img.addEventListener('load', klaar, { once: true });
      img.addEventListener('error', klaar, { once: true });
    }));
    void Promise.all([document.fonts.ready, ...beelden]).then(meet);
    return () => { actief = false; };
  }, [modus, paginas.length]);

  return <>
    <div className="proef-bediening">
      <label>
        Wat bekijken of afdrukken
        <select value={modus} onChange={(e) => setModus(e.target.value as Modus)}>
          <option value="lees">Leesvolgorde, losse A5 (nakijken)</option>
          <option value="omslag">Alleen omslag (enkelzijdig, A4 liggend)</option>
          <option value="binnenwerk">Alleen binnenwerk (dubbelzijdig, A4 liggend)</option>
        </select>
      </label>
      <button type="button" className="print-knop" onClick={() => window.print()}>Afdrukken / PDF opslaan</button>
    </div>

    <p className="proef-uitleg">
      {paginas.length} pagina&rsquo;s met inhoud
      {omvang > paginas.length ? `, aangevuld met ${omvang - paginas.length} blanco tot ${omvang}` : ''}.{' '}
      {modus === 'binnenwerk' && `${omvang / 2} bedrukte kanten op ${omvang / 4} vel.`}
    </p>

    {overloop === null
      ? <p className="proef-uitleg bp-meting">Pagina&rsquo;s worden gemeten…</p>
      : overloop.length > 0
        ? <p className="proef-uitleg bp-meting bp-meting-fout" role="alert">
            <b>Past niet op één pagina:</b> {overloop.join(', ')}. Deze pagina&rsquo;s zijn rood omrand; maak de tekst korter voordat je afdrukt.
          </p>
        : <p className="proef-uitleg bp-meting">Alle plantenpagina&rsquo;s passen op één A5.</p>}

    <div className="proef-vellen" ref={vellen}>
      {modus === 'lees' && Array.from({ length: omvang }, (_, i) =>
        <div className="boek-vel los" key={i}>{pagina(i + 1)}</div>)}

      {modus === 'omslag' && <div className="boek-vel katern">
        <div className="bp-pagina bp-omslag"><span className="boek-omslagnaam">ACHTERKANT</span></div>
        <span className="boek-vouw" />
        <div className="bp-pagina bp-omslag"><span className="boek-omslagnaam">VOORKANT</span></div>
      </div>}

      {modus === 'binnenwerk' && katernKanten(omvang).map((kant) =>
        <div className="boek-vel katern" key={`${kant.vel}-${kant.achterkant}`}>
          {pagina(kant.helften[0])}
          {pagina(kant.helften[1])}
        </div>)}
    </div>
  </>;
}
