/**
 * Kleine QR-generator (ISO/IEC 18004), byte-modus, versie 1 tot en met 10.
 * Bewust zonder externe pakketten: de bordjes in de tuin moeten ook over jaren
 * nog te herdrukken zijn zonder dat er een afhankelijkheid stukgaat.
 *
 * Versie 10 op niveau M is goed voor 213 tekens; ruim genoeg voor een webadres.
 */

export type EccNiveau = 'L' | 'M' | 'Q' | 'H';

/** Aantal codewoorden per versie (1 t/m 10). */
const CODEWOORDEN = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

/** Per versie: [ecc-codewoorden per blok, blokken groep 1, data per blok, blokken groep 2, data per blok]. */
const BLOKKEN: Record<EccNiveau, number[][]> = {
  L: [
    [7, 1, 19, 0, 0], [10, 1, 34, 0, 0], [15, 1, 55, 0, 0], [20, 1, 80, 0, 0], [26, 1, 108, 0, 0],
    [18, 2, 68, 0, 0], [20, 2, 78, 0, 0], [24, 2, 97, 0, 0], [30, 2, 116, 0, 0], [18, 2, 68, 2, 69],
  ],
  M: [
    [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44],
  ],
  Q: [
    [13, 1, 13, 0, 0], [22, 1, 22, 0, 0], [18, 2, 17, 0, 0], [26, 2, 24, 0, 0], [18, 2, 15, 2, 16],
    [24, 4, 19, 0, 0], [18, 2, 14, 4, 15], [22, 4, 18, 2, 19], [20, 4, 16, 4, 17], [24, 6, 19, 2, 20],
  ],
  H: [
    [17, 1, 9, 0, 0], [28, 1, 16, 0, 0], [22, 2, 13, 0, 0], [16, 4, 9, 0, 0], [22, 2, 11, 2, 12],
    [28, 4, 15, 0, 0], [26, 4, 13, 1, 14], [26, 4, 14, 2, 15], [24, 4, 12, 4, 13], [28, 6, 15, 2, 16],
  ],
};

/** Middelpunten van de uitlijnvierkantjes per versie. */
const UITLIJNING = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const ECC_BITS: Record<EccNiveau, number> = { L: 1, M: 0, Q: 3, H: 2 };

// ---------- rekenen in het Galoisveld GF(256) ----------

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function veldMaal(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** Generatorveelterm voor n ecc-codewoorden. */
function generator(n: number) {
  let poly = [1];
  for (let i = 0; i < n; i++) {
    const volgende = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      volgende[j] ^= veldMaal(poly[j], 1);
      volgende[j + 1] ^= veldMaal(poly[j], EXP[i]);
    }
    poly = volgende;
  }
  return poly;
}

/** Reed-Solomon foutcorrectie bij een blok datacodewoorden. */
function foutcorrectie(data: number[], lengte: number) {
  const gen = generator(lengte);
  const rest = [...data, ...new Array<number>(lengte).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = rest[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j++) rest[i + j] ^= veldMaal(gen[j], coef);
  }
  return rest.slice(data.length);
}

// ---------- bitstroom ----------

function naarBytes(tekst: string) {
  return [...new TextEncoder().encode(tekst)];
}

function kiesVersie(aantalBytes: number, niveau: EccNiveau) {
  for (let versie = 1; versie <= 10; versie++) {
    const [ecc, g1, d1, g2, d2] = BLOKKEN[niveau][versie - 1];
    void ecc;
    const dataCodewoorden = g1 * d1 + g2 * d2;
    const lengteBits = versie < 10 ? 8 : 16;
    const nodig = 4 + lengteBits + aantalBytes * 8;
    if (nodig <= dataCodewoorden * 8) return versie;
  }
  throw new Error('Deze tekst is te lang voor een QR-code van versie 10.');
}

function bouwCodewoorden(bytes: number[], versie: number, niveau: EccNiveau) {
  const [eccLengte, g1, d1, g2, d2] = BLOKKEN[niveau][versie - 1];
  const dataCodewoorden = g1 * d1 + g2 * d2;

  const bits: number[] = [];
  const schrijf = (waarde: number, lengte: number) => {
    for (let i = lengte - 1; i >= 0; i--) bits.push((waarde >>> i) & 1);
  };

  schrijf(0b0100, 4); // byte-modus
  schrijf(bytes.length, versie < 10 ? 8 : 16);
  for (const byte of bytes) schrijf(byte, 8);

  const ruimte = dataCodewoorden * 8;
  schrijf(0, Math.min(4, ruimte - bits.length)); // afsluiter
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }
  const opvulling = [0xec, 0x11];
  for (let i = 0; data.length < dataCodewoorden; i++) data.push(opvulling[i % 2]);

  const blokken: { data: number[]; ecc: number[] }[] = [];
  let positie = 0;
  for (const [aantal, lengte] of [[g1, d1], [g2, d2]]) {
    for (let i = 0; i < aantal; i++) {
      const stuk = data.slice(positie, positie + lengte);
      positie += lengte;
      blokken.push({ data: stuk, ecc: foutcorrectie(stuk, eccLengte) });
    }
  }

  const resultaat: number[] = [];
  const langsteData = Math.max(...blokken.map((blok) => blok.data.length));
  for (let i = 0; i < langsteData; i++) for (const blok of blokken) if (i < blok.data.length) resultaat.push(blok.data[i]);
  for (let i = 0; i < eccLengte; i++) for (const blok of blokken) resultaat.push(blok.ecc[i]);
  return resultaat;
}

