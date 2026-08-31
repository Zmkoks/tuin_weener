import { NextResponse } from 'next/server';
import staticPlants from '@/app/data/planten.json';
import type { Plant } from '@/app/data/plantTypes';
import { createCustomPlant, readAllPlants } from '@/db/plants';

const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const FUNCTIONS = ['fruit', 'kruid', 'insecten', 'vogel', 'sier', 'boom', 'onkruid'];

function text(body: Record<string, unknown>, key: string) {
  return typeof body[key] === 'string' || typeof body[key] === 'number' ? String(body[key]).trim() : '';
}

function list(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (Array.isArray(value)) return [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))];
  if (typeof value === 'string') return [...new Set(value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))];
  return [];
}

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function nextPlantNumber(plants: Plant[]) {
  const numbers = plants.map((plant) => Number.parseInt(plant.plantnummer, 10)).filter(Number.isFinite);
  return String((numbers.length ? Math.max(...numbers) : 0) + 1);
}

export async function GET() {
  try {
    return NextResponse.json({ plants: await readAllPlants() });
  } catch (error) {
    return NextResponse.json({ plants: staticPlants, error: error instanceof Error ? error.message : 'Laden mislukt.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.json() as unknown;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return NextResponse.json({ error: 'De plantgegevens zijn niet geldig.' }, { status: 400 });
    const body = raw as Record<string, unknown>;
    const naam = text(body, 'naam');
    const botanischeNaam = text(body, 'botanischeNaam');
    const intro = text(body, 'intro');
    if (!naam || !botanischeNaam || !intro) return NextResponse.json({ error: 'Vul minimaal naam, botanische naam en introductie in.' }, { status: 400 });

    const functies = list(body, 'functies');
    const invalidFunction = functies.find((value) => !FUNCTIONS.includes(value));
    if (invalidFunction) return NextResponse.json({ error: `Onbekend plantlabel: ${invalidFunction}. Gebruik een van de voorgestelde labels.` }, { status: 400 });
    const monthFields = ['oogstTijd', 'extraOogstTijd', 'snoeiTijd', 'groei', 'bloei', 'sterf'];
    for (const field of monthFields) {
      const invalidMonth = list(body, field).find((value) => !MONTHS.includes(value));
      if (invalidMonth) return NextResponse.json({ error: `Onbekende maand bij ${field}: ${invalidMonth}.` }, { status: 400 });
    }

    const existingPlants = await readAllPlants();
    const slug = slugify(naam);
    if (!slug) return NextResponse.json({ error: 'De plantnaam kan geen bruikbare slug opleveren.' }, { status: 400 });
    if (existingPlants.some((plant) => plant.slug === slug)) return NextResponse.json({ error: 'Deze plant staat al in de plantenbibliotheek.' }, { status: 409 });

    const plant: Plant = {
      slug,
      naam,
      botanischeNaam,
      plantnummer: text(body, 'plantnummer') || nextPlantNumber(existingPlants),
      functies,
      intro,
      weetje: text(body, 'weetje'),
      waterOndergrens: text(body, 'waterOndergrens') || '1',
      waterBovengrens: text(body, 'waterBovengrens') || '3',
      waterInfo: text(body, 'waterInfo'),
      zon: text(body, 'zon') || 'zon',
      zonInfo: text(body, 'zonInfo'),
      levensduur: text(body, 'levensduur') || 'Meerjarig',
      oogstTijd: list(body, 'oogstTijd'),
      oogstMethode: text(body, 'oogstMethode'),
      extraOogstTijd: list(body, 'extraOogstTijd'),
      extraOogstMethode: text(body, 'extraOogstMethode'),
      snoeiTijd: list(body, 'snoeiTijd'),
      snoeiTijdInfo: text(body, 'snoeiTijdInfo'),
      snoeiMethode: text(body, 'snoeiMethode'),
      snoeiInformatie: text(body, 'snoeiInformatie'),
      woekerToestemming: text(body, 'woekerToestemming'),
      woekerVerbod: text(body, 'woekerVerbod'),
      groei: list(body, 'groei'),
      bloei: list(body, 'bloei'),
      sterf: list(body, 'sterf'),
      commons: text(body, 'commons'),
    };
    await createCustomPlant(plant);
    return NextResponse.json({ plant }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Opslaan mislukt.' }, { status: 500 });
  }
}
