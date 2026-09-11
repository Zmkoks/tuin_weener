import type { Metadata } from 'next';
import Link from '@/app/components/NativeLink';
import { notFound } from 'next/navigation';
import { hoofdletter, korteBotanischeNaam, months, takenVoorMaand } from '@/app/data/tuinTekst';
import { icoonPad } from '@/app/data/iconen';
import { Functies, Kalender, PlantFoto, SectieIllustratie, SectieMagWeg, SectieMoetBlijven, SectieOogsten, SectieSnoeien, SectieVerzorging, SectieWeetje, Waterdruppels } from '@/app/components/paspoortDelen';
import { laadBeplanting, laadPlanten, laadZones, plekkenVanPlant } from '@/app/lib/tuinData';
import { fotoVan, illustratieVan } from '@/app/data/afbeeldingen';
import { Bronvermelding } from '@/app/components/Bronvermelding';
import ScanKop from '@/app/components/ScanKop';
import PlekjesKaart from '@/app/components/PlekjesKaart';
import Beheerknop from '@/app/components/Beheerknop';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

async function zoekPlant(slug: string) {
  return (await laadPlanten()).find((plant) => plant.slug === decodeURIComponent(slug));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plant = await zoekPlant((await params).slug);
  if (!plant) return { title: 'Plant niet gevonden · Weener XL' };
  return { title: `${hoofdletter(plant.naam)} · tuin van Weener XL`, description: plant.intro };
}

export default async function PlantPagina({ params }: Props) {
  const { slug } = await params;
  const plant = await zoekPlant(slug);
  if (!plant) notFound();

  const [zones, beplanting] = await Promise.all([laadZones(), laadBeplanting()]);
  const plekken = plekkenVanPlant(zones, beplanting, plant.slug);
  const maand = months[new Date().getMonth()];
  const taken = takenVoorMaand(plant, maand);

  /* `scan-plant` zet de brede indeling aan (scan.css, onderaan). De plek-pagina gebruikt
     dezelfde `.scan` maar is een lijstje en blijft smal. */
  return <main className="scan scan-plant">
    <ScanKop />
    <div className="scan-vel">

    <header className="scan-hero">
      {/* De naam staat vóór de foto en krijgt de volle breedte. Zou hij naast de zwevende
          foto staan, dan blijft er op een telefoon maar ~154px over, en een woord als
          "duizendblad" (226px) past daar niet in: de browser duwt dan lege regels omlaag tot
          de foto voorbij is, en de naam valt in tweeën. Dat trof 12 van de 25 planten. */}
      <div className="scan-naam">
        <span className="number">{plant.levensduur && ` ${plant.levensduur}`}</span>
        <h1>{plant.naam}</h1>
        <i>{korteBotanischeNaam(plant.botanischeNaam)}</i>
      </div>
      {/* Zelfde opbouw als .left-visual op de gedrukte kaart: foto + twee losse ringen.
          Staat vóór de tekst omdat hij rechts zweeft en de tekst er links langs loopt. */}
      <div className="scan-visual">
        <div className="scan-foto-vlak"><PlantFoto plant={plant} className="scan-foto" inKader /></div>
        <i className="ring-dark" aria-hidden="true" />
        <i className="ring-bright" aria-hidden="true" />
      </div>
      <div className="scan-titel">
        {/* Druppels en functies staan in één wikkel, zodat ze onder elkaar blijven staan.
            Als losse buren naast de zwevende foto vielen ze op een halfbreed scherm naast
            elkaar: allebei ongeveer 112px breed, en in de strook van 280px pasten ze samen
            net. Zie `.scan-kenmerken` in scan.css. */}
        <div className="scan-kenmerken">
          <Waterdruppels plant={plant} naarUitleg />
          <Functies plant={plant} naarUitleg />
        </div>
        {/* De inleiding hoort bij de kop: op een breed scherm staat hij naast de foto in
            plaats van eronder, en dan zou een losse alinea de kop half leeg laten. */}
        <p className="scan-intro">{plant.intro}</p>
        <Beheerknop slug={plant.slug} />
      </div>
    </header>

    <section className="scan-nu">
      <p className="eyebrow">WAT KAN IK NU DOEN?</p>
      <h2>{maand}</h2>
      {taken.length > 0
        ? taken.map((taak) => <div className="scan-taak" key={taak.type}>
            <img className="taak-icoon" src={icoonPad(taak.type === 'Oogsten' ? 'oogst' : 'snoei')} alt="" />
            <div><b>{taak.type}</b>{taak.uitleg && <p>{taak.uitleg}</p>}</div>
          </div>)
        : <p className="scan-geen-taak">Deze maand hoef je bij deze plant niets te oogsten of te snoeien.</p>}
    </section>

    {[...plant.functies.primair, ...plant.functies.secundair].includes('onkruid') && <p className="scan-onkruid">Dit is onkruid.</p>}
    <div className="scan-regels">
      <SectieMagWeg plant={plant} />
      <SectieMoetBlijven plant={plant} />
    </div>

    <a className="scan-meer" href="#meer">Meer over deze plant ↓</a>

    <div className="scan-secties" id="meer">
      <SectieVerzorging plant={plant} />
      <SectieOogsten plant={plant} />
      <SectieSnoeien plant={plant} />
      <section className="scan-kalender"><h3>Jaarkalender</h3><div className="scan-kalender-scroll"><Kalender plant={plant} /></div><Link className="uitleg-link" href="/uitleg/functies#kalender">Wat betekenen de kleuren? →</Link></section>
      <SectieIllustratie plant={plant} />
      <SectieWeetje plant={plant} />
    </div>

    {plekken.length > 0 && <nav className="scan-plekken" aria-label="Waar deze plant staat">
      <h3>In de tuin</h3>
      {/* Met de naam erin en niet "deze plant": op een scanpagina kom je met een QR-code
          binnen en dan is de naam het eerste dat je wilt herkennen. Zonder lidwoord, want
          "de" klopt niet bij elke naam ("het edel duizendblad") en een lidwoord per plant
          bijhouden is meer moeite dan het waard is. De hoofdletter komt uit `::first-letter`,
          net als bij de kop en de taakregels; in de gegevens blijft de naam klein. */}
      <p className="scan-plekken-tekst">{plant.naam} staat op {plekken.length === 1
        ? 'één plek in de tuin. De stip laat zien waar.'
        : `${plekken.length} plekken in de tuin. De stippen laten zien waar.`}</p>
      <PlekjesKaart plekken={plekken} alle={zones} naam={plant.naam} />
      <Link href="/plattegrond">Bekijk de hele plattegrond →</Link>
    </nav>}

    {/* "Hoe lees je deze pagina?" met de drie uitlegkaarten stond hier onderaan. Weg per
        7 september: de uitleg is inmiddels bereikbaar op het moment dat je hem nodig hebt
        — bij de druppels, bij het snoeien, bij de kalender en op elk icoon zelf (§8).
        Een tweede rij kaarten onderaan herhaalde dat alleen maar. */}

    <section className="scan-bronnen" aria-label="Afbeeldingsbronnen">
      <Bronvermelding label="Foto" bron={fotoVan(plant)?.bron} />
      <Bronvermelding label="Botanische illustratie" bron={illustratieVan(plant)?.bron} />
    </section>

    <footer className="scan-voet">
      <Link href="/">Bekijk de hele tuin</Link>
    </footer>

    </div>
  </main>;
}
