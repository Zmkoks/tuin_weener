'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek, Vorm } from '@/app/data/plekTypes';
import { toPayload, type PlantForm } from '@/app/components/plantFormulier';

/**
 * De gedeelde toestand van het beheren.
 *
 * Dit hangt in de layout van /beheren en niet in een pagina: een layout blijft staan
 * terwijl je van stap naar stap loopt, dus wat je bij de ene stap opslaat weet de
 * volgende stap nog, zonder de pagina opnieuw te laden. De beginstand komt van de server.
 *
 * Hier hangt ook de melding na het opslaan. Die krijgt bewust geen eigen adres: een adres
 * kun je bewaren en herladen, en dan zou er een vinkje staan bij iets dat zojuist niet
 * gebeurd is. Na het opslaan gaan we met `replace` naar het beginscherm, zodat de
 * browserknop Terug niet in een formulier belandt dat al verstuurd is.
 */
export type Melding = { titel: string; tekst: string };

type Beheer = {
  planten: Plant[];
  plekken: Plek[];
  beplanting: Record<string, string[]>;
  /** Namen per plek, voor de tekst die bij een vak op de kaart verschijnt. */
  namen: Record<string, string[]>;
  plantVan: (slug: string) => Plant | undefined;
  plekVan: (id: string) => Plek | undefined;
  plantenOp: (plekId: string) => Plant[];
  plekkenVan: (slug: string) => Plek[];

  melding: Melding | null;
  wisMelding: () => void;

  /** Alle handelingen gooien bij mislukken; het scherm dat ze aanroept toont de fout. */
  zetOpPlek: (plant: Plant, plekId: string) => Promise<void>;
  maakPlekEnZetVorm: (plant: Plant, vorm: Vorm, soort: 'bak' | 'vrij') => Promise<void>;
  maakPlek: (vorm: Vorm, soort: 'bak' | 'vrij') => Promise<void>;
  wijzigPlek: (id: string, vorm: Vorm) => Promise<void>;
  haalWeg: (plant: Plant, plekId: string) => Promise<void>;
  verplaats: (plant: Plant, van: string, naar: string) => Promise<void>;
  bewaarPlant: (plant: Plant, waarden: PlantForm) => Promise<void>;
  verwijderPlant: (plant: Plant) => Promise<void>;
  nieuwePlantOpgeslagen: (plant: Plant) => void;
};

const Context = createContext<Beheer | null>(null);

export function useBeheer() {
  const beheer = useContext(Context);
  if (!beheer) throw new Error('useBeheer werkt alleen binnen de layout van /beheren.');
  return beheer;
}

type Props = {
  planten: Plant[];
  plekken: Plek[];
  beplanting: Record<string, string[]>;
  children: ReactNode;
};

