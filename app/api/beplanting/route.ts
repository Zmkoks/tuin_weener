import { NextResponse } from 'next/server';
import plants from '@/app/data/planten.json';
import zones from '@/app/data/tuin.json';
import { readPlacements, replaceZonePlants } from '@/db/garden';

const validZones = new Set(zones.map((zone) => zone.id));
const validPlants = new Set(plants.map((plant) => plant.slug));

export async function GET() {
  try {
    return NextResponse.json({ placements: await readPlacements() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Laden mislukt.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { zoneId?: unknown; plantSlugs?: unknown };
    if (typeof body.zoneId !== 'string' || !validZones.has(body.zoneId)) {
      return NextResponse.json({ error: 'Deze tuinplek bestaat niet.' }, { status: 400 });
    }
    if (!Array.isArray(body.plantSlugs) || body.plantSlugs.some((slug) => typeof slug !== 'string' || !validPlants.has(slug))) {
      return NextResponse.json({ error: 'De plantenlijst bevat een onbekende plant.' }, { status: 400 });
    }
    const uniqueSlugs = [...new Set(body.plantSlugs as string[])];
    const result = await replaceZonePlants(body.zoneId, uniqueSlugs);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}
