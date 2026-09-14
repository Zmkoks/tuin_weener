'use client';

import { useRouter } from 'next/navigation';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek } from '@/app/data/plekTypes';
import Plattegrond from '@/app/components/Plattegrond';

/**
 * De kaart op een plekpagina is ook een ingang naar de andere plekken.
 * De serverpagina levert de actuele kaartdata; deze kleine clientlaag verzorgt alleen de
 * navigatie wanneer iemand op een andere bak, vrije plek of boom/heesterpunt klikt.
 */
export default function PlekKaart({
  zones,
  gekozen,
  namen,
  plants,
  placements,
}: {
  zones: Plek[];
  gekozen: string;
  namen: Record<string, string[]>;
  plants: Plant[];
  placements: Record<string, string[]>;
}) {
  const router = useRouter();
  return <Plattegrond
    zones={zones}
    gekozen={gekozen}
    onKies={(id) => router.push(`/plek/${encodeURIComponent(id)}`)}
    namen={namen}
    plants={plants}
    placements={placements}
  />;
}
