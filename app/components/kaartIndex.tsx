import type { Plek } from '../data/plekTypes';

/**
 * De nummers op de kaart en de legenda ernaast — de TypeScript-tegenhanger van `badge_svg`
 * en `index_svg` uit `test_plattegrond.py`.
 *
 * Waarom overgezet: de gedrukte kaart komt uit een Python-script dat op een laptop draait.
 * Verandert de beplanting via Beheren, dan liep die tekening achter tot iemand dat script
 * opnieuw uitvoerde. Hier wordt de legenda per verzoek uit de database afgeleid, dus hij
 * klopt altijd — en hij staat in Poppins en Raleway, terwijl een gegenereerd SVG-bestand via
 * `<image>` terugvalt op Arial.
 *
 * Zelfde stelsel als overal (§3): viewBox "0 0 210 297", millimeters op A4 staand. Alle
 * maten hieronder zijn daarom millimeters en overgenomen uit het Python-origineel, zodat
 * scherm en papier hetzelfde beeld geven.
 */

/**
 * Waar de twee kaders staan. Ze staan allebei met hun onderkant op `ONDERKANT` (6 mm van de
 * rand, gelijk aan de marge links) en groeien omhoog naarmate er meer regels zijn.
 *
 * De bovengrenzen zijn gemeten op de wadi in `plattegrond_ondergrond.svg` (14 september 2026):
 * de groene rand loopt als een bocht naar rechtsonder, dus hoe breder het kader, hoe lager
 * zijn bovenkant moet blijven. Bij y = 104 loopt het groen tot x ≈ 93,5 (rechterkant
 * plantvakken 90 + 3 mm marge), bij y = 209 tot x ≈ 134 (rechterkant heesterkader 131 + 3).
 * Verandert de ondergrond, meet dan opnieuw.
 */
const ONDERKANT = 291.0;
const INDEX_X = 6.0;
const INDEX_BREED = 84.0;
const INDEX_BOVENGRENS = 104.0;
/** Het heesterkader is kleiner en staat rechts ernaast. */
const HEESTER_SCHAAL = 0.78;
const HEESTER_BREED = 38.0;
const HEESTER_BOVENGRENS = 209.0;
/** Pas als een kader niet meer tussen bovengrens en onderkant past, krimpt de tekst — tot hier. */
const KRIMP_TOT = 0.8;

/** De grootste schaal (≤ `start`) waarbij het kader in de beschikbare hoogte past. */
function passendeSchaal(kopregels: string[], regels: Regel[], bw: number, start: number, ruimte: number) {
  let f = start;
  while (f > start * KRIMP_TOT && kaderHoogte(kopregels, regels, bw, f) > ruimte) f -= 0.01;
  return f;
}

/** Breekt op woordgrenzen bij een aantal tekens — `_breek` uit het origineel. */
function breek(tekst: string, tekens: number): string[] {
  const regels: string[] = [];
  let huidig = '';
  for (const woord of tekst.split(/\s+/).filter(Boolean)) {
    if (huidig && huidig.length + 1 + woord.length > tekens) {
      regels.push(huidig);
      huidig = woord;
    } else {
      huidig = `${huidig} ${woord}`.trim();
    }
  }
  if (huidig) regels.push(huidig);
  return regels;
}

function hoofdletter(tekst: string) {
  return tekst ? tekst[0].toUpperCase() + tekst.slice(1) : tekst;
}

/**
 * Eén regel in een kader: bolletje met label, en de plantnamen ernaast. `plekId` is de plek
 * die gekozen wordt als je de regel aanklikt; bij een boom of heester is dat de eerste plek
 * met die letter. De andere punten met dezelfde letter lichten mee op (`oplichten` in
 * Scherm.tsx), en de regel blijft gemarkeerd welk van die punten je ook op de kaart kiest.
 */
type Regel = { label: string; tekst: string; plekId?: string };

/** Alleen op het scherm: regels aanklikbaar maken. Op papier blijft de legenda decoratie. */
type Keuze = { gekozen?: string; onKies?: (id: string) => void };

/**
 * Een kader met kop, streepje en regels. Geeft de tekening terug plus zijn hoogte, want die
 * is nodig om het tweede kader onderaan uit te lijnen.
 *
 * De kop is in het origineel krimpend gemaakt (`passende_grootte`/`kop_regels`) omdat hij
 * uit de data kon komen. Hier zijn het twee vaste teksten, dus we geven de regels gewoon
 * mee — dat scheelt het naspelen van een tekstbreedte-berekening in de browser.
 */