export function BeheerProvider({ planten, plekken, beplanting, children }: Props) {
  const router = useRouter();
  const [allePlanten, setPlanten] = useState(planten);
  const [allePlekken, setPlekken] = useState(plekken);
  const [beplant, setBeplant] = useState(beplanting);
  const [melding, setMelding] = useState<Melding | null>(null);

  const opNaam = useMemo(
    () => [...allePlanten].sort((links, rechts) => links.naam.localeCompare(rechts.naam, 'nl')),
    [allePlanten],
  );

  const plantVan = useCallback((slug: string) => allePlanten.find((plant) => plant.slug === slug), [allePlanten]);
  const plekVan = useCallback((id: string) => allePlekken.find((plek) => plek.id === id), [allePlekken]);

  const plantenOp = useCallback(
    (plekId: string) => (beplant[plekId] || []).map(plantVan).filter((plant): plant is Plant => plant !== undefined),
    [beplant, plantVan],
  );

  const plekkenVan = useCallback(
    (slug: string) => allePlekken.filter((plek) => (beplant[plek.id] || []).includes(slug)),
    [allePlekken, beplant],
  );

  const namen = useMemo(
    () => Object.fromEntries(allePlekken.map((plek) => [plek.id, plantenOp(plek.id).map((plant) => plant.naam)])),
    [allePlekken, plantenOp],
  );

  /** Terug naar het begin, met een vinkje boven de vragen. */
  const klaar = useCallback((titel: string, tekst: string) => {
    setMelding({ titel, tekst });
    router.replace('/beheren');
  }, [router]);

  const bewaarBeplanting = useCallback(async (plekId: string, slugs: string[]) => {
    const antwoord = await fetch('/api/beplanting', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ zoneId: plekId, plantSlugs: slugs }),
    });
    if (!antwoord.ok) {
      const gegevens = await antwoord.json().catch(() => ({})) as { error?: string };
      throw new Error(gegevens.error || 'Opslaan is niet gelukt.');
    }
    setBeplant((vorige) => ({ ...vorige, [plekId]: slugs }));
  }, []);

  const zetOpPlek = useCallback(async (plant: Plant, plekId: string) => {
    const slugs = [...new Set([...(beplant[plekId] || []), plant.slug])];
    await bewaarBeplanting(plekId, slugs);
    klaar(
      `${plant.naam} staat nu op de kaart`,
      'De plek is bijgewerkt. Op de plattegrond en op de plantenpagina zie je hem meteen staan.',
    );
  }, [beplant, bewaarBeplanting, klaar]);

  const maakPlekEnZetVorm = useCallback(async (plant: Plant, vorm: Vorm, soort: 'bak' | 'vrij') => {
    const antwoord = await fetch('/api/plekken', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vorm, soort }),
    });
    const gegevens = await antwoord.json() as { plek?: Plek; error?: string };
    if (!antwoord.ok || !gegevens.plek) throw new Error(gegevens.error || 'De nieuwe plek kon niet worden aangemaakt.');
    const plek = gegevens.plek;
    setPlekken((vorige) => [...vorige, plek]);
    await bewaarBeplanting(plek.id, [plant.slug]);
    klaar(
      'Nieuwe plek aangemaakt',
      `De ${plant.naam} staat nu op de nieuwe plek op de kaart. Op de gedrukte plattegrond komt die plek pas als de kaart opnieuw wordt gemaakt.`,
    );
  }, [bewaarBeplanting, klaar]);

  const wijzigPlek = useCallback(async (id: string, vorm: Vorm) => {
    const antwoord = await fetch('/api/plekken', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, vorm }),
    });
    const gegevens = await antwoord.json().catch(() => ({})) as { plek?: Plek; error?: string };
    if (!antwoord.ok || !gegevens.plek) throw new Error(gegevens.error || 'Opslaan is niet gelukt.');
    const plek = gegevens.plek;
    setPlekken((vorige) => vorige.map((p) => p.id === plek.id ? plek : p));
    klaar(`Plek ${plek.label} is aangepast`, 'De plaats en grootte zijn bijgewerkt. De planten, het nummer en de QR-code blijven bij deze plek horen.');
  }, [klaar]);

  const maakPlek = useCallback(async (vorm: Vorm, soort: 'bak' | 'vrij') => {
    const antwoord = await fetch('/api/plekken', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vorm, soort }),
    });
    const gegevens = await antwoord.json() as { plek?: Plek; error?: string };
    if (!antwoord.ok || !gegevens.plek) throw new Error(gegevens.error || 'Het nieuwe plantvak kon niet worden aangemaakt.');
    setPlekken((vorige) => [...vorige, gegevens.plek as Plek]);
    klaar(
      soort === 'bak' ? 'Nieuwe plantenbak toegevoegd' : 'Nieuwe vrije plek toegevoegd',
      'De plek staat nu op de plattegrond. Je kunt er via “Een plant toevoegen op een plek” planten aan toevoegen.',
    );
  }, [klaar]);

  /**
   * Een plek die hier is bijgemaakt en nu leeg is, is een stip op de kaart waar niets meer
   * staat. Die ruimen we op. De vaste plekken uit tuin.json blijven altijd staan, want het
   * drukwerk tekent ermee. Geeft terug of er inderdaad iets is opgeruimd, want dat verandert
   * wat we de gebruiker vertellen.
   */
  const ruimLegePlekOp = useCallback(async (plekId: string, rest: string[]) => {
    if (!plekId.startsWith('eigen-') || rest.length > 0) return false;
    const antwoord = await fetch('/api/plekken', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: plekId }),
    });
    if (!antwoord.ok) return false;
    setPlekken((vorige) => vorige.filter((plek) => plek.id !== plekId));
    return true;
  }, []);

  const haalWeg = useCallback(async (plant: Plant, plekId: string) => {
    const rest = (beplant[plekId] || []).filter((slug) => slug !== plant.slug);
    await bewaarBeplanting(plekId, rest);
    const opgeruimd = await ruimLegePlekOp(plekId, rest);

    klaar(
      `${plant.naam} is van deze plek gehaald`,
      opgeruimd
        ? 'De plant staat nog gewoon in de bibliotheek. Deze plek was hier eerder bijgemaakt en stond nu leeg, dus die is van de kaart gehaald.'
        : 'De plant staat nog gewoon in de bibliotheek; alleen op deze plek staat hij niet meer.',
    );
  }, [beplant, bewaarBeplanting, klaar, ruimLegePlekOp]);

  /**
   * Verhuizen is één handeling en niet "weghalen, dan opnieuw plaatsen".
   *
   * **De volgorde is met opzet zo.** Eerst neerzetten op de nieuwe plek, dan weghalen van de
   * oude. Gaat de tweede stap mis, dan staat de plant even op twee plekken - zichtbaar en met
   * één klik te herstellen. Andersom zou hij bij dezelfde fout nergens meer staan, en dan moet
   * iemand uit zijn hoofd weten waar hij vandaan kwam.
   *
   * **En daarom kan dit niet met de twee bestaande schermen achter elkaar.** Was de oude plek
   * hier ooit bijgemaakt (een `eigen-`-stip), dan ruimt `haalWeg` hem op zodra hij leeg is.
   * Verhuis je in twee stappen, dan is die plek dus verdwenen voordat je de plant ergens anders
   * hebt neergezet. Hier gebeurt het opruimen pas nadat de plant veilig staat.
   */
  const verplaats = useCallback(async (plant: Plant, van: string, naar: string) => {
    if (van === naar) throw new Error('De plant staat al op deze plek.');
    const doel = [...new Set([...(beplant[naar] || []), plant.slug])];
    const rest = (beplant[van] || []).filter((slug) => slug !== plant.slug);
    await bewaarBeplanting(naar, doel);
    await bewaarBeplanting(van, rest);
    const opgeruimd = await ruimLegePlekOp(van, rest);

    klaar(
      `${plant.naam} staat nu op een andere plek`,
      opgeruimd
        ? 'De oude plek was hier eerder bijgemaakt en stond nu leeg, dus die is van de kaart gehaald.'
        : 'Op de plattegrond en op de plantenpagina zie je de nieuwe plek meteen staan.',
    );
  }, [beplant, bewaarBeplanting, klaar, ruimLegePlekOp]);

  const bewaarPlant = useCallback(async (plant: Plant, waarden: PlantForm) => {
    const antwoord = await fetch(`/api/planten/${encodeURIComponent(plant.slug)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(toPayload(waarden)),
    });
    const gegevens = await antwoord.json() as { plant?: Plant; error?: string };
    if (!antwoord.ok || !gegevens.plant) throw new Error(gegevens.error || 'Opslaan is niet gelukt.');
    const bijgewerkt = gegevens.plant;
    setPlanten((vorige) => vorige.map((ander) => (ander.slug === bijgewerkt.slug ? bijgewerkt : ander)));
    klaar(
      `De informatie over ${bijgewerkt.naam} is bijgewerkt`,
      'De plantenpagina en de QR-code laten nu de nieuwe tekst zien.',
    );
  }, [klaar]);

  const verwijderPlant = useCallback(async (plant: Plant) => {
    const antwoord = await fetch(`/api/planten/${encodeURIComponent(plant.slug)}`, { method: 'DELETE' });
    if (!antwoord.ok) {
      const gegevens = await antwoord.json().catch(() => ({})) as { error?: string };
      throw new Error(gegevens.error || 'Verwijderen is niet gelukt.');
    }
    setPlanten((vorige) => vorige.filter((ander) => ander.slug !== plant.slug));
    setBeplant((vorige) => Object.fromEntries(Object.entries(vorige).map(([id, slugs]) => [id, slugs.filter((slug) => slug !== plant.slug)])));
    klaar(`${plant.naam} is verwijderd`, 'De plant is uit de bibliotheek en van alle tuinplekken verwijderd. Het oude plantenadres en de QR-code werken niet meer.');
  }, [klaar]);

  const nieuwePlantOpgeslagen = useCallback((plant: Plant) => {
    setPlanten((vorige) => (vorige.some((ander) => ander.slug === plant.slug)
      ? vorige.map((ander) => (ander.slug === plant.slug ? plant : ander))
      : [...vorige, plant]));
  }, []);

  const waarde: Beheer = {
    planten: opNaam,
    plekken: allePlekken,
    beplanting: beplant,
    namen,
    plantVan,
    plekVan,
    plantenOp,
    plekkenVan,
    melding,
    wisMelding: () => setMelding(null),
    zetOpPlek,
    maakPlekEnZetVorm,
    maakPlek,
    wijzigPlek,
    haalWeg,
    verplaats,
    bewaarPlant,
    verwijderPlant,
    nieuwePlantOpgeslagen,
  };

  return <Context.Provider value={waarde}>{children}</Context.Provider>;
}
