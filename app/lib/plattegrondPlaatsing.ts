import type { Plant } from '@/app/data/plantTypes';
import type { Vorm } from '@/app/data/plekTypes';

export type KaartZone = {
  id: string;
  soort: string;
  planten?: string[];
  vorm: Vorm;
};

/** Een tekening die op de kaart op een plek wordt gezet. Maten zijn millimeters. */
export type KaartPlant = {
  id: string;
  plantSlug: string;
  symbool?: string;
  verhouding: number;
  hoogte: number;
  x: number;
  y: number;
  schaal: number;
  spiegel: boolean;
  scheef: number;
  kleur: string;
};

export type KaartSymbool = { id: string; verhouding: number };

const BLAD_B = 210;
const BLAD_H = 297;
const KAART_SCHAAL = 0.6;
const DEEL_VAN_BAK = 0.33;
const MARGE = 5;
const MIN_PLANTEN = 3;

const PLANTHOOGTE: Record<string, number> = {
  bieslook: 16.5,
  tijm: 8.5,
  lavendel: 13.8,
  citroenmelisse: 16.1,
  venkel: 13.3,
  rozemarijn: 13,
  marjolein: 18.2,
  salie: 16,
  munt: 19.3,
  dragon: 18,
  aardbei: 16.8,
  'edel-duizendblad': 19,
  teunisbloem: 25.8,
  knopherik: 25.5,
  bosbes: 20.1,
  framboos: 22.7,
  'rode-bes': 23,
  'zwarte-bes': 21.4,
  kiwi: 18,
};

const KLEUREN = ['#4a7c3f', '#5f9e4a', '#7ab55c', '#3d6b34', '#68a353', '#8cc16d'];

const LIGGEND: Array<[number, number]> = [
  [0.5, 0.5],
  [0.16, 0.72],
  [0.84, 0.94],
  [0.5, 0.96],
];

const STAAND: Array<[number, number]> = [
  [0.28, 0.34],
  [0.78, 0.6],
  [0.24, 0.9],
  [0.72, 0.96],
];

function hoogteVan(slug: string) {
  return PLANTHOOGTE[slug] ?? 18;
}

function vormKader(vorm: Vorm): [number, number, number, number] {
  if (vorm.type === 'rect') return [vorm.x ?? 0, vorm.y ?? 0, (vorm.x ?? 0) + (vorm.b ?? 0), (vorm.y ?? 0) + (vorm.h ?? 0)];
  if (vorm.type === 'ellipse') return [(vorm.cx ?? 0) - (vorm.rx ?? 0), (vorm.cy ?? 0) - (vorm.ry ?? 0), (vorm.cx ?? 0) + (vorm.rx ?? 0), (vorm.cy ?? 0) + (vorm.ry ?? 0)];
  const x = vorm.x ?? 0;
  const y = vorm.y ?? 0;
  return [x, y, x, y];
}

function oppervlak(vorm: Vorm) {
  if (vorm.type === 'rect') return (vorm.b ?? 0) * (vorm.h ?? 0);
  if (vorm.type === 'ellipse') return Math.PI * (vorm.rx ?? 0) * (vorm.ry ?? 0);
  return 0;
}

function binnen(vorm: Vorm, x: number, y: number, krimp = 0) {
  if (vorm.type === 'rect') {
    return x >= (vorm.x ?? 0) + krimp
      && x <= (vorm.x ?? 0) + (vorm.b ?? 0) - krimp
      && y >= (vorm.y ?? 0) + krimp
      && y <= (vorm.y ?? 0) + (vorm.h ?? 0) - krimp;
  }
  if (vorm.type === 'ellipse') {
    const rx = Math.max((vorm.rx ?? 0) - krimp, 0.1);
    const ry = Math.max((vorm.ry ?? 0) - krimp, 0.1);
    return ((x - (vorm.cx ?? 0)) / rx) ** 2 + ((y - (vorm.cy ?? 0)) / ry) ** 2 <= 1;
  }
  return false;
}