// ---------- de matrix ----------

const MASKERS: ((rij: number, kolom: number) => boolean)[] = [
  (r, k) => (r + k) % 2 === 0,
  (r) => r % 2 === 0,
  (_, k) => k % 3 === 0,
  (r, k) => (r + k) % 3 === 0,
  (r, k) => (Math.floor(r / 2) + Math.floor(k / 3)) % 2 === 0,
  (r, k) => ((r * k) % 2) + ((r * k) % 3) === 0,
  (r, k) => (((r * k) % 2) + ((r * k) % 3)) % 2 === 0,
  (r, k) => (((r + k) % 2) + ((r * k) % 3)) % 2 === 0,
];

type Raster = { grootte: number; donker: boolean[][]; vast: boolean[][] };

function leegRaster(versie: number): Raster {
  const grootte = versie * 4 + 17;
  return {
    grootte,
    donker: Array.from({ length: grootte }, () => new Array<boolean>(grootte).fill(false)),
    vast: Array.from({ length: grootte }, () => new Array<boolean>(grootte).fill(false)),
  };
}

function zetVast(raster: Raster, kolom: number, rij: number, donker: boolean) {
  if (kolom < 0 || rij < 0 || kolom >= raster.grootte || rij >= raster.grootte) return;
  raster.donker[rij][kolom] = donker;
  raster.vast[rij][kolom] = true;
}

function tekenZoekpatroon(raster: Raster, kolom: number, rij: number) {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const afstand = Math.max(Math.abs(dx), Math.abs(dy));
      zetVast(raster, kolom + dx, rij + dy, afstand !== 2 && afstand !== 4);
    }
  }
}

