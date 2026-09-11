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

const BLAD_H = 297.0;

/** Waar de twee kaders staan; gelijk aan de standaardargumenten van `index_svg`. */
const INDEX_X = 6.0;
const INDEX_Y = 116.0;
const INDEX_BREED = 84.0;
/** Het heesterkader is kleiner en staat rechts ernaast, onderaan uitgelijnd. */
const HEESTER_SCHAAL = 0.78;
const HEESTER_BREED = 38.0;

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

/** Eén regel in een kader: bolletje met label, en de plantnamen ernaast. */
type Regel = { label: string; tekst: string };

/**
 * Een kader met kop, streepje en regels. Geeft de tekening terug plus zijn hoogte, want die
 * is nodig om het tweede kader onderaan uit te lijnen.
 *
 * De kop is in het origineel krimpend gemaakt (`passende_grootte`/`kop_regels`) omdat hij
 * uit de data kon komen. Hier zijn het twee vaste teksten, dus we geven de regels gewoon
 * mee — dat scheelt het naspelen van een tekstbreedte-berekening in de browser.
 */
function Kader({ kopregels, regels, bx, by, bw, groen = false, f = 1 }: {
  kopregels: string[];
  regels: Regel[];
  bx: number;
  by: number;
  bw: number;
  groen?: boolean;
  f?: number;
}) {
  const { onderdelen, hoogte } = kaderInhoud(kopregels, regels, bx, by, bw, groen, f);
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
function kaderInhoud(kopregels: string[], regels: Regel[], bx: number, by: number, bw: number, groen: boolean, f: number) {
  const rh = 8.6 * f;
  const kop = 10.0 * f;
  const kopgrootte = 4.8 * f;
  const extraKop = (kopregels.length - 1) * kopgrootte * 1.25;

  const onderdelen: React.ReactNode[] = [];
  let ry = by + kop + extraKop + 8.5 * f;

  for (const { label, tekst } of regels) {
    const delen = breek(hoofdletter(tekst), Math.round(30 * f));
    delen.forEach((deel, i) => {
      if (i === 0) {
        onderdelen.push(
          <circle key={`b-${label}`} cx={bx + 8.0 * f} cy={ry - 1.3} r={3.6 * f}
            fill={groen ? '#4be16e' : '#fff'} stroke="#1e3a6a" strokeWidth={0.45} />,
          <text key={`l-${label}`} x={bx + 8.0 * f} y={ry - 1.3} fontSize={3.4 * f}
            fill="#1e3a6a" textAnchor="middle" dominantBaseline="central"
            fontFamily="Poppins, Arial, sans-serif" fontWeight={600}>{label}</text>,
        );
      }
      onderdelen.push(
        <text key={`t-${label}-${i}`} x={bx + 15.0 * f} y={ry} fontSize={3.95 * f}
          fill="#1e3a6a" fontFamily="Poppins, Arial, sans-serif">{deel}</text>,
      );
      ry += 4.8 * f;
    });
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
export default function KaartIndex({ plekken, namen }: {
  plekken: Plek[];
  namen: Record<string, string[]>;
}) {
  const vakken = plekken
    .filter((plek) => plek.soort !== 'heester')
    .sort((links, rechts) => Number(links.label) - Number(rechts.label));

  // Dezelfde letter staat overal voor dezelfde soort, dus per label één regel.
  const heesters = new Map<string, string>();
  for (const plek of plekken) {
    if (plek.soort !== 'heester') continue;
    const hier = namen[plek.id] || [];
    if (hier.length > 0 && !heesters.has(plek.label)) heesters.set(plek.label, hier[0]);
  }

  const regelsVak: Regel[] = vakken.map((plek) => ({
    label: plek.label,
    tekst: (namen[plek.id] || []).join(', '),
  }));
  const regelsHeester: Regel[] = [...heesters.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'nl'))
    .map(([label, tekst]) => ({ label, tekst }));

  // "BOMEN & HEESTERS" past niet op één regel in een kader van 38mm; in het origineel
  // regelt `kop_regels` dat, hier breken we die vaste tekst zelf af.
  const heesterKop = ['BOMEN &', 'HEESTERS'];
  const heesterHoogte = kaderHoogte(heesterKop, regelsHeester, HEESTER_BREED, HEESTER_SCHAAL);

  return <g className="kaart-index" aria-hidden="true">
    {plekken.map((plek) => <Badge key={plek.id} plek={plek} />)}
    <Kader kopregels={['PLANTVAKKEN']} regels={regelsVak}
      bx={INDEX_X} by={INDEX_Y} bw={INDEX_BREED} />
    <Kader kopregels={heesterKop} regels={regelsHeester}
      bx={INDEX_X + INDEX_BREED + 3} by={BLAD_H - 7 - heesterHoogte}
      bw={HEESTER_BREED} groen f={HEESTER_SCHAAL} />
  </g>;
}
