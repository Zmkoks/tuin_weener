import type { Afbeelding, Plant } from '@/app/data/plantTypes';

/**
 * Het formulier van een plantenpaspoort nakijken en omzetten naar een `Plant`.
 * Gedeeld door het toevoegen (POST /api/planten) en het wijzigen (PUT /api/planten/…),
 * zodat een nieuwe en een gewijzigde plant precies dezelfde regels volgen.
 */

export const MAANDEN = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
export const FUNCTIES = ['fruit', 'kruid', 'insecten', 'vogel', 'sier', 'boom', 'onkruid'];
const MAANDVELDEN = ['oogstTijd', 'extraOogstTijd', 'snoeiTijd', 'groei', 'bloei', 'sterf'];

export function tekst(body: Record<string, unknown>, sleutel: string) {
  const waarde = body[sleutel];
  return typeof waarde === 'string' || typeof waarde === 'number' ? String(waarde).trim() : '';
}

export function lijst(body: Record<string, unknown>, sleutel: string) {
  const waarde = body[sleutel];
  if (Array.isArray(waarde)) return [...new Set(waarde.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))];
  if (typeof waarde === 'string') return [...new Set(waarde.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))];
  return [];
}

/** Leest een bewuste ja/nee-keuze. Ontbreken betekent: nog niet beoordeeld. */
function keuze(body: Record<string, unknown>, sleutel: string, terugval: boolean | null = null) {
  if (!(sleutel in body)) return terugval;
  const waarde = body[sleutel];
  if (waarde === true || waarde === 1 || waarde === '1' || waarde === 'ja') return true;
  if (waarde === false || waarde === 0 || waarde === '0' || waarde === 'nee') return false;
  return null;
}

