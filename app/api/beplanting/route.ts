import { NextResponse } from 'next/server';
import { laadZones } from '@/app/lib/tuinData';
import { leesBeplanting, vervangBeplanting } from '@/db/beplanting';
import { leesPlanten } from '@/db/planten';
import { geldigeSessie } from '@/app/lib/auth';

export async function GET() {
  try {
    return NextResponse.json({ placements: await leesBeplanting() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Laden mislukt.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!await geldigeSessie(request)) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  try {
    const body = await request.json() as { zoneId?: unknown; plantSlugs?: unknown };
    const validPlants = new Set((await leesPlanten()).map((plant) => plant.slug));
    const validZones = new Set((await laadZones()).map((zone) => zone.id));
    if (typeof body.zoneId !== 'string' || !validZones.has(body.zoneId)) {
      return NextResponse.json({ error: 'Deze tuinplek bestaat niet.' }, { status: 400 });
    }
    if (!Array.isArray(body.plantSlugs) || body.plantSlugs.some((slug) => typeof slug !== 'string' || !validPlants.has(slug))) {
      return NextResponse.json({ error: 'De plantenlijst bevat een onbekende plant.' }, { status: 400 });
    }
    const uniqueSlugs = [...new Set(body.plantSlugs as string[])];
    const result = await vervangBeplanting(body.zoneId, uniqueSlugs);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}
