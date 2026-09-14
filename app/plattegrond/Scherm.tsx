'use client';

import { useMemo, useState } from 'react';
import Link from '@/app/components/NativeLink';
import { useRouter } from 'next/navigation';
import type { Plant } from '../data/plantTypes';
import type { Plek } from '../data/plekTypes';
import Kopbalk from '../components/Kopbalk';
import Plattegrond from '../components/Plattegrond';
import KaartIndex from '../components/kaartIndex';
import PlekBeheer from '../components/PlekBeheer';
import { bewerkbaar } from '../lib/plekVorm';
import { PlantFoto } from '../components/paspoortDelen';

/**
 * Twee manieren om naar de tuin te kijken:
 *
 * - **Klik per bak** — de schone kaart; je kiest een plek en ziet ernaast wat daar groeit.
 * - **Alles in beeld** — de nummers en de legenda erbij, hetzelfde beeld als op papier, zodat
 *   je in één oogopslag ziet wat waar staat zonder te hoeven klikken.
 *
 * De tweede weergave wordt hier getekend uit dezelfde gegevens als het paneel, en niet uit
 * een gegenereerd bestand. Daardoor klopt hij altijd — ook direct nadat iemand via Beheren
 * iets heeft veranderd — en staat de legenda in de huisstijlletters.
 */
export default function PlattegrondScherm({ plekken, plants, placements }: {
  plekken: Plek[];
  plants: Plant[];
  placements: Record<string, string[]>;
}) {
  const router = useRouter();
  const [zoneId, setZoneId] = useState('');
  const [allesInBeeld, setAllesInBeeld] = useState(false);

  const zone = plekken.find(z => z.id === zoneId);
  // Dezelfde letter is dezelfde soort, dus een gekozen boom of heester licht overal op waar
  // hij staat — of je nu op de kaart klikt of op zijn regel in de legenda.
  const zelfdeSoort = zone?.soort === 'heester'
    ? plekken.filter(z => z.soort === 'heester' && z.label === zone.label).map(z => z.id)
    : undefined;
  const zonePlants = (zone ? placements[zone.id] || zone.planten : []).map(s => plants.find(p => p.slug === s)).filter(Boolean) as Plant[];
  const names = useMemo(() => Object.fromEntries(plekken.map(z => [z.id, (placements[z.id] || z.planten).map(s => plants.find(p => p.slug === s)?.naam).filter((naam): naam is string => Boolean(naam))])), [plekken, placements, plants]);

  return <main>
    <Kopbalk actief="plattegrond" />
    <section className="workspace map-workspace">
      <p className="eyebrow">INTERACTIEVE PLATTEGROND</p>
      <h1>Waar groeit wat?</h1>
      <p className="lead">Klik op een plantvak, een boom of een heester om te zien wat daar groeit. Dubbelklik op een plek om direct naar <em>Wat groeit hier?</em> te gaan.</p>

      <div className="kaart-modus" role="group" aria-label="Weergave van de kaart">
        <button type="button" className={allesInBeeld ? '' : 'gekozen'} aria-pressed={!allesInBeeld}
          onClick={() => setAllesInBeeld(false)}>Klik per bak</button>
        <button type="button" className={allesInBeeld ? 'gekozen' : ''} aria-pressed={allesInBeeld}
          onClick={() => setAllesInBeeld(true)}>Alles in beeld</button>
      </div>

      <div className={`map-layout${allesInBeeld ? ' met-index' : ''}`}>
        <div className="large-map">
          <Plattegrond
            zones={plekken}
            gekozen={zoneId}
            oplichten={zelfdeSoort}
            onKies={setZoneId}
            onDubbelklik={(id) => router.push(`/plek/${encodeURIComponent(id)}`)}
            namen={names}
            plants={plants}
            placements={placements}
            indexLaag={allesInBeeld ? <KaartIndex plekken={plekken} namen={names} gekozen={zoneId} onKies={setZoneId} /> : undefined}
          />
        </div>
        <aside>
          <div className="zone-result">
            {zone ? <>
              <h2>Wat groeit hier?</h2>
              <p>{zonePlants.length} {zonePlants.length === 1 ? 'plant' : 'planten'} op deze plek</p>
              {zonePlants.map(p => <Link className="zone-plant" href={`/plant/${p.slug}`} key={p.slug}><PlantFoto plant={p} /><span><b>{p.naam}</b></span><strong aria-hidden="true">→</strong></Link>)}
              {/* `key` op de plek: kies je een andere bak, dan hoort het menu weer dicht te
                  staan in plaats van open te blijven met de links van de vorige plek. */}
              <PlekBeheer key={zone.id} plekId={zone.id} aantalPlanten={zonePlants.length} isBak={zone.soort === 'bak'} kanVormAanpassen={bewerkbaar(zone)} />
            </> : <>
              <h2>Kies een plek</h2>
              <p>Klik op de kaart op een vak, boom of heester om te zien wat daar groeit.</p>
            </>}
          </div>
        </aside>
      </div>
    </section>
  </main>;
}
