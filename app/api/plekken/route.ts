import { NextResponse } from 'next/server';
import type { Plek, Vorm } from '@/app/data/plekTypes';
import { laadZones, vasteZones } from '@/app/lib/tuinData';
import { leesBeplanting } from '@/db/beplanting';
import { volgendBijgemaaktNummer, isBijgemaakt, maakPlek, verwijderPlek } from '@/db/plekken';
import { geldigeSessie } from '@/app/lib/auth';

/** De kaart is A4 staand in millimeters; buiten dat vel kan geen plek liggen. */
const BREEDTE = 210;
const HOOGTE = 297;
const MIN_BAKMAAT = 5;

const rond = (waarde: number) => Math.round(waarde * 100) / 100;

function nieuwePlek(vorm: Vorm, nummer: number): Plek {
  const x = vorm.type === 'rect' ? (vorm.x ?? 0) + (vorm.b ?? 0) / 2 : vorm.cx ?? vorm.x ?? 0;
  const y = vorm.type === 'rect' ? (vorm.y ?? 0) + (vorm.h ?? 0) / 2 : vorm.cy ?? vorm.y ?? 0;
  return {
    id: `eigen-${String(nummer).padStart(2, '0')}`,
    label: '',
    soort: vorm.type === 'punt' ? 'vrij' : 'bak',
    badge: { x: rond(x), y: rond(y) },
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
    const body = await request.json() as { x?: unknown; y?: unknown; vorm?: unknown };
    const nummer = await volgendBijgemaaktNummer();
    let plek: Plek;

    if (body.vorm !== undefined) {
      if (!body.vorm || typeof body.vorm !== 'object') {
        return NextResponse.json({ error: 'De vorm van het plantvak ontbreekt.' }, { status: 400 });
      }
      const invoer = body.vorm as Record<string, unknown>;
      if (invoer.type === 'rect') {
        const x = Number(invoer.x);
        const y = Number(invoer.y);
        const b = Number(invoer.b);
        const h = Number(invoer.h);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(b) || !Number.isFinite(h)
          || b < MIN_BAKMAAT || h < MIN_BAKMAAT || x < 0 || y < 0 || x + b > BREEDTE || y + h > HOOGTE) {
          return NextResponse.json({ error: 'Het rechthoekige plantvak moet binnen de plattegrond vallen en minstens 5 mm groot zijn.' }, { status: 400 });
        }
        plek = nieuwePlek({ type: 'rect', x: rond(x), y: rond(y), b: rond(b), h: rond(h) }, nummer);
      } else if (invoer.type === 'ellipse') {
        const cx = Number(invoer.cx);
        const cy = Number(invoer.cy);
        const rx = Number(invoer.rx);
        const ry = Number(invoer.ry);
        const straal = (rx + ry) / 2;
        if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(rx) || !Number.isFinite(ry)
          || Math.abs(rx - ry) > 0.02 || straal < MIN_BAKMAAT / 2
          || cx - straal < 0 || cy - straal < 0 || cx + straal > BREEDTE || cy + straal > HOOGTE) {
          return NextResponse.json({ error: 'De cirkel moet binnen de plattegrond vallen en minstens 5 mm doorsnee zijn.' }, { status: 400 });
        }
        plek = nieuwePlek({ type: 'ellipse', cx: rond(cx), cy: rond(cy), rx: rond(straal), ry: rond(straal) }, nummer);
      } else {
        return NextResponse.json({ error: 'Kies een rechthoek of cirkel.' }, { status: 400 });
      }
    } else {
      const x = Number(body.x);
      const y = Number(body.y);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > BREEDTE || y < 0 || y > HOOGTE) {
        return NextResponse.json({ error: 'Deze plek ligt buiten de plattegrond.' }, { status: 400 });
      }
      plek = nieuwePlek({ type: 'punt', x: rond(x), y: rond(y) }, nummer);
    }

    await maakPlek(plek);
    return NextResponse.json({ plek }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}

/**
 * Een bijgemaakte plek weghalen. Alleen als hij leeg is: een plek zonder planten is een
 * stip op de kaart waar niets meer staat. De vaste plekken uit `tuin.json` blijven, want
 * daar tekent het drukwerk mee.
 */
export async function DELETE(request: Request) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const body = await request.json() as { id?: unknown };
    const id = typeof body.id === 'string' ? body.id : '';

    if (!await isBijgemaakt(id)) {
      return NextResponse.json({ error: 'Deze plek is niet op de site bijgemaakt en blijft staan.' }, { status: 400 });
    }
    const beplanting = await leesBeplanting();
    if ((beplanting[id] || []).length > 0) {
      return NextResponse.json({ error: 'Op deze plek staat nog een plant.' }, { status: 409 });
    }
    await verwijderPlek(id);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Verwijderen mislukt.' }, { status: 500 });
  }
}
