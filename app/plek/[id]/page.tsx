import type { Metadata } from 'next';
import Link from '@/app/components/NativeLink';
import { notFound, redirect } from 'next/navigation';
import { hoofdletter, korteBotanischeNaam, months, takenVoorMaand } from '@/app/data/tuinTekst';
import { Functies, PlantFoto } from '@/app/components/paspoortDelen';
import { icoonPad } from '@/app/data/iconen';
import { laadBeplanting, laadPlanten, laadZones, zoekZone } from '@/app/lib/tuinData';
import ScanKop from '@/app/components/ScanKop';
import Plattegrond from '@/app/components/Plattegrond';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

/**
 * De cijfers en letters uit tuin.json zijn legenda-notatie voor de gedrukte plattegrond,
 * geen namen. Wie hier staat ziet de plek al; die hoeft geen nummer te lezen.
 * Daarom noemt deze pagina alleen wat er groeit.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const zone = await zoekZone(decodeURIComponent((await params).id));
  if (!zone) return { title: 'Plek niet gevonden · Weener XL' };
  const [planten, beplanting] = await Promise.all([laadPlanten(), laadBeplanting()]);
  const namen = (beplanting[zone.id] || zone.planten)
    .map((slug) => planten.find((plant) => plant.slug === slug)?.naam)
    .filter((naam) => naam !== undefined);
  const titel = namen.length > 0 ? namen.map(hoofdletter).join(', ') : 'Deze plek';
  return { title: `${titel} · tuin van Weener XL`, description: 'Bekijk welke planten hier in de tuin van Weener XL staan.' };
}

export default async function PlekPagina({ params }: Props) {
  const { id } = await params;
  const zones = await laadZones();
  const zone = zones.find((plek) => plek.id === decodeURIComponent(id));
  if (!zone) notFound();

  const [planten, beplanting] = await Promise.all([laadPlanten(), laadBeplanting()]);
  const slugs = beplanting[zone.id] || zone.planten;
  const hier = slugs.map((slug) => planten.find((plant) => plant.slug === slug)).filter((plant) => plant !== undefined);
  const namen = Object.fromEntries(zones.map((plek) => [plek.id, (beplanting[plek.id] || plek.planten)
    .map((slug) => planten.find((plant) => plant.slug === slug)?.naam)
    .filter((naam): naam is string => Boolean(naam))]));
  const maand = months[new Date().getMonth()];
  const taken = hier.flatMap((plant) => takenVoorMaand(plant, maand).map((taak) => ({ plant, taak })));

  // Een boom of heester is één soort; dezelfde letter staat overal voor dezelfde plant.
  // Een tussenpagina voegt dan niets toe, dus die QR gaat meteen naar het plantenpaspoort.
  if (zone.soort === 'heester' && hier.length === 1) redirect(`/plant/${hier[0].slug}`);

  return <main className="scan scan-plek">
    <ScanKop />
    <div className="scan-vel">
    <div className="scan-plek-layout">
    <div className="scan-plek-kaart" role="img" aria-label={`Plattegrond met ${zone.label || 'de gekozen plek'} uitgelicht`}>
      <Plattegrond zones={zones} gekozen={zone.id} namen={namen} plants={planten} placements={beplanting} />
    </div>
    <div className="scan-plek-inhoud">

    <header className="scan-plek-kop">
      <p className="eyebrow">JE STAAT HIER</p>
      <h1>Wat groeit hier?</h1>
      <p className="scan-plek-aantal">{hier.length} {hier.length === 1 ? 'plant' : 'planten'} op deze plek</p>
    </header>

    <div className="scan-plantenlijst">
      {hier.length === 0 && <p className="scan-geen-taak">Er staan nog geen planten op deze plek.</p>}
      {hier.map((plant) => <Link className="scan-plantregel" href={`/plant/${plant.slug}`} key={plant.slug}>
        <PlantFoto plant={plant} />
        <span>
          <Functies plant={plant} max={2} />
          <b>{plant.naam}</b>
          <i>{korteBotanischeNaam(plant.botanischeNaam)}</i>
          <small>{plant.intro}</small>
        </span>
        <strong aria-hidden="true">→</strong>
      </Link>)}
    </div>

    {taken.length > 0 && <section className="scan-nu">
      <p className="eyebrow">WAT KAN IK HIER NU DOEN?</p>
      <h2>{maand}</h2>
      {taken.map(({ plant, taak }) => <div className="scan-taak" key={`${plant.slug}-${taak.type}`}>
        <img className="taak-icoon" src={icoonPad(taak.type === 'Oogsten' ? 'oogst' : 'snoei')} alt="" />
        <div><b>{taak.type}: {plant.naam}</b>{taak.uitleg && <p>{taak.uitleg}</p>}</div>
      </div>)}
    </section>}

    <footer className="scan-voet">
      <Link href="/">Bekijk de hele tuin</Link>
    </footer>

    </div>
    </div>
    </div>
  </main>;
}
