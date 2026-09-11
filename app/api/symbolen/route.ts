import { leesBestand } from '@/db/media';
import { laadPlanten } from '@/app/lib/tuinData';

/**
 * De geüploade kaartsymbolen als één SVG-bestand, plus een lijstje van wat er per plant
 * aanstaat. `test_plattegrond.py` leest dit naast `planten_symbolen.svg`, en die ene
 * gegenereerde kaart gaat daarna zowel naar het scherm als naar het boekje:
 *
 *     curl http://localhost:3000/api/symbolen -o planten_symbolen_eigen.svg
 *     py test_plattegrond.py --geen-index --geen-badges --svg plattegrond_eigen.svg
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
      const [minX, minY, breedte, hoogte] = viewBox.trim().split(/[\s,]+/).map(Number);
      if (![minX, minY, breedte, hoogte].every(Number.isFinite) || breedte <= 0 || hoogte <= 0) continue;
      const verhouding = (breedte / hoogte).toFixed(4);
      const naam = `plant-${plant.slug}-eigen${nummer + 1}`;

      // Een geüploade tekening wordt hier op dezelfde maat gebracht als de bibliotheek:
      // het wortelpunt (onderkant, midden) op (0,0) en de hoogte precies 1. Plaatsen is
      // daarna `translate(x,y) scale(hoogte)`, net als bij `<g id="plant-tijm">`.
      //
      // Dit stond eerst als `<symbol viewBox="…">`, en dat ging mis: een `<use>` naar een
      // `<symbol>` zonder breedte en hoogte vult de héle tekening, dus 210 bij 297 mm, en
      // dat werd dan nog eens maal de planthoogte. Een eigen symbool kwam zo ongeveer
      // 150 keer te groot op de kaart en je zag alleen een uitvergroot stukje wit.
      const schaal = 1 / hoogte;
      const naarWortelpunt = `translate(${-(minX + breedte / 2)},${-(minY + hoogte)})`;
      tekeningen.push(`<g id="${naam}" data-verhouding="${verhouding}" transform="scale(${schaal}) ${naarWortelpunt}">${binnenkant}</g>`);
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
