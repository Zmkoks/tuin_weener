/**
 * Naar een stukje pagina springen — en daar ook blijven staan.
 *
 * Eén keer `scrollIntoView` na hydratie is niet genoeg gebleken: de router van Next zet de
 * pagina ná dat moment alsnog bovenaan, en afbeeldingen erboven verschuiven de pagina
 * terwijl ze laden. Het gevolg was dat élke uitleglink (de druppels, de jaarkalender, een
 * functie-icoon, een tuinwoord) je bovenaan de pagina afzette in plaats van bij de regel
 * waar het over ging.
 *
 * Daarom corrigeren we een klein poosje door: elke frame, tot de plek klopt en blijft
 * kloppen. Zodra iemand zelf scrolt houden we op — anders zou de pagina onder zijn vingers
 * vandaan springen.
 *
 * De vaste kopbalk (`.scan-kop`) staat `sticky` bovenaan, dus daar rekenen we omheen;
 * anders schuift de aangewezen regel er precies onder.
 */

const RUIMTE = 10;
const DUUR_MS = 800;

function kopHoogte() {
  const kop = document.querySelector('.scan-kop');
  return kop ? kop.getBoundingClientRect().height : 0;
}

export function springNaar(doel: HTMLElement | null, duurMs = DUUR_MS) {
  if (!doel) return () => {};

  let gestopt = false;
  const stop = () => { gestopt = true; };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);

  const opruimen = () => {
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
  };

  const begin = performance.now();
  const poging = () => {
    if (gestopt) return opruimen();
    const afstand = doel.getBoundingClientRect().top - kopHoogte() - RUIMTE;
    // `instant` en niet `auto`: `auto` betekent "volg de CSS", en in globals.css staat
    // `html { scroll-behavior: smooth }`. Dan begint elke frame een nieuwe zachte animatie
    // die de vorige afbreekt, en komt de pagina een paar pixels ver. Dit was de reden dat
    // springen naar een anker helemaal niet werkte.
    if (Math.abs(afstand) > 2) window.scrollBy({ top: afstand, behavior: 'instant' });
    if (performance.now() - begin > duurMs) return opruimen();
    requestAnimationFrame(poging);
  };
  requestAnimationFrame(poging);

  return opruimen;
}