function maakToeval(seed: string) {
  let waarde = 2166136261;
  for (const teken of seed) {
    waarde ^= teken.charCodeAt(0);
    waarde = Math.imul(waarde, 16777619);
  }
  return () => {
    waarde += waarde << 13;
    waarde ^= waarde >>> 7;
    waarde += waarde << 3;
    waarde ^= waarde >>> 17;
    waarde += waarde << 5;
    return (waarde >>> 0) / 4294967296;
  };
}

function voetafdruk(x: number, y: number, hoogte: number, breedte: number): [number, number, number, number] {
  return [x - breedte / 2, y - hoogte, x + breedte / 2, y];
}

function overlapt(a: [number, number, number, number], b: [number, number, number, number]) {
  return Math.min(a[2], b[2]) > Math.max(a[0], b[0]) && Math.min(a[3], b[3]) > Math.max(a[1], b[1]);
}

function verdeelSoorten(slugs: string[], aantal: number) {
  const opHoogte = [...new Set(slugs)].sort((a, b) => hoogteVan(b) - hoogteVan(a));
  const blikvanger = opHoogte[0];
  const rest = [...opHoogte.slice(1)].sort((a, b) => hoogteVan(a) - hoogteVan(b));
  const vullingBron = rest.length ? rest : [blikvanger];
  const vulling = Array.from({ length: Math.max(0, aantal - 1) }, (_, i) => vullingBron[i % vullingBron.length]);
  vulling.sort((a, b) => hoogteVan(b) - hoogteVan(a));
  return [blikvanger, ...vulling];
}

function aantalPlanten(vorm: Vorm, soorten: string[]) {
  void vorm;
  return Math.max(MIN_PLANTEN, new Set(soorten).size);
}

function symboolVoor(plant: Plant, catalogus: KaartSymbool[]) {
  const keuze = plant.symbolen?.bibliotheek;
  const toegestaan = keuze == null ? catalogus : catalogus.filter(({ id }) => keuze.includes(id));
  const eigen = (plant.symbolen?.eigen ?? []).map((bestand, index) => ({
    id: `plant-${plant.slug}-eigen${index + 1}`,
    verhouding: 1,
    bestand: bestand.bestand,
  }));
  return [...toegestaan, ...eigen];
}

function plantKleur(plants: Plant[], slug: string) {
  const index = plants.findIndex((plant) => plant.slug === slug);
  return KLEUREN[(index < 0 ? 0 : index) % KLEUREN.length];
}

function zonderOverlap(
  vorm: Vorm,
  volgorde: string[],
  afmetingen: Map<string, { hoogte: number; breedte: number }>,
  toeval: () => number,
) {
  const [x0, y0, x1, y1] = vormKader(vorm);
  const punten: Array<[number, number]> = [];
  const vakken: Array<[number, number, number, number]> = [];

  for (const slug of volgorde) {
    const afmeting = afmetingen.get(slug);
    if (!afmeting) continue;
    let beste: [number, number] | null = null;
    let meesteRuimte = Number.NEGATIVE_INFINITY;
    for (let poging = 0; poging < 400; poging += 1) {
      const x = x0 + toeval() * (x1 - x0);
      const y = y0 + toeval() * (y1 - y0);
      if (!binnen(vorm, x, y)) continue;
      const vak = voetafdruk(x, y, afmeting.hoogte, afmeting.breedte);
      if (vakken.some((ander) => overlapt(vak, ander))) continue;
      const ruimte = punten.length
        ? Math.min(...punten.map(([px]) => Math.abs(x - px)))
        : Number.POSITIVE_INFINITY;
      if (ruimte > meesteRuimte) {
        meesteRuimte = ruimte;
        beste = [x, y];
      }
    }
    if (beste) {
      punten.push(beste);
      vakken.push(voetafdruk(beste[0], beste[1], afmeting.hoogte, afmeting.breedte));
    }
  }
  return punten;
}

/**
 * Zet de actuele beplanting om in stabiele planttekeningen. De uitgangspunten zijn bewust
 * dezelfde als in `test_plattegrond.py`: drie exemplaren als minimum, de grootste plant als
 * blikvanger, en een eigen zaaisel per plek. De exacte toevalsvolgorde mag in JavaScript
 * verschillen; na een nieuwe render blijft deze kaart wel hetzelfde.
 */