function Kader({ kopregels, regels, bx, by, bw, groen = false, f = 1, keuze = {} }: {
  kopregels: string[];
  regels: Regel[];
  bx: number;
  by: number;
  bw: number;
  groen?: boolean;
  f?: number;
  keuze?: Keuze;
}) {
  const { onderdelen, hoogte } = kaderInhoud(kopregels, regels, bx, by, bw, groen, f, keuze);
  const kop = 10.0 * f;
  const kopgrootte = 4.8 * f;
  const extraKop = (kopregels.length - 1) * kopgrootte * 1.25;

  return <g>
    <rect x={bx} y={by} width={bw} height={hoogte} rx={2.5}
      fill="#fff" fillOpacity={0.94} stroke="#1e3a6a" strokeWidth={0.4} />
    {kopregels.map((regel, i) => <text key={regel}
      x={bx + 7 * f} y={by + kop + i * kopgrootte * 1.25}
      fontSize={kopgrootte} fill="#1e3a6a" fontFamily="Raleway, Arial, sans-serif"
      fontWeight={700} letterSpacing={0.4 * f}>{regel}</text>)}
    <line x1={bx + 6 * f} y1={by + kop + extraKop + 2.5}
      x2={bx + bw - 6 * f} y2={by + kop + extraKop + 2.5}
      stroke="#689cd4" strokeWidth={0.4} />
    {onderdelen}
  </g>;
}

/** De regels van een kader plus de hoogte die ze innemen. */
function kaderInhoud(kopregels: string[], regels: Regel[], bx: number, by: number, bw: number, groen: boolean, f: number, keuze: Keuze = {}) {
  const rh = 8.6 * f;
  const kop = 10.0 * f;
  const kopgrootte = 4.8 * f;
  const extraKop = (kopregels.length - 1) * kopgrootte * 1.25;

  const onderdelen: React.ReactNode[] = [];
  let ry = by + kop + extraKop + 8.5 * f;

  for (const { label, tekst, plekId } of regels) {
    const begin = ry;
    const regel: React.ReactNode[] = [];
    const delen = breek(hoofdletter(tekst), Math.round(30 * f));
    delen.forEach((deel, i) => {
      if (i === 0) {
        regel.push(
          <circle key={`b-${label}`} cx={bx + 8.0 * f} cy={ry - 1.3} r={3.6 * f}
            fill={groen ? '#4be16e' : '#fff'} stroke="#1e3a6a" strokeWidth={0.45} />,
          <text key={`l-${label}`} x={bx + 8.0 * f} y={ry - 1.3} fontSize={3.4 * f}
            fill="#1e3a6a" textAnchor="middle" dominantBaseline="central"
            fontFamily="Poppins, Arial, sans-serif" fontWeight={600}>{label}</text>,
        );
      }
      regel.push(
        <text key={`t-${label}-${i}`} x={bx + 15.0 * f} y={ry} fontSize={3.95 * f}
          fill="#1e3a6a" fontFamily="Poppins, Arial, sans-serif">{deel}</text>,
      );
      ry += 4.8 * f;
    });

    const { onKies, gekozen } = keuze;
    if (onKies && plekId) {
      // Het klikvlak loopt van boven het bolletje tot halverwege de ruimte naar de volgende
      // regel, zodat er tussen twee regels geen dode strook zit. Het staat onder de tekst, en
      // is daarmee meteen de lichte achtergrond die laat zien welke regel gekozen is.
      const boven = begin - 5.6 * f;
      const onder = ry - 4.8 * f + (rh - 3.6) / 2 + 2.2 * f;
      const kies = () => onKies(plekId);
      onderdelen.push(<g key={`r-${label}`}
        className={`index-regel${gekozen === plekId ? ' gekozen' : ''}`}
        role="button" tabIndex={0} aria-pressed={gekozen === plekId}
        aria-label={`${label}: ${tekst}`}
        onClick={kies}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); kies(); }
        }}>
        <rect className="index-regel-vlak" x={bx + 2} y={boven} width={bw - 4} height={onder - boven} rx={1.5} />
        {regel}
      </g>);
    } else {
      onderdelen.push(...regel);
    }
    ry += rh - 3.6;
  }

  return { onderdelen, hoogte: ry - by - (rh - 4.8 * f) + 3.5 };
}

/** Alleen de hoogte, om het heesterkader onderaan uit te kunnen lijnen. */
function kaderHoogte(kopregels: string[], regels: Regel[], bw: number, f: number) {
  return kaderInhoud(kopregels, regels, 0, 0, bw, false, f).hoogte;
}

