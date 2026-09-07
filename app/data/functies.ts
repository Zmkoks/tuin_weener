import type { Plant } from './plantTypes';

export type Functiegroepen = { primair: string[]; secundair: string[] };

/** Oude opslag heeft alleen een lijst. Zonder bron blijft de eerste functie primair. */
export function functieGroepen(value: Functiegroepen | string[], bron?: Functiegroepen): Functiegroepen {
  if (!Array.isArray(value)) return value;
  const alle = [...new Set(value)];
  const primair = bron ? bron.primair.filter((f) => alle.includes(f)) : [];
  if (!primair.length) primair.push(...alle.slice(0, alle[0] === 'onkruid' ? 2 : 1));
  return { primair, secundair: alle.filter((f) => !primair.includes(f)) };
}

export function alleFuncties(plant: Pick<Plant, 'functies'>): string[] {
  const groepen = functieGroepen(plant.functies);
  return [...groepen.primair, ...groepen.secundair];
}

/** Behoud eigen teksten, media en functie-keuzes; vul alleen oude ontbrekende velden aan. */
export function normaliseerPlant(plant: Plant, bron?: Plant): Plant {
  const beeld = (soort: 'foto' | 'illustratie') => {
    const eigen = plant[soort];
    if (eigen?.bestand) return eigen;
    if (!eigen) return bron?.[soort];
    return { ...eigen, bron: eigen.bron || bron?.[soort]?.bron || '' };
  };
  return {
    ...plant,
    functies: functieGroepen(plant.functies, bron?.functies),
    foto: beeld('foto'),
    illustratie: beeld('illustratie'),
  };
}
