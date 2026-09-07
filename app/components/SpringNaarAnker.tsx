'use client';

import { useEffect } from 'react';
import { springNaar } from '@/app/lib/springNaar';

/**
 * Springt naar het stukje uitleg dat in het adres staat, bijvoorbeeld
 * `/uitleg/water#niveau-2` vanaf de druppels op een plantenpagina.
 *
 * De browser doet dat normaal zelf, maar bij een verse pagina-load staat de pagina er nog
 * niet als hij het probeert, en na hydratie zet de router de pagina weer bovenaan. Daarom
 * springen we hier zelf, één keer na hydratie. Het oplichten van de regel zelf gaat met
 * `:target` in uitleg.css, dus zonder javascript.
 */
export default function SpringNaarAnker() {
  useEffect(() => {
    const spring = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      // De tuinwoorden regelen hun eigen sprong: die gaat naar de tekening en niet naar de
      // regel in de lijst. Zie Vaktermenkaart.tsx. Zouden we hier ook springen, dan vechten
      // twee stukken code om dezelfde scrollpositie.
      if (id.startsWith('term-')) return;
      springNaar(document.getElementById(id));
    };
    spring();
    window.addEventListener('hashchange', spring);
    return () => window.removeEventListener('hashchange', spring);
  }, []);
  return null;
}
