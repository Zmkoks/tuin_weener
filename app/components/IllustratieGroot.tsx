'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * De botanische illustratie staat klein in de pagina (220px hoog). Tik erop en hij komt
 * schermvullend over de pagina te liggen, zodat de details te zien zijn; tik, Escape of de
 * sluitknop brengt hem weer terug.
 *
 * Het venster gaat met `createPortal` naar <body>, om dezelfde reden als bij het zijmenu:
 * anders zit een `position: fixed` laag gevangen in de stapelcontext van de pagina.
 *
 * In het grote beeld staat de illustratie zonder de afstelling (`stijlMetZoom`) van het
 * kleine kaartje: die snijdt juist bij om hem in het kleine vlak te laten passen, en dat
 * is precies wat je hier niet wilt.
 */
export default function IllustratieGroot({ src, stijl, alt, bijschrift }: {
  src: string;
  stijl?: React.CSSProperties;
  alt: string;
  bijschrift: string;
}) {
  const [open, setOpen] = useState(false);
  const knop = useRef<HTMLButtonElement>(null);
  const sluiten = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opToets = (gebeurtenis: KeyboardEvent) => { if (gebeurtenis.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', opToets);
    // De pagina eronder hoort niet mee te scrollen zolang het venster openstaat.
    const vorige = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sluiten.current?.focus();
    return () => {
      window.removeEventListener('keydown', opToets);
      document.body.style.overflow = vorige;
    };
  }, [open]);

  // Bij het sluiten gaat de aandacht terug naar de illustratie waar je vandaan kwam.
  useEffect(() => { if (!open) knop.current?.blur(); }, [open]);

  return <>
    <button
      type="button"
      className="illustratie-knop"
      ref={knop}
      onClick={() => setOpen(true)}
      aria-label={`${alt} — groter bekijken`}
    >
      <span className="illustratie-vlak"><img className="illustratie-beeld" src={src} style={stijl} alt="" /></span>
      <span className="illustratie-hint" aria-hidden="true">Tik om groter te zien</span>
    </button>

    {open && typeof document !== 'undefined' && createPortal(
      <div className="illustratie-venster" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)}>
        <button type="button" className="illustratie-sluiten" ref={sluiten} onClick={() => setOpen(false)} aria-label="Sluiten">✕</button>
        {/* De klik op de illustratie zelf mag het venster niet sluiten: daar wil je juist
            kunnen slepen en met twee vingers inzoomen. */}
        <img className="illustratie-groot" src={src} alt={alt} onClick={(gebeurtenis) => gebeurtenis.stopPropagation()} />
        <p className="illustratie-venster-bijschrift">{bijschrift}</p>
      </div>,
      document.body,
    )}
  </>;
}
