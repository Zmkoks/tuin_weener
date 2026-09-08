'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from '@/app/components/NativeLink';
import type { Plant } from '../data/plantTypes';
import type { Plek } from '../data/plekTypes';
import Kopbalk from '../components/Kopbalk';
import Plattegrond from '../components/Plattegrond';
import { PlantFoto } from '../components/paspoortDelen';

export default function PlattegrondPagina() {
  const [plekken, setPlekken] = useState<Plek[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [placements, setPlacements] = useState<Record<string, string[]>>({});
  const [zoneId, setZoneId] = useState('');
  useEffect(() => {
    Promise.all([
      fetch('/api/plekken').then(r => r.json() as Promise<{ plekken: Plek[] }>),
      fetch('/api/planten').then(r => r.json() as Promise<{ plants: Plant[] }>),
      fetch('/api/beplanting').then(r => r.json() as Promise<{ placements: Record<string, string[]> }>),
    ])
      .then(([z, p, b]) => { setPlekken(z.plekken || []); setPlants(p.plants || []); setPlacements(b.placements || {}); });
  }, []);
  const zone = plekken.find(z => z.id === zoneId);
  const zonePlants = (zone ? placements[zone.id] || zone.planten : []).map(s => plants.find(p => p.slug === s)).filter(Boolean) as Plant[];
  const names = useMemo(() => Object.fromEntries(plekken.map(z => [z.id, (placements[z.id] || z.planten).map(s => plants.find(p => p.slug === s)?.naam).filter((naam): naam is string => Boolean(naam))])), [plekken, placements, plants]);
  return <main><Kopbalk actief="plattegrond"/><section className="workspace map-workspace"><p className="eyebrow">INTERACTIEVE PLATTEGROND</p><h1>Waar groeit wat?</h1><p className="lead">Klik op een plantvak, een boom of een heester en bekijk welke planten daar staan.</p><div className="map-layout"><div className="large-map"><Plattegrond zones={plekken} gekozen={zoneId} onKies={setZoneId} namen={names}/></div><aside><div className="zone-result">{zone ? <><h2>Wat groeit hier?</h2><p>{zonePlants.length} {zonePlants.length === 1 ? 'plant' : 'planten'} op deze plek</p>{zonePlants.map(p => <Link className="zone-plant" href={`/plant/${p.slug}`} key={p.slug}><PlantFoto plant={p}/><span><b>{p.naam}</b></span><strong aria-hidden="true">→</strong></Link>)}</> : <><h2>Kies een plek</h2><p>Klik op de kaart op een vak, boom of heester om te zien wat daar groeit.</p></>}</div></aside></div></section></main>;
}
