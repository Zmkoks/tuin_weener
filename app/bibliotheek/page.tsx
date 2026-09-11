import type { Metadata } from 'next';
import Kopbalk from '../components/Kopbalk';
import { PlantFoto } from '../components/paspoortDelen';
import { laadBeplanting, laadPlanten, laadZones } from '../lib/tuinData';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Plantenbibliotheek · Weener XL' };

export default async function Bibliotheek() {
  const [planten, plekken, beplanting] = await Promise.all([laadPlanten(), laadZones(), laadBeplanting()]);
  const inTuin = new Set(plekken.flatMap((plek) => beplanting[plek.id] ?? []));
  return <main><Kopbalk actief="planten" /><section className="library">
    <a href="/">← Terug naar de tuin</a>
    <h1>Plantenbibliotheek</h1>
    <p className="lead">Alle bewaarde planten, ook als ze op dit moment niet in de tuin staan.</p>
    <div className="plant-grid">{[...planten].sort((a, b) => a.naam.localeCompare(b.naam, 'nl')).map((plant) =>
      <a className="plant-card" href={`/plant/${plant.slug}`} key={plant.slug}>
        <PlantFoto plant={plant} /><div><span className="pill">{inTuin.has(plant.slug) ? 'In de tuin' : 'Niet in de tuin'}</span><h2>{plant.naam}</h2><i>{plant.botanischeNaam}</i><p>{plant.intro}</p><span className="kaart-meer">Bekijk deze plant →</span></div>
      </a>)}</div>
    {!planten.length && <p>Er staan nog geen planten in de bibliotheek.</p>}
  </section></main>;
}
