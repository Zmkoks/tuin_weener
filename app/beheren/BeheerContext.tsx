'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek } from '@/app/data/plekTypes';
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
  maakPlekEnZet: (plant: Plant, punt: { x: number; y: number }) => Promise<void>;
  haalWeg: (plant: Plant, plekId: string) => Promise<void>;
  bewaarPlant: (plant: Plant, waarden: PlantForm) => Promise<void>;
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

  const maakPlekEnZet = useCallback(async (plant: Plant, punt: { x: number; y: number }) => {
    const antwoord = await fetch('/api/plekken', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(punt),
    });
    const gegevens = await antwoord.json() as { plek?: Plek; error?: string };
    if (!antwoord.ok || !gegevens.plek) throw new Error(gegevens.error || 'De nieuwe plek kon niet worden aangemaakt.');
    setPlekken((vorige) => [...vorige, gegevens.plek as Plek]);
    await bewaarBeplanting(gegevens.plek.id, [plant.slug]);
    klaar(
      'Nieuwe plek aangemaakt',
      `${plant.naam} staat nu op een nieuwe plek op de kaart. Op de gedrukte plattegrond komt die plek pas als de kaart opnieuw wordt gemaakt.`,
    );
  }, [bewaarBeplanting, klaar]);

  const haalWeg = useCallback(async (plant: Plant, plekId: string) => {
    const rest = (beplant[plekId] || []).filter((slug) => slug !== plant.slug);
    await bewaarBeplanting(plekId, rest);

    // Een plek die hier is bijgemaakt en nu leeg is, is een stip op de kaart waar niets
    // meer staat. Die ruimen we meteen op. De vaste plekken uit tuin.json blijven.
    const bijgemaakt = plekId.startsWith('eigen-');
    let opgeruimd = false;
    if (bijgemaakt && rest.length === 0) {
      const antwoord = await fetch('/api/plekken', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: plekId }),
      });
      if (antwoord.ok) {
        setPlekken((vorige) => vorige.filter((plek) => plek.id !== plekId));
        opgeruimd = true;
      }
    }

    klaar(
      `${plant.naam} is van deze plek gehaald`,
      opgeruimd
        ? 'De plant staat nog gewoon in de bibliotheek. Deze plek was hier eerder bijgemaakt en stond nu leeg, dus die is van de kaart gehaald.'
        : 'De plant staat nog gewoon in de bibliotheek; alleen op deze plek staat hij niet meer.',
    );
  }, [beplant, bewaarBeplanting, klaar]);

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
    maakPlekEnZet,
    haalWeg,
    bewaarPlant,
    nieuwePlantOpgeslagen,
  };

  return <Context.Provider value={waarde}>{children}</Context.Provider>;
}