export function berekenPlantPlaatsingen(
  zones: KaartZone[],
  plants: Plant[],
  placements: Record<string, string[]>,
  symbolen: Record<string, KaartSymbool[]>,
  seed = 1,
): KaartPlant[] {
  const perSlug = new Map(plants.map((plant) => [plant.slug, plant]));
  const uitkomst: KaartPlant[] = [];

  zones.forEach((zone, zoneIndex) => {
    const vorm = zone.vorm;
    if (vorm.type === 'punt') return;
    const slugs = (placements[zone.id] ?? zone.planten ?? []).filter((slug) => perSlug.has(slug));
    if (!slugs?.length) return;

    const toeval = maakToeval(`${seed}:${zone.id}`);
    const volgorde = verdeelSoorten(slugs, aantalPlanten(vorm, slugs));
    const eerste = perSlug.get(volgorde[0]);
    if (!eerste) return;

    const symboolVan = new Map<string, KaartSymbool | undefined>();
    for (const slug of new Set(volgorde)) {
      const plant = perSlug.get(slug);
      const opties = plant ? symboolVoor(plant, symbolen[slug] ?? []) : [];
      symboolVan.set(slug, opties.length ? opties[Math.floor(toeval() * opties.length)] : undefined);
    }

    const blikvanger = symboolVan.get(eerste.slug);
    const verhouding = blikvanger?.verhouding ?? 0.8;
    const factor = Math.sqrt((oppervlak(vorm) * DEEL_VAN_BAK) / Math.max(verhouding, 0.05)) / Math.max(hoogteVan(eerste.slug), 0.1);
    const afmetingen = new Map<string, { hoogte: number; breedte: number }>();
    for (const slug of new Set(volgorde)) {
      const gekozen = symboolVan.get(slug);
      const hoogte = hoogteVan(slug) * factor;
      afmetingen.set(slug, { hoogte, breedte: hoogte * (gekozen?.verhouding ?? 0.55) });
    }

    let punten: Array<[number, number]>;
    if (zone.soort === 'vrij') {
      punten = zonderOverlap(vorm, volgorde, afmetingen, toeval);
    } else {
      const [x0, y0, x1, y1] = vormKader(vorm);
      const breedte = x1 - x0;
      const hoogte = y1 - y0;
      const opstelling = hoogte > breedte ? STAAND : LIGGEND;
      punten = Array.from({ length: volgorde.length }, (_, index) => {
        const [fx, fy] = opstelling[Math.min(index, opstelling.length - 1)];
        const afmeting = afmetingen.get(volgorde[index]);
        let x = x0 + fx * breedte;
        let y = y0 + fy * hoogte;
        if (index === 0 && hoogte <= breedte && afmeting) y += afmeting.hoogte / 2;
        if (afmeting) {
          x = Math.min(Math.max(x, afmeting.breedte / 2 + MARGE), BLAD_B - afmeting.breedte / 2 - MARGE);
          y = Math.min(Math.max(y, afmeting.hoogte + MARGE), BLAD_H - MARGE);
        }
        return [x, y];
      });
    }

    punten.forEach(([x, y], index) => {
      const slug = volgorde[index];
      const plant = perSlug.get(slug);
      if (!plant) return;
      const afmeting = afmetingen.get(slug);
      const symbool = symboolVan.get(slug);
      if (!afmeting) return;
      const spiegel = toeval() < 0.5;
      const scheef = Math.round((-3 + toeval() * 6) * 10) / 10;
      uitkomst.push({
        id: `${zone.id}-${zoneIndex}-${index}`,
        plantSlug: slug,
        symbool: symbool?.id,
        verhouding: symbool?.verhouding ?? 0.55,
        // `test_plattegrond.py` gebruikt voor het tekenen de opgeslagen schaal maal de
        // vaste plantmaat; de maat zonder die kaart-schaal hierboven is alleen voor de
        // plaatsing en het afklemmen aan de rand.
        hoogte: hoogteVan(slug) * (factor / Math.max(KAART_SCHAAL, 0.0001)),
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        schaal: Math.round((factor / Math.max(KAART_SCHAAL, 0.0001)) * 10000) / 10000,
        spiegel,
        scheef,
        kleur: plantKleur(plants, slug),
      });
    });
  });

  return uitkomst.sort((a, b) => a.y - b.y);
}
