'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/app/components/NativeLink';
import Plattegrond from '@/app/components/Plattegrond';
import { Badge } from '@/app/components/kaartIndex';
import type { Plek } from '@/app/data/plekTypes';
import { bewerkbaar, kader, nummerPositie, rond } from '@/app/lib/plekVorm';
import { useBeheer } from '../../BeheerContext';
import { BovenaanBeginnen, Melding, NietGevonden, Terug, useHandeling } from '../../onderdelen';

export default function Scherm({ plekId }: { plekId?: string }) {
  const { plekken, plekVan, planten, beplanting, namen } = useBeheer();
  const router = useRouter();
  if (plekId) {
    const plek = plekVan(plekId);
    if (!plek || !bewerkbaar(plek)) return <NietGevonden titel="Deze plek kan niet worden aangepast" tekst="Kies een bestaande plantenbak of vrije ovale plek op de kaart." naar="/beheren/plekken/aanpassen" tekstTerug="Een plek kiezen" />;
    return <Bewerken key={plek.id} plek={plek} />;
  }
  const keuzes = plekken.filter(bewerkbaar);
  return <div className="beheer">
    <BovenaanBeginnen /><Terug naar="/beheren" tekst="Terug naar het begin" />
    <h1>Welke plek wil je aanpassen?</h1>
    <p className="lead">Kies een plantenbak of vrije plek. De planten blijven bij die plek horen.</p>
    <div className="beheer-werkblad">
      <div className="beheer-kaart plek-keuzekaart">
        <Plattegrond zones={keuzes} plants={planten} placements={beplanting} namen={namen}
          onKies={(id) => { if (keuzes.some((p) => p.id === id)) router.push(`/beheren/plekken/aanpassen/${encodeURIComponent(id)}`); }}
          indexLaag={<g pointerEvents="none">{keuzes.map((p) => <Badge key={p.id} plek={p} />)}</g>} />
      </div>
      <aside className="beheer-paneel">
        <h2>Plantenbakken en vrije plekken</h2>
        <div className="plek-keuzelijst">{keuzes.map((p) => <Link key={p.id} href={`/beheren/plekken/aanpassen/${encodeURIComponent(p.id)}`}>
          <b>{p.soort === 'bak' ? 'Plantenbak' : 'Vrije plek'} {p.label}</b>
          <span>{namen[p.id]?.join(', ') || 'Nog leeg'}</span>
        </Link>)}</div>
        {!keuzes.length && <p>Er zijn nog geen plekken die je kunt aanpassen.</p>}
      </aside>
    </div>
  </div>;
}

function Bewerken({ plek }: { plek: Plek }) {
  const { plekken, planten, beplanting, namen, wijzigPlek } = useBeheer();
  const [vorm, setVorm] = useState(plek.vorm);
  const [zoom, setZoom] = useState(1);
  const [focusVorm, setFocusVorm] = useState(plek.vorm);
  const kaart = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = kaart.current;
    if (!el || (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)) return;
    const k = kader(focusVorm);
    const schaal = el.scrollWidth / 210;
    el.scrollLeft = (k.x + k.b / 2) * schaal - el.clientWidth / 2;
    el.scrollTop = (k.y + k.h / 2) * schaal - el.clientHeight / 2;
  }, [focusVorm, zoom]);
  const { bezig, fout, doe } = useHandeling();
  const gewijzigd = JSON.stringify(vorm) !== JSON.stringify(plek.vorm);
  const preview = { ...plek, vorm, badge: gewijzigd ? nummerPositie(vorm, plek.soort) : plek.badge };
  const actueel = plekken.map((p) => p.id === plek.id ? preview : p);
  const maat = kader(vorm);
  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren/plekken/aanpassen" tekst="Een andere plek kiezen" />
    <h1>{plek.soort === 'bak' ? 'Plantenbak' : 'Vrije plek'} {plek.label} aanpassen</h1>
    <p className="lead">Sleep de plek om hem te verplaatsen. Trek aan een handgreep om de grootte te veranderen.</p>
    <div className="beheer-werkblad">
      <div className="plek-kaartkolom">
        <div className="plek-kaartzoom" role="group" aria-label="Kaartzoom">
          <button type="button" disabled={zoom === 1 || bezig} onClick={() => { setFocusVorm(vorm); setZoom(zoom - 1); }}>Kaart verkleinen</button>
          <span aria-live="polite">{zoom}×</span>
          <button type="button" disabled={zoom === 4 || bezig} onClick={() => { setFocusVorm(vorm); setZoom(zoom + 1); }}>Kaart vergroten</button>
        </div>
        <div ref={kaart} className={`beheer-kaart plek-bewerkkaart${zoom > 1 ? ' ingezoomd' : ''}`}>
        <div style={{ width: zoom === 1 ? '100%' : `${zoom * 100}%`, minWidth: zoom === 1 ? undefined : 640 * zoom }}>
        <Plattegrond zones={actueel} gekozen={plek.id} namen={namen} plants={planten} placements={beplanting}
          bewerking={{ vorm, soort: plek.soort, onVorm: setVorm, disabled: bezig }}
          indexLaag={<g pointerEvents="none">{actueel.filter(bewerkbaar).map((p) => <Badge key={p.id} plek={p} />)}</g>} />
        </div>
        </div>
      </div>
      <aside className="beheer-paneel">
        <h2>Plaats en grootte</h2>
        <p>Het nummer, de planten en de QR-code blijven behouden.</p>
        <p className="teken-maat" aria-live="polite">{plek.soort === 'bak' && vorm.type === 'ellipse' ? `Doorsnee: ${rond(maat.b)}` : `${rond(maat.b)} × ${rond(maat.h)}`} mm op de kaart</p>
        <p id="vorm-bediening-uitleg" className="beheer-let-op">Met het toetsenbord: selecteer de plek of een handgreep met Tab en gebruik de pijltjes. Houd Shift ingedrukt voor kleine stapjes. Escape breekt het slepen af.</p>
        <Melding fout={fout} />
        <button className="beheer-doen" type="button" disabled={!gewijzigd || bezig} onClick={() => void doe(() => wijzigPlek(plek.id, vorm))}>{bezig ? 'Bezig met opslaan…' : 'Opslaan'}</button>
        <div className="plek-bewerk-acties">
          <button type="button" disabled={!gewijzigd || bezig} onClick={() => setVorm(plek.vorm)}>Wijzigingen herstellen</button>
          {!bezig && <Link href="/beheren/plekken/aanpassen">Annuleren</Link>}
        </div>
      </aside>
    </div>
  </div>;
}
