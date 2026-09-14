import { NextResponse } from 'next/server';
import type { Plek, Vorm } from '@/app/data/plekTypes';
import { laadZones, vasteZones } from '@/app/lib/tuinData';
import { leesBeplanting } from '@/db/beplanting';
import { volgendBijgemaaktNummer, volgendPlekNummer, plekMetadata, maakPlek, verwijderPlek, leesPlek, wijzigPlekVorm } from '@/db/plekken';
import { geldigeSessie } from '@/app/lib/auth';
import { keurVorm, nummerPositie, bewerkbaar } from '@/app/lib/plekVorm';

/** De kaart is A4 staand in millimeters; buiten dat vel kan geen plek liggen. */
const BREEDTE = 210;
const HOOGTE = 297;

const rond = (waarde: number) => Math.round(waarde * 100) / 100;

function nieuwePlek(vorm: Vorm, nummer: number, soort: 'bak' | 'vrij', label: string): Plek {
  return {
    id: `eigen-${String(nummer).padStart(2, '0')}`,
    label,
    soort,
    badge: nummerPositie(vorm, soort),
    planten: [],
    vorm,
    svg_label: '',
  };
}

export async function GET() {
  try {
    return NextResponse.json({ plekken: await laadZones() });
  } catch (error) {
    return NextResponse.json({ plekken: vasteZones, error: error instanceof Error ? error.message : 'Laden mislukt.' }, { status: 500 });
  }
}

/**
 * Een plek bijmaken op de kaart. Een punt blijft beschikbaar voor een plant die los staat;
 * in de tekenmodus komen er rechthoekige of ronde plantvakken bij.
 */
export async function POST(request: Request) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const body = await request.json() as { x?: unknown; y?: unknown; vorm?: unknown; soort?: unknown };
    const [nummer, label] = await Promise.all([volgendBijgemaaktNummer(), volgendPlekNummer()]);
    let plek: Plek;

    if (body.vorm !== undefined) {
      const soort = body.soort === undefined || body.soort === 'bak' ? 'bak' : body.soort === 'vrij' ? 'vrij' : '';
      if (!soort) return NextResponse.json({ error: 'Kies een plantenbak of een vrije plek.' }, { status: 400 });
      try {
        const vorm = keurVorm(body.vorm, soort);
        plek = nieuwePlek(vorm, nummer, soort, label);
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Ongeldige vorm.' }, { status: 400 });
      }
    } else {
      const x = Number(body.x);
      const y = Number(body.y);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > BREEDTE || y < 0 || y > HOOGTE) {
        return NextResponse.json({ error: 'Deze plek ligt buiten de plattegrond.' }, { status: 400 });
      }
      plek = nieuwePlek({ type: 'punt', x: rond(x), y: rond(y) }, nummer, 'vrij', label);
    }

    await maakPlek(plek);
    return NextResponse.json({ plek }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}

/** De vorm aanpassen zonder de identiteit of beplanting van de plek te wijzigen. */
export async function PATCH(request: Request) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  let body: { id?: unknown; vorm?: unknown };
  try {
    body = await request.json();
    if (!body || typeof body.id !== 'string' || !body.id) throw new Error();
  } catch {
    return NextResponse.json({ error: 'Kies een bestaande plek en geef een vorm op.' }, { status: 400 });
  }
  try {
    const bestaand = await leesPlek(body.id as string);
    if (!bestaand) return NextResponse.json({ error: 'Deze plek bestaat niet meer.' }, { status: 404 });
    let vorm: Vorm;
    try {
      if (!bewerkbaar(bestaand)) throw new Error('Alleen bakken en vrije ovale plekken kunnen worden aangepast.');
      vorm = keurVorm(body.vorm, bestaand.soort);
      if (vorm.type !== bestaand.vorm.type) throw new Error('De vormsoort moet hetzelfde blijven.');
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Ongeldige vorm.' }, { status: 400 });
    }
    const plek = await wijzigPlekVorm(bestaand, vorm);
    if (!plek) return NextResponse.json({ error: 'Deze plek bestaat niet meer of is ondertussen veranderd.' }, { status: 404 });
    return NextResponse.json({ plek });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const body = await request.json() as { id?: unknown };
    const id = typeof body.id === 'string' ? body.id : '';

    const metadata = await plekMetadata(id);
    if (!metadata) {
      return NextResponse.json({ error: 'Deze plek bestaat niet meer.' }, { status: 404 });
    }
    if (metadata.vast && metadata.soort !== 'bak') {
      return NextResponse.json({ error: 'Alleen plantenbakken kunnen worden verwijderd.' }, { status: 400 });
    }
    const beplanting = await leesBeplanting();
    if ((beplanting[id] || []).length > 0) {
      return NextResponse.json({ error: 'Haal eerst alle planten van deze plek.' }, { status: 409 });
    }
    await verwijderPlek(id, metadata.vast);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Verwijderen mislukt.' }, { status: 500 });
  }
}