/** Het nummerbolletje bij een plek — `badge_svg` uit het origineel. */
export function Badge({ plek }: { plek: Plek }) {
  const heester = plek.soort === 'heester';
  let { x, y } = plek.badge;
  // Het midden van het nummerrondje ligt op de onderrand: half in de bak, half eronder.
  if (plek.soort === 'bak') {
    const vorm = plek.vorm;
    if (vorm.type === 'rect') {
      x = (vorm.x ?? 0) + (vorm.b ?? 0) / 2;
      y = (vorm.y ?? 0) + (vorm.h ?? 0);
    } else if (vorm.type === 'ellipse') {
      x = vorm.cx ?? x;
      y = (vorm.cy ?? 0) + (vorm.ry ?? 0);
    }
  }
  return <g>
    <circle cx={x} cy={y} r={heester ? 2.6 : 3.1}
      fill={heester ? '#4be16e' : '#fff'} stroke="#1e3a6a" strokeWidth={0.55} />
    <text x={x} y={y} fontSize={heester ? 2.6 : 3}
      fill="#1e3a6a" textAnchor="middle" dominantBaseline="central"
      fontFamily="Poppins, Arial, sans-serif" fontWeight={600}>{plek.label}</text>
  </g>;
}

/**
 * De hele indexlaag: een nummer bij elke plek, en de twee legendakaders in de lege
 * gazonhoek linksonder.
 *
 * `namen` is dezelfde tekst als het paneel gebruikt: de plantnamen per plek, uit de
 * database. Plekken zonder planten krijgen geen regel in de legenda, net als in het
 * origineel.
 */
export default function KaartIndex({ plekken, namen, gekozen, onKies }: {
  plekken: Plek[];
  namen: Record<string, string[]>;
} & Keuze) {
  // Een gekozen boom telt als de regel van zijn letter, welk van de punten het ook is.
  const gekozenPlek = plekken.find((plek) => plek.id === gekozen);
  const gekozenRegel = gekozenPlek?.soort === 'heester'
    ? plekken.find((plek) => plek.soort === 'heester' && plek.label === gekozenPlek.label && (namen[plek.id] || []).length > 0)?.id
    : gekozen;
  const keuze = { gekozen: gekozenRegel, onKies };
  const vakken = plekken
    .filter((plek) => plek.soort !== 'heester')
    .sort((links, rechts) => Number(links.label) - Number(rechts.label));

  // Dezelfde letter staat overal voor dezelfde soort, dus per label één regel.
  const heesters = new Map<string, { tekst: string; plekId: string }>();
  for (const plek of plekken) {
    if (plek.soort !== 'heester') continue;
    const hier = namen[plek.id] || [];
    if (hier.length > 0 && !heesters.has(plek.label)) heesters.set(plek.label, { tekst: hier[0], plekId: plek.id });
  }

  const regelsVak: Regel[] = vakken.map((plek) => ({
    label: plek.label,
    tekst: (namen[plek.id] || []).join(', '),
    plekId: plek.id,
  }));
  const regelsHeester: Regel[] = [...heesters.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'nl'))
    .map(([label, regel]) => ({ label, ...regel }));

  // "BOMEN & HEESTERS" past niet op één regel in een kader van 38mm; in het origineel
  // regelt `kop_regels` dat, hier breken we die vaste tekst zelf af.
  const heesterKop = ['BOMEN &', 'HEESTERS'];
  const vakKop = ['PLANTVAKKEN'];
  const vakSchaal = passendeSchaal(vakKop, regelsVak, INDEX_BREED, 1, ONDERKANT - INDEX_BOVENGRENS);
  const vakHoogte = kaderHoogte(vakKop, regelsVak, INDEX_BREED, vakSchaal);
  const heesterSchaal = passendeSchaal(heesterKop, regelsHeester, HEESTER_BREED, HEESTER_SCHAAL, ONDERKANT - HEESTER_BOVENGRENS);
  const heesterHoogte = kaderHoogte(heesterKop, regelsHeester, HEESTER_BREED, heesterSchaal);

  return <g className="kaart-index" aria-hidden="true">
    {plekken.map((plek) => <Badge key={plek.id} plek={plek} />)}
    <Kader kopregels={vakKop} regels={regelsVak}
      bx={INDEX_X} by={ONDERKANT - vakHoogte} bw={INDEX_BREED} f={vakSchaal} keuze={keuze} />
    <Kader kopregels={heesterKop} regels={regelsHeester}
      bx={INDEX_X + INDEX_BREED + 3} by={ONDERKANT - heesterHoogte}
      bw={HEESTER_BREED} groen f={heesterSchaal} keuze={keuze} />
  </g>;
}
