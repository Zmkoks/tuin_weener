'use client';

/**
 * Katernproef — nog zonder inhoud.
 *
 * Voordat er één plantenpagina bestaat moet vaststaan dat de browser een boekje kan
 * afdrukken dat na vouwen op volgorde ligt. Deze pagina drukt alleen genummerde vellen af.
 *
 * Het boekje bestaat uit twee losse printopdrachten:
 *
 *  - Het OMSLAG is één vel A4 liggend, aan één kant bedrukt. Links de achterkant, rechts de
 *    voorkant: na vouwen klapt de linkerhelft om naar achteren. De binnenzijde blijft leeg,
 *    zodat het omslag op dikker papier kan zonder dubbelzijdig te printen.
 *  - Het BINNENWERK is een eigen katern dat vanaf 1 nummert en in het omslag wordt gevouwen.
 *    Bij M pagina's (M is een viervoud):
 *      vel i voorkant   = [M - 2i, 1 + 2i]
 *      vel i achterkant = [2 + 2i, M - 1 - 2i]
 *
 * A4 liggend is 297 x 210 mm; twee helften van 148,5 x 210 mm. A5 is 148 x 210 mm, dus de
 * pagina past zonder schalen. De volgorde gaat uit van links-rechts omslaan; welk vinkje dat
 * is in de printdialoog verschilt per printer.
 *
 * Omdat het omslag buiten de nummering valt, komen de blanco opvulpagina's achterin het
 * binnenwerk terecht en nooit op de achterkant van het boekje.
 */

import { useState } from 'react';
import Link from '@/app/components/NativeLink';
import Kopbalk from '../../../components/Kopbalk';
import { katernKanten, katernOmvang } from '@/app/lib/boekjeVellen';

type Modus = 'heel' | 'omslag' | 'binnenwerk' | 'los';

/** Een half vel: een genummerde binnenwerkpagina, een omslaghelft, of blanco opvulling. */
type Helft = number | 'VOORKANT' | 'ACHTERKANT';

type Kant = {
  helften: [Helft, Helft];
  naam: string;
  omslag: boolean;
};

const OMSLAG: Kant = { helften: ['ACHTERKANT', 'VOORKANT'], naam: 'omslag · buitenzijde', omslag: true };

function binnenwerkKanten(paginas: number, inhoud: number): Kant[] {
  // 0 betekent blanco: een opvulpagina om op een viervoud uit te komen.
  return katernKanten(paginas).map((kant) => ({
    helften: kant.helften.map((nr) => (nr > inhoud ? 0 : nr)) as [Helft, Helft],
    naam: `binnenwerk, vel ${kant.vel} · ${kant.achterkant ? "achterkant" : "voorkant"}`,
    omslag: false,
  }));
}

function Pagina({ helft }: { helft: Helft }) {
  if (helft === 'VOORKANT' || helft === 'ACHTERKANT') {
    return <div className="boek-pagina omslagzijde">
      <span className="boek-hoek boven">boven</span>
      <span className="boek-omslagnaam">{helft}</span>
    </div>;
  }
  if (helft === 0) {
    return <div className="boek-pagina blanco"><span className="boek-nummer">blanco</span></div>;
  }
  return <div className="boek-pagina">
    <span className="boek-hoek boven">boven</span>
    <span className="boek-nummer">{helft}</span>
    <span className="boek-hoek onder">pagina {helft}</span>
  </div>;
}

export default function KaternproefPagina() {
  const [inhoud, setInhoud] = useState(38);
  const [modus, setModus] = useState<Modus>('heel');

  // Naar boven afronden op een viervoud: minder kan niet gevouwen worden.
  const paginas = katernOmvang(inhoud);
  const binnenwerk = binnenwerkKanten(paginas, inhoud);
  const kanten = modus === 'omslag' ? [OMSLAG]
    : modus === 'binnenwerk' ? binnenwerk
    : [OMSLAG, ...binnenwerk];

  const blanco = paginas - inhoud;
  const telling = modus === 'los'
    ? `${paginas} losse A5-pagina's plus voor- en achterkant`
    : modus === 'omslag' ? '1 bedrukte kant op 1 vel A4 liggend; de binnenzijde blijft leeg'
    : `${kanten.length} bedrukte kanten op ${modus === 'binnenwerk' ? kanten.length / 2 : (kanten.length - 1) / 2 + 1} vel A4 liggend`;

  return <main className="katernproef">
    <Kopbalk actief="drukwerk" />
    <section className="workspace">
      <div className="proef-bediening-terug"><Link href="/drukwerk">← Terug naar drukwerk</Link></div>
      <p className="eyebrow">KATERNPROEF</p>
      <h1>Klopt de volgorde na vouwen?</h1>
      <div className="proef-uitleg">
        <p className="lead">
          Deze pagina bevat geen inhoud. Druk hem af op A4 <b>liggend</b>, vouw de stapel door het
          midden en controleer of de nummers op volgorde liggen.
        </p>
        <p>
          Het boekje bestaat uit twee opdrachten. Het <b>omslag</b> is één vel, aan één kant
          bedrukt: links de achterkant, rechts de voorkant. Dat kan dus enkelzijdig op dikker
          papier. Het <b>binnenwerk</b> print je dubbelzijdig op gewoon papier en vouw je in het
          omslag. Het binnenwerk nummert vanaf 1, los van het omslag.
        </p>
      </div>
      <div className="proef-bediening">
        <label>
          Aantal pagina&rsquo;s binnenwerk
          <input type="number" min={1} max={200} value={inhoud}
            onChange={(e) => setInhoud(Math.min(200, Math.max(1, Number(e.target.value) || 1)))} />
        </label>
        <label>
          Wat afdrukken
          <select value={modus} onChange={(e) => setModus(e.target.value as Modus)}>
            <option value="heel">Alles achter elkaar (alleen bekijken)</option>
            <option value="omslag">Alleen omslag (enkelzijdig)</option>
            <option value="binnenwerk">Alleen binnenwerk (dubbelzijdig)</option>
            <option value="los">Leesvolgorde, losse A5</option>
          </select>
        </label>
        <button type="button" className="print-knop" onClick={() => window.print()}>Afdrukken / PDF opslaan</button>
      </div>
      <p className="proef-uitleg">
        Binnenwerk {paginas} pagina&rsquo;s{blanco ? `, waarvan ${blanco} blanco opvulling achterin` : ''} · {telling}.
        {modus === 'heel' ? <><br /><b>Niet zo afdrukken:</b> het omslag moet enkelzijdig en het binnenwerk dubbelzijdig. Kies ze elk apart.</> : null}
      </p>
      <div className="proef-vellen">
        {modus === 'los'
          ? [<div className="boek-vel los omslagvel" key="voor"><Pagina helft="VOORKANT" /></div>,
             ...Array.from({ length: paginas }, (_, i) => <div className="boek-vel los" key={i}>
               <Pagina helft={i + 1 > inhoud ? 0 : i + 1} />
             </div>),
             <div className="boek-vel los omslagvel" key="achter"><Pagina helft="ACHTERKANT" /></div>]
          : kanten.map((kant, i) => <div className={`boek-vel katern${kant.omslag ? ' omslagvel' : ''}`} key={i}>
              <Pagina helft={kant.helften[0]} />
              <span className="boek-vouw" />
              <Pagina helft={kant.helften[1]} />
              <span className="boek-velnaam">{kant.naam}</span>
            </div>)}
      </div>
    </section>
  </main>;
}
