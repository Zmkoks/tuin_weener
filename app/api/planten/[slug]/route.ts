import { NextResponse } from 'next/server';
import { leesPlant } from '@/app/lib/plantInvoer';
import { bewaarPlant, leesPlant as haalPlant, verwijderPlant } from '@/db/planten';
import { geldigeSessie } from '@/app/lib/auth';

type Props = { params: Promise<{ slug: string }> };

export async function DELETE(request: Request, { params }: Props) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const slug = decodeURIComponent((await params).slug);
    if (!await haalPlant(slug)) return NextResponse.json({ error: 'Deze plant staat niet in de bibliotheek.' }, { status: 404 });
    await verwijderPlant(slug);
    return NextResponse.json({ verwijderd: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Verwijderen mislukt.' }, { status: 500 });
  }
}

/**
 * Het paspoort van een bestaande plant bijwerken. De slug blijft staan, ook als de naam
 * verandert: hij zit in de adressen van de plantenpagina's en in de QR-codes op de bordjes.
 */
export async function PUT(request: Request, { params }: Props) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const slug = decodeURIComponent((await params).slug);
    const huidige = await haalPlant(slug);
    if (!huidige) return NextResponse.json({ error: 'Deze plant staat niet in de bibliotheek.' }, { status: 404 });

    const gelezen = leesPlant(await request.json() as unknown, slug, huidige.plantnummer, huidige);
    if ('fout' in gelezen) return NextResponse.json({ error: gelezen.fout }, { status: gelezen.status });

    await bewaarPlant(gelezen.plant);
    return NextResponse.json({ plant: gelezen.plant });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}
