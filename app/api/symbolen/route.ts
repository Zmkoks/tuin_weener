import { leesBestand } from '@/db/media';
import { laadPlanten } from '@/app/lib/tuinData';

/**
 * De geüploade kaartsymbolen als één SVG-bestand, plus een lijstje van wat er per plant
 * aanstaat. `test_plattegrond.py` leest dit naast `planten_symbolen.svg`, en die ene
 * gegenereerde kaart gaat daarna zowel naar het scherm als naar het boekje:
 *
 *     curl http://localhost:3000/api/symbolen -o planten_symbolen_eigen.svg
 *     py test_plattegrond.py --geen-index --geen-badges --svg website/public/plattegrond-tuin.svg
 *
 * Alleen planten waar iemand de symbolen heeft aangeraakt staan erin. De rest ontbreekt,
 * en houdt dus gewoon alle varianten uit de bibliotheek.
 */
export async function GET() {
  const planten = await laadPlanten();
  const tekeningen: string[] = [];
  const keuze: Record<string, string[]> = {};

  for (const plant of planten) {
    if (!plant.symbolen) continue;
    const namen = [...plant.symbolen.bibliotheek];

    for (const [nummer, eigen] of plant.symbolen.eigen.entries()) {
      const bestand = await leesBestand(eigen.bestand);
      if (!bestand) continue;

      const tekening = await bestand.text();
      const viewBox = /viewBox\s*=\s*["']([^"']+)["']/i.exec(tekening)?.[1];
      if (!viewBox) continue;

      // Alleen wat tussen de buitenste <svg> staat; de rest is verpakking.
      const binnenkant = tekening.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg\s*>[\s\S]*$/i, '');
      const [, , breedte, hoogte] = viewBox.trim().split(/[\s,]+/).map(Number);
      const verhouding = breedte && hoogte ? (breedte / hoogte).toFixed(4) : '1';
      const naam = `plant-${plant.slug}-eigen${nummer + 1}`;

      tekeningen.push(`<symbol id="${naam}" viewBox="${viewBox}" data-verhouding="${verhouding}" overflow="visible">${binnenkant}</symbol>`);
      namen.push(naam);
    }

    keuze[plant.slug] = namen;
  }

  const bestand = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0">
<metadata id="symboolkeuze">${JSON.stringify(keuze)}</metadata>
<defs>
${tekeningen.join('\n')}
</defs>
</svg>
`;

  return new Response(bestand, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'no-store',
      'content-disposition': 'inline; filename="planten_symbolen_eigen.svg"',
    },
  });
}