function tekenUitlijning(raster: Raster, kolom: number, rij: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      zetVast(raster, kolom + dx, rij + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
}

function tekenFormaat(raster: Raster, niveau: EccNiveau, masker: number) {
  const gegevens = (ECC_BITS[niveau] << 3) | masker;
  let rest = gegevens;
  for (let i = 0; i < 10; i++) rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
  const bits = ((gegevens << 10) | rest) ^ 0x5412;
  const bit = (i: number) => ((bits >>> i) & 1) === 1;
  const n = raster.grootte;

  for (let i = 0; i <= 5; i++) zetVast(raster, 8, i, bit(i));
  zetVast(raster, 8, 7, bit(6));
  zetVast(raster, 8, 8, bit(7));
  zetVast(raster, 7, 8, bit(8));
  for (let i = 9; i < 15; i++) zetVast(raster, 14 - i, 8, bit(i));

  for (let i = 0; i < 8; i++) zetVast(raster, n - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) zetVast(raster, 8, n - 15 + i, bit(i));
  zetVast(raster, 8, n - 8, true); // altijd donker
}

function tekenVersie(raster: Raster, versie: number) {
  if (versie < 7) return;
  let rest = versie;
  for (let i = 0; i < 12; i++) rest = (rest << 1) ^ ((rest >>> 11) * 0x1f25);
  const bits = (versie << 12) | rest;
  for (let i = 0; i < 18; i++) {
    const donker = ((bits >>> i) & 1) === 1;
    const a = raster.grootte - 11 + (i % 3);
    const b = Math.floor(i / 3);
    zetVast(raster, a, b, donker);
    zetVast(raster, b, a, donker);
  }
}

function tekenVastePatronen(raster: Raster, versie: number, niveau: EccNiveau) {
  const n = raster.grootte;
  for (let i = 0; i < n; i++) {
    zetVast(raster, 6, i, i % 2 === 0);
    zetVast(raster, i, 6, i % 2 === 0);
  }
  tekenZoekpatroon(raster, 3, 3);
  tekenZoekpatroon(raster, n - 4, 3);
  tekenZoekpatroon(raster, 3, n - 4);

  const posities = UITLIJNING[versie - 1];
  for (let i = 0; i < posities.length; i++) {
    for (let j = 0; j < posities.length; j++) {
      const hoek = (i === 0 && j === 0) || (i === 0 && j === posities.length - 1) || (i === posities.length - 1 && j === 0);
      if (!hoek) tekenUitlijning(raster, posities[j], posities[i]);
    }
  }

  tekenFormaat(raster, niveau, 0);
  tekenVersie(raster, versie);
}

function plaatsGegevens(raster: Raster, codewoorden: number[], masker: number) {
  const maskerFunctie = MASKERS[masker];
  const n = raster.grootte;
  let bitIndex = 0;
  let omhoog = true;

  for (let kolom = n - 1; kolom > 0; kolom -= 2) {
    if (kolom === 6) kolom--;
    for (let i = 0; i < n; i++) {
      const rij = omhoog ? n - 1 - i : i;
      for (let d = 0; d < 2; d++) {
        const k = kolom - d;
        if (raster.vast[rij][k]) continue;
        let donker = false;
        if (bitIndex < codewoorden.length * 8) {
          donker = ((codewoorden[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) === 1;
          bitIndex++;
        }
        raster.donker[rij][k] = maskerFunctie(rij, k) ? !donker : donker;
      }
    }
    omhoog = !omhoog;
  }
}

function strafpunten(raster: Raster) {
  const n = raster.grootte;
  const d = raster.donker;
  let straf = 0;

  // regel 1: rijen of kolommen van vijf of meer gelijke modules
  for (const overRijen of [true, false]) {
    for (let a = 0; a < n; a++) {
      let reeks = 1;
      for (let b = 1; b < n; b++) {
        const huidig = overRijen ? d[a][b] : d[b][a];
        const vorig = overRijen ? d[a][b - 1] : d[b - 1][a];
        if (huidig === vorig) {
          reeks++;
          if (reeks === 5) straf += 3;
          else if (reeks > 5) straf += 1;
        } else reeks = 1;
      }
    }
  }

  // regel 2: blokken van 2 bij 2
  for (let r = 0; r < n - 1; r++) {
    for (let k = 0; k < n - 1; k++) {
      if (d[r][k] === d[r][k + 1] && d[r][k] === d[r + 1][k] && d[r][k] === d[r + 1][k + 1]) straf += 3;
    }
  }

  // regel 3: patroon dat op een zoekpatroon lijkt
  const patroon = [true, false, true, true, true, false, true, false, false, false, false];
  const omgekeerd = [...patroon].reverse();
  for (const overRijen of [true, false]) {
    for (let a = 0; a < n; a++) {
      for (let b = 0; b + 11 <= n; b++) {
        const stuk = Array.from({ length: 11 }, (_, i) => (overRijen ? d[a][b + i] : d[b + i][a]));
        if (stuk.every((waarde, i) => waarde === patroon[i]) || stuk.every((waarde, i) => waarde === omgekeerd[i])) straf += 40;
      }
    }
  }

  // regel 4: scheve verhouding donker/licht
  let donker = 0;
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (d[r][k]) donker++;
  const verhouding = (donker * 100) / (n * n);
  straf += Math.floor(Math.abs(verhouding - 50) / 5) * 10;

  return straf;
}

/** Bouwt de QR-matrix: true = donkere module. */
export function qrMatrix(tekst: string, niveau: EccNiveau = 'M') {
  const bytes = naarBytes(tekst);
  const versie = kiesVersie(bytes.length, niveau);
  const codewoorden = bouwCodewoorden(bytes, versie, niveau);

  let beste: Raster | null = null;
  let besteStraf = Infinity;
  for (let masker = 0; masker < 8; masker++) {
    const raster = leegRaster(versie);
    tekenVastePatronen(raster, versie, niveau);
    plaatsGegevens(raster, codewoorden, masker);
    tekenFormaat(raster, niveau, masker);
    const straf = strafpunten(raster);
    if (straf < besteStraf) {
      besteStraf = straf;
      beste = raster;
    }
  }
  return beste!.donker;
}

/**
 * QR-code als SVG-pad, klaar om in een <svg viewBox="0 0 n n"> te zetten.
 * `rand` is de stille zone in modules (de norm vraagt er vier).
 */
export function qrSvgPad(tekst: string, niveau: EccNiveau = 'M', rand = 4) {
  const matrix = qrMatrix(tekst, niveau);
  const delen: string[] = [];
  for (let r = 0; r < matrix.length; r++) {
    for (let k = 0; k < matrix.length; k++) {
      if (matrix[r][k]) delen.push(`M${k + rand} ${r + rand}h1v1h-1z`);
    }
  }
  return { pad: delen.join(''), grootte: matrix.length + rand * 2 };
}