export function slugVan(waarde: string) {
  return waarde.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function volgendPlantnummer(planten: Plant[]) {
  const nummers = planten.map((plant) => Number.parseInt(plant.plantnummer, 10)).filter(Number.isFinite);
  return String((nummers.length ? Math.max(...nummers) : 0) + 1);
}

/**
 * Een foto of illustratie uit het verzoek. De sleutel wijst naar de bestandsopslag en
 * wordt daar gemaakt (POST /api/media), dus die nemen we over zoals hij binnenkomt; de
 * afstelling wordt wel binnen zijn grenzen gehouden.
 */
function leesAfbeelding(waarde: unknown): Afbeelding | undefined {
  if (!waarde || typeof waarde !== 'object' || Array.isArray(waarde)) return undefined;
  const veld = waarde as Record<string, unknown>;
  const getal = (sleutel: string, laag: number, hoog: number, terugval: number) => {
    const nummer = Number(veld[sleutel]);
    return Number.isFinite(nummer) ? Math.min(hoog, Math.max(laag, nummer)) : terugval;
  };
  const afbeelding: Afbeelding = {
    bestand: tekst(veld, 'bestand').slice(0, 200),
    bron: tekst(veld, 'bron'),
    x: getal('x', 0, 100, 50),
    y: getal('y', 0, 100, 50),
    zoom: getal('zoom', 0.25, 2.5, 1),
  };
  // Een expliciet lege bron blijft leeg; anders zou een oude Commons-link terugkomen.
  return afbeelding;
}

/**
 * De aangevinkte kaartsymbolen. Ontbreekt het veld, dan blijft het weg en gelden alle
 * varianten uit `planten_symbolen.svg`; dat is ook de toestand van elke plant die hier
 * nooit is aangepast.
 */
function leesSymbolen(waarde: unknown) {
  if (!waarde || typeof waarde !== 'object' || Array.isArray(waarde)) return undefined;
  const veld = waarde as Record<string, unknown>;

  const bibliotheek = Array.isArray(veld.bibliotheek)
    ? [...new Set(veld.bibliotheek.filter((naam): naam is string => typeof naam === 'string' && /^plant-[a-z0-9-]+$/.test(naam)))]
    : [];

  const eigen = Array.isArray(veld.eigen)
    ? veld.eigen.flatMap((regel) => {
        if (!regel || typeof regel !== 'object') return [];
        const item = regel as Record<string, unknown>;
        const bestand = tekst(item, 'bestand').slice(0, 200);
        return bestand ? [{ bestand, bron: tekst(item, 'bron') }] : [];
      })
    : [];

  return { bibliotheek, eigen };
}

/** Leest de velden uit een verzoek. Geeft óf een plant, óf een leesbare foutmelding. */
export function leesPlant(raw: unknown, slug: string, standaardNummer: string, huidige?: Plant): { plant: Plant } | { fout: string; status: number } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { fout: 'De plantgegevens zijn niet geldig.', status: 400 };
  const body = raw as Record<string, unknown>;

  const naam = tekst(body, 'naam');
  const botanischeNaam = tekst(body, 'botanischeNaam');
  const intro = tekst(body, 'intro');
  if (!naam || !botanischeNaam || !intro) return { fout: 'Vul minimaal naam, botanische naam en introductie in.', status: 400 };

  const groepen = body.functies;
  if (!groepen || typeof groepen !== 'object' || Array.isArray(groepen)) return { fout: 'Geef primaire en secundaire functies afzonderlijk op.', status: 400 };
  const functies = { primair: lijst(groepen as Record<string, unknown>, 'primair'), secundair: lijst(groepen as Record<string, unknown>, 'secundair') };
  if (functies.primair.length < 1 || functies.primair.length > 2) return { fout: 'Kies één of maximaal twee primaire functies.', status: 400 };
  if (functies.secundair.some(f => functies.primair.includes(f))) return { fout: 'Een functie mag niet tegelijk primair en secundair zijn.', status: 400 };
  const onbekendeFunctie = [...functies.primair, ...functies.secundair].find((waarde) => !FUNCTIES.includes(waarde));
  if (onbekendeFunctie) return { fout: `Onbekend plantlabel: ${onbekendeFunctie}. Gebruik een van de voorgestelde labels.`, status: 400 };

  for (const veld of MAANDVELDEN) {
    const onbekendeMaand = lijst(body, veld).find((waarde) => !MAANDEN.includes(waarde));
    if (onbekendeMaand) return { fout: `Onbekende maand bij ${veld}: ${onbekendeMaand}.`, status: 400 };
  }

  return {
    plant: {
      slug,
      naam,
      botanischeNaam,
      plantnummer: tekst(body, 'plantnummer') || standaardNummer,
      functies,
      // Het formulier krijgt deze velden in een volgende stap. Tot die tijd bewaart een
      // wijziging van een bestaande plant de databasewaarden in plaats van ze te wissen.
      eetbaar: keuze(body, 'eetbaar', huidige?.eetbaar ?? null),
      eetbaarInfo: 'eetbaarInfo' in body ? tekst(body, 'eetbaarInfo') : huidige?.eetbaarInfo ?? '',
      oogstbaarInTuin: keuze(body, 'oogstbaarInTuin', huidige?.oogstbaarInTuin ?? null),
      tuinOpmerking: 'tuinOpmerking' in body ? tekst(body, 'tuinOpmerking') : huidige?.tuinOpmerking ?? '',
      boomHeester: keuze(body, 'boomHeester', huidige?.boomHeester ?? false) ?? false,
      gevaarlijk: keuze(body, 'gevaarlijk', huidige?.gevaarlijk ?? null),
      gevaarlijkInfo: 'gevaarlijkInfo' in body ? tekst(body, 'gevaarlijkInfo') : huidige?.gevaarlijkInfo ?? '',
      waaromLatenStaan: 'waaromLatenStaan' in body ? tekst(body, 'waaromLatenStaan') : huidige?.waaromLatenStaan ?? '',
      intro,
      weetje: tekst(body, 'weetje'),
      waterOndergrens: tekst(body, 'waterOndergrens') || '1',
      waterBovengrens: tekst(body, 'waterBovengrens') || '3',
      waterInfo: tekst(body, 'waterInfo'),
      zon: tekst(body, 'zon') || 'zon',
      zonInfo: tekst(body, 'zonInfo'),
      levensduur: tekst(body, 'levensduur') || 'Meerjarig',
      oogstTijd: lijst(body, 'oogstTijd'),
      oogstMethode: tekst(body, 'oogstMethode'),
      extraOogstTijd: lijst(body, 'extraOogstTijd'),
      extraOogstMethode: tekst(body, 'extraOogstMethode'),
      snoeiTijd: lijst(body, 'snoeiTijd'),
      snoeiTijdInfo: tekst(body, 'snoeiTijdInfo'),
      snoeiMethode: tekst(body, 'snoeiMethode'),
      snoeiInformatie: tekst(body, 'snoeiInformatie'),
      woekerToestemming: tekst(body, 'woekerToestemming'),
      woekerVerbod: tekst(body, 'woekerVerbod'),
      groei: lijst(body, 'groei'),
      bloei: lijst(body, 'bloei'),
      sterf: lijst(body, 'sterf'),
      commons: tekst(body, 'commons'),
      commonsIllustraties: tekst(body, 'commonsIllustraties'),
      foto: leesAfbeelding(body.foto),
      illustratie: leesAfbeelding(body.illustratie),
      symbolen: leesSymbolen(body.symbolen),
    },
  };
}
