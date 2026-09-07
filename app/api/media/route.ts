import { NextResponse } from 'next/server';
import { MAXIMALE_GROOTTE, SYMBOOL_TYPE, TOEGESTAAN, bewaarBestand, keurSymbool, nieuweSleutel } from '@/db/media';
import { geldigeSessie } from '@/app/lib/auth';

const SOORTEN = ['foto', 'illustratie', 'symbool'];

/** Een foto of illustratie uploaden. Geeft de sleutel terug die in het paspoort komt. */
export async function POST(request: Request) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const formulier = await request.formData();
    const soort = String(formulier.get('soort') || '');
    const slug = String(formulier.get('slug') || '').replace(/[^a-z0-9-]/g, '');
    const bestand = formulier.get('bestand');

    if (!SOORTEN.includes(soort)) return NextResponse.json({ error: 'Onbekende soort afbeelding.' }, { status: 400 });
    if (!slug) return NextResponse.json({ error: 'Deze afbeelding hoort bij geen enkele plant.' }, { status: 400 });
    if (!(bestand instanceof File)) return NextResponse.json({ error: 'Er is geen bestand meegestuurd.' }, { status: 400 });

    if (bestand.size > MAXIMALE_GROOTTE) return NextResponse.json({ error: 'Dit bestand is groter dan 8 MB.' }, { status: 413 });

    if (soort === 'symbool') {
      if (bestand.type !== SYMBOOL_TYPE) return NextResponse.json({ error: 'Een kaartsymbool moet een SVG-bestand zijn.' }, { status: 415 });
      const tekening = await bestand.text();
      const bezwaar = keurSymbool(tekening);
      if (bezwaar) return NextResponse.json({ error: bezwaar }, { status: 422 });
      const sleutelSvg = nieuweSleutel(soort, slug, 'svg');
      await bewaarBestand(sleutelSvg, new TextEncoder().encode(tekening).buffer as ArrayBuffer, SYMBOOL_TYPE);
      return NextResponse.json({ bestand: sleutelSvg }, { status: 201 });
    }

    const extensie = TOEGESTAAN[bestand.type];
    if (!extensie) return NextResponse.json({ error: 'Kies een JPEG-, PNG- of WebP-bestand.' }, { status: 415 });

    const sleutel = nieuweSleutel(soort, slug, extensie);
    await bewaarBestand(sleutel, await bestand.arrayBuffer(), bestand.type);
    return NextResponse.json({ bestand: sleutel }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Uploaden mislukt.' }, { status: 500 });
  }
}
