import { NextResponse } from 'next/server';
import { leesPlant } from '@/app/lib/plantInvoer';
import { readAllPlants, saveCustomPlant } from '@/db/plants';
import { geldigeSessie } from '@/app/lib/auth';

type Props = { params: Promise<{ slug: string }> };

/**
 * Het paspoort van een bestaande plant bijwerken. De slug blijft staan, ook als de naam
 * verandert: hij zit in de adressen van de plantenpagina's en in de QR-codes op de bordjes.
 */
export async function PUT(request: Request, { params }: Props) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const slug = decodeURIComponent((await params).slug);
    const bestaande = await readAllPlants();
    const huidige = bestaande.find((plant) => plant.slug === slug);
    if (!huidige) return NextResponse.json({ error: 'Deze plant staat niet in de bibliotheek.' }, { status: 404 });

    const gelezen = leesPlant(await request.json() as unknown, slug, huidige.plantnummer);
    if ('fout' in gelezen) return NextResponse.json({ error: gelezen.fout }, { status: gelezen.status });

    await saveCustomPlant(gelezen.plant);
    return NextResponse.json({ plant: gelezen.plant });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}
