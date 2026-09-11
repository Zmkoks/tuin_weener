import { NextResponse } from 'next/server';
import type { Plek, Vorm } from '@/app/data/plekTypes';
import { laadZones, vasteZones } from '@/app/lib/tuinData';
import { leesBeplanting } from '@/db/beplanting';
import { volgendBijgemaaktNummer, volgendPlekNummer, plekMetadata, maakPlek, verwijderPlek } from '@/db/plekken';
import { geldigeSessie } from '@/app/lib/auth';

/** De kaart is A4 staand in millimeters; buiten dat vel kan geen plek liggen. */
const BREEDTE = 210;
const HOOGTE = 297;
const MIN_BAKMAAT = 5;

const rond = (waarde: number) => Math.round(waarde * 100) / 100;

function nieuwePlek(vorm: Vorm, nummer: number, soort: 'bak' | 'vrij', label: string): Plek {
  const x = vorm.type === 'rect' ? (vorm.x ?? 0) + (vorm.b ?? 0) / 2 : vorm.cx ?? vorm.x ?? 0;
  const y = vorm.type === 'rect' ? (vorm.y ?? 0) + (vorm.h ?? 0) / 2 : vorm.cy ?? vorm.y ?? 0;
  const badgeY = vorm.type === 'rect'
    ? (vorm.y ?? 0) + (vorm.h ?? 0) - Math.min(3.2, Math.max(1, (vorm.h ?? 0) / 4))
    : vorm.type === 'ellipse'
      ? soort === 'bak'
        ? (vorm.cy ?? 0) + (vorm.ry ?? 0)
        : (vorm.cy ?? 0) + (vorm.ry ?? 0) - Math.min(3.2, Math.max(1, (vorm.ry ?? 0) / 4))
      : y;
  return {
    id: `eigen-${String(nummer).padStart(2, '0')}`,
    label,
    soort,
    badge: { x: rond(x), y: rond(badgeY) },
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
      if (!body.vorm || typeof body.vorm !== 'object') {
        return NextResponse.json({ error: 'De vorm van het plantvak ontbreekt.' }, { status: 400 });
      }
      const invoer = body.vorm as Record<string, unknown>;
      const soort = body.soort === undefined ? 'bak' : body.soort === 'vrij' ? 'vrij' : body.soort === 'bak' ? 'bak' : null;
      if (!soort) return NextResponse.json({ error: 'Kies eerst of dit een bak is.' }, { status: 400 });
      if (invoer.type === 'rect') {
        const x = Number(invoer.x);
        const y = Number(invoer.y);
        const b = Number(invoer.b);
        const h = Number(invoer.h);
        if (soort !== 'bak' || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(b) || !Number.isFinite(h)
          || b < MIN_BAKMAAT || h < MIN_BAKMAAT || x < 0 || y < 0 || x + b > BREEDTE || y + h > HOOGTE) {
          return NextResponse.json({ error: soort === 'vrij' ? 'Een vrije plek teken je als ovaal.' : 'De rechthoekige plantenbak moet binnen de plattegrond vallen en minstens 5 mm groot zijn.' }, { status: 400 });
        }
        plek = nieuwePlek({ type: 'rect', x: rond(x), y: rond(y), b: rond(b), h: rond(h) }, nummer, soort, label);
      } else if (invoer.type === 'ellipse') {
        const cx = Number(invoer.cx);
        const cy = Number(invoer.cy);
        const rx = Number(invoer.rx);
        const ry = Number(invoer.ry);
        const straal = (rx + ry) / 2;
        if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(rx) || !Number.isFinite(ry)
          || rx <= 0 || ry <= 0 || (soort === 'bak' && Math.abs(rx - ry) > 0.02)
          || rx * 2 < MIN_BAKMAAT || ry * 2 < MIN_BAKMAAT
          || cx - rx < 0 || cy - ry < 0 || cx + rx > BREEDTE || cy + ry > HOOGTE) {
          return NextResponse.json({ error: soort === 'vrij' ? 'De ovale plek moet binnen de plattegrond vallen en minstens 5 mm breed en hoog zijn.' : 'De cirkel moet binnen de plattegrond vallen en minstens 5 mm doorsnee zijn.' }, { status: 400 });
        }
        plek = nieuwePlek({ type: 'ellipse', cx: rond(cx), cy: rond(cy), rx: rond(soort === 'bak' ? straal : rx), ry: rond(soort === 'bak' ? straal : ry) }, nummer, soort, label);
      } else {
        return NextResponse.json({ error: 'Kies een rechthoek, cirkel of ovaal.' }, { status: 400 });
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

/**
 * Een lege plek weghalen. Bijgemaakte plekken en bestaande plantenbakken mogen weg; een
 * bak met planten eerst leegmaken voorkomt dat een koppeling onverwacht verdwijnt.
 */
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
