/**
 * Katernvolgorde voor het binnenwerk van het boekje. Op papier bewezen op 16 september 2026
 * met /drukwerk/boekje/proef: na dubbelzijdig printen op A4 liggend en vouwen liggen de
 * pagina's op volgorde.
 *
 * Bij M pagina's (M is een viervoud):
 *   vel i voorkant   = [M - 2i, 1 + 2i]
 *   vel i achterkant = [2 + 2i, M - 1 - 2i]
 *
 * Het omslag valt hier buiten: dat is een los vel, enkelzijdig, links de achterkant en rechts
 * de voorkant.
 */

export type Katernkant = {
  /** Paginanummer links en rechts, vanaf 1. Nummers boven het aantal inhoudspagina's zijn blanco. */
  helften: [number, number];
  /** Vanaf 1. */
  vel: number;
  achterkant: boolean;
};

/** Naar boven afgerond op een viervoud: minder kan niet gevouwen worden. */
export function katernOmvang(inhoud: number) {
  return Math.max(4, Math.ceil(inhoud / 4) * 4);
}

export function katernKanten(paginas: number): Katernkant[] {
  const kanten: Katernkant[] = [];
  for (let i = 0; i < paginas / 4; i += 1) {
    kanten.push({ helften: [paginas - 2 * i, 1 + 2 * i], vel: i + 1, achterkant: false });
    kanten.push({ helften: [2 + 2 * i, paginas - 1 - 2 * i], vel: i + 1, achterkant: true });
  }
  return kanten;
}
