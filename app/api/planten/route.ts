import { NextResponse } from 'next/server';
import staticPlants from '@/app/data/planten.json';
import { leesPlant, slugVan, tekst, volgendPlantnummer } from '@/app/lib/plantInvoer';
import { createCustomPlant, readAllPlants } from '@/db/plants';
import { geldigeSessie } from '@/app/lib/auth';

export async function GET() {
  try {
    return NextResponse.json({ plants: await readAllPlants() });
  } catch (error) {
    return NextResponse.json({ plants: staticPlants, error: error instanceof Error ? error.message : 'Laden mislukt.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const raw = await request.json() as unknown;
    const naam = raw && typeof raw === 'object' ? tekst(raw as Record<string, unknown>, 'naam') : '';
    const slug = slugVan(naam);
    if (!slug) return NextResponse.json({ error: 'Vul eerst een plantnaam in.' }, { status: 400 });

    const bestaande = await readAllPlants();
    if (bestaande.some((plant) => plant.slug === slug)) {
      return NextResponse.json({ error: 'Deze plant staat al in de plantenbibliotheek.' }, { status: 409 });
    }

    const gelezen = leesPlant(raw, slug, volgendPlantnummer(bestaande));
    if ('fout' in gelezen) return NextResponse.json({ error: gelezen.fout }, { status: gelezen.status });

    await createCustomPlant(gelezen.plant);
    return NextResponse.json({ plant: gelezen.plant }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}
