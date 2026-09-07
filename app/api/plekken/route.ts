import { NextResponse } from 'next/server';
import type { Plek } from '@/app/data/plekTypes';
import { laadZones, vasteZones } from '@/app/lib/tuinData';
import { readPlacements } from '@/db/garden';
import { createCustomZone, deleteCustomZone, readCustomZones } from '@/db/zones';
import { geldigeSessie } from '@/app/lib/auth';

/** De kaart is A4 staand in millimeters; buiten dat vel kan geen plek liggen. */
const BREEDTE = 210;
const HOOGTE = 297;

export async function GET() {
  try {
    return NextResponse.json({ plekken: await laadZones() });
  } catch (error) {
    return NextResponse.json({ plekken: vasteZones, error: error instanceof Error ? error.message : 'Laden mislukt.' }, { status: 500 });
  }
}

/**
 * Een plek bijmaken op het punt dat iemand op de kaart heeft aangewezen. Meer dan een
 * punt kun je met één klik niet aanwijzen; vakken met een vorm blijven uit `tuin.json`
 * komen, want daar tekent het drukwerk mee.
 */
export async function POST(request: Request) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const body = await request.json() as { x?: unknown; y?: unknown };
    const x = Number(body.x);
    const y = Number(body.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > BREEDTE || y < 0 || y > HOOGTE) {
      return NextResponse.json({ error: 'Deze plek ligt buiten de plattegrond.' }, { status: 400 });
    }

    const bestaande = await readCustomZones();
    const nummer = bestaande.length + 1;
    const plek: Plek = {
      id: `eigen-${String(nummer).padStart(2, '0')}`,
      label: '',
      soort: 'vrij',
      badge: { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 },
      planten: [],
      vorm: { type: 'punt', x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 },
      svg_label: '',
    };
    await createCustomZone(plek);
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
    const eigen = await readCustomZones();
    if (!eigen.some((plek) => plek.id === id)) {
      return NextResponse.json({ error: 'Deze plek is niet op de site bijgemaakt en blijft staan.' }, { status: 400 });
    }
    const beplanting = await readPlacements();
    if ((beplanting[id] || []).length > 0) {
      return NextResponse.json({ error: 'Op deze plek staat nog een plant.' }, { status: 409 });
    }
    await deleteCustomZone(id);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Verwijderen mislukt.' }, { status: 500 });
  }
}
