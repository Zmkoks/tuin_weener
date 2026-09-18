import type { ReactNode } from 'react';
import type { Plant } from '@/app/data/plantTypes';
import type { Plek } from '@/app/data/plekTypes';
import tekst from '@/app/data/boekjeTeksten.json';
import { hoofdletter } from '@/app/data/tuinTekst';
import type { BoekjeInhoud, Zoekregel } from '@/app/lib/boekjeInhoud';
import Plattegrond from '../Plattegrond';
import KaartIndex from '../kaartIndex';
import { BOEKJE_TITEL } from './BoekPlantPagina';

const v = tekst.voorwerk;

function Voet({ nummer, jaar }: { nummer: number; jaar: number }) {
  return <footer className="bv-voet"><b>{nummer}</b><span>{BOEKJE_TITEL} / {jaar}</span></footer>;
}

function Pagina({ nummer, jaar, naam, klasse = '', children }: {
  nummer: number; jaar: number; naam: string; klasse?: string; children: ReactNode;
}) {
  return <article className={`bp-pagina bv-pagina ${nummer % 2 === 0 ? 'bp-links' : ''} ${klasse}`}
    data-pagina={nummer} data-paginanaam={naam}>
    <div className="bp-bies" />
    <div className="bp-inhoud">{children}</div>
    <Voet nummer={nummer} jaar={jaar} />
  </article>;
}

function Kop({ label, titel, intro }: { label: string; titel: string; intro?: string }) {
  return <><div className="bv-label">{label}</div><h1>{titel}</h1>{intro && <p className="bv-inleiding">{intro}</p>}</>;
}

function Inhoud({ plan, kolommen, nummer, jaar }: { plan: BoekjeInhoud; kolommen: Plant[][]; nummer: number; jaar: number }) {
  const items: [number, string][] = [
    [plan.nummers.zoek, 'Welke plant, welke pagina?'], [plan.nummers.kaart, 'Plattegrond'],
    [plan.nummers.water, 'Water geven'], [plan.nummers.functies, 'Functies en kalender'],
    [plan.nummers.termen, 'Vaktermen en tekeningen'], [plan.nummers.sectie, 'De planten'],
  ];
  return <Pagina nummer={nummer} jaar={jaar} naam="Inhoud" klasse="bv-inhoudpagina">
    <header className="bv-inhoud-kop"><div className="bv-label">{v.label_tuin}</div><h1>{v.inhoud}{nummer > 1 ? ' (vervolg)' : ''}</h1></header>
    <div className="bv-inhoud-body">
      <div className="bv-inhoud-subkop">{v.in_dit_boekje}</div>
      <div className="bv-inhoud-hoofdgrid">{items.map(([nr, titel]) => <div className="bv-inhoud-hoofdregel" key={nr}>
        <span className="bv-inhoud-cirkel">{nr}</span><span>{titel}</span></div>)}</div>
      <div className="bv-inhoud-scheidingslijn" />
      <h2 className="bv-inhoud-plantenkop">{v.planten}</h2><p className="bv-inhoud-plantenhint">{v.paginanummer}</p>
      <div className="bv-inhoud-plantgrid">{kolommen.map((kolom, i) => <div key={i}>{kolom.map((plant) =>
        <div className="bv-inhoud-plantregel" key={plant.slug} data-verwijzing={plant.slug} data-doelpagina={plan.paginaVan[plant.slug]}>
          <span className="bv-inhoud-cirkel">{plan.paginaVan[plant.slug]}</span><span>{hoofdletter(plant.naam)}</span>
        </div>)}</div>)}</div>
      {plan.planten.length === 0 && <p>Er staan nog geen planten op een plek in de tuin.</p>}
    </div>
  </Pagina>;
}

function Zoeklijst({ kolommen, nummer, jaar, naastKaart }: { kolommen: Zoekregel[][]; nummer: number; jaar: number; naastKaart: boolean }) {
  return <Pagina nummer={nummer} jaar={jaar} naam="Welke plant, welke pagina?">
    <Kop label={v.label_plattegrond} titel={v.zoek_titel}
      intro={`Zoek het nummer of de letter van de plattegrond${naastKaart ? ' hiernaast' : ''} op. Daarachter staat op welke pagina die plant staat.`} />
    <div className="bv-zoektabel">{kolommen.map((kolom, i) => <table key={i}>
      <thead><tr><th>Plek</th><th>Plant</th><th>Blz.</th></tr></thead>
      <tbody>{kolom.map((regel) => <tr key={`${regel.label}-${regel.slug}`} data-verwijzing={regel.slug} data-doelpagina={regel.pagina}>
        <td className="bv-zt-nr">{regel.label}</td><td className="bv-zt-plant">{hoofdletter(regel.naam)}</td><td className="bv-zt-pag">{regel.pagina}</td>
      </tr>)}</tbody>
    </table>)}</div>
  </Pagina>;
}

function Druppels({ aantal }: { aantal: number }) {
  return <span className="bv-druppels" aria-label={`${aantal} druppels`}>{Array.from({ length: aantal }, (_, i) => <img key={i} src="/iconen/water_drop_no.svg" alt="" />)}</span>;
}

function Water({ nummer, jaar }: { nummer: number; jaar: number }) {
  return <Pagina nummer={nummer} jaar={jaar} naam={v.water_titel}>
    <Kop label={v.label_lezen} titel={v.water_titel} intro={v.water_intro} />
    <div className="bv-kernregel">{v.water_kern}</div>
    <h2>{v.vijf_niveaus}</h2><div className="bv-niveaus">{tekst.water_niveaus.map((uitleg, i) => <div className="bv-niveau" key={i}>
      <Druppels aantal={i + 1} /><div><strong>Niveau {i + 1}.</strong> {uitleg}</div>
    </div>)}</div>
    <h2>{v.bereik_titel}</h2><div className="bv-bereik-blok">
      <div className="bv-bereik-visual"><Druppels aantal={2} /><span className="bp-tot" /><Druppels aantal={3} /></div>
      <div><p>{v.bereik_1}</p><p><strong>{v.bereik_laag}</strong> {v.bereik_2} <strong>{v.bereik_hoog}</strong> {v.bereik_3}</p><p>{v.bereik_4}</p></div>
    </div>
    <h2>{v.gedeelde_titel}</h2><p>{v.gedeelde_tekst}</p>
  </Pagina>;
}

function Legenda({ items }: { items: string[][] }) {
  return <div className="bv-legenda">{items.map(([icoon, term, uitleg]) => <div className="bv-legenda-item" key={term}>
    <img src={`/iconen/${icoon}`} alt="" /><div><strong>{term}</strong><p>{uitleg}</p></div>
  </div>)}</div>;
}

function Functies({ nummer, jaar }: { nummer: number; jaar: number }) {
  return <Pagina nummer={nummer} jaar={jaar} naam={v.functies_titel} klasse="bv-functiepagina">
    <Kop label={v.label_lezen} titel={v.functies_titel} />
    <h2>{v.functies}</h2><p>{v.functies_intro}</p><Legenda items={tekst.functies} />
    <h2>{v.standplaats}</h2><Legenda items={tekst.standplaatsen} />
    <h2>{v.jaarkalender}</h2><p>Onderaan de meeste plantenpagina&rsquo;s staat een kalender. Gekleurde vakjes betekenen: in deze maand gebeurt dit.</p>
    <div className="bv-kalenderrijen">{Object.entries(v.kalender_uitleg).map(([soort, uitleg]) =>
      <div className="bv-kalenderrij" key={soort}><strong className={`bp-m-${soort}`}>{tekst.kalender_labels[soort as keyof typeof tekst.kalender_labels]}</strong><p>{uitleg}</p></div>)}</div>
    <div className="bv-kernregel">{v.snoei_kern}</div>
  </Pagina>;
}

function Termen({ groep, nummer, jaar }: { groep: number; nummer: number; jaar: number }) {
  const termen = [tekst.vaktermen.groep_1, tekst.vaktermen.groep_2, tekst.vaktermen.groep_3][groep];
  const midden = Math.ceil(termen.length / 2);
  return <Pagina nummer={nummer} jaar={jaar} naam={v.term_titels[groep]}>
    <Kop label={v.vaktermen_label} titel={v.term_titels[groep]} intro={v.term_intros[groep]} />
    <div className="bv-termen-grid">{[termen.slice(0, midden), termen.slice(midden)].map((kolom, i) => <dl key={i}>
      {kolom.map(([term, uitleg]) => <div className="bv-term" key={term}><dt>{term}</dt><dd>{uitleg}</dd></div>)}
    </dl>)}</div>
  </Pagina>;
}

/** Vaste ontwerpen uit de laatste pagina van de aangeleverde PDF's, op 300 dpi.
 * De oude ingedrukte voet wordt afgedekt; paginanummer en jaar volgen het actuele boekje. */
function Illustratie({ groep, nummer, jaar }: { groep: number; nummer: number; jaar: number }) {
  return <Pagina nummer={nummer} jaar={jaar} naam={`Tekening: ${v.term_titels[groep]}`} klasse="bv-illustratiepagina">
    <img className="bv-paginabeeld" src={`/boekje/vaktermen-${['delen', 'groei', 'hout'][groep]}.png`} alt={v.term_titels[groep]} />
  </Pagina>;
}

export function maakVoorwerk({ plan, plekken, planten, beplanting, jaar }: {
  plan: BoekjeInhoud; plekken: Plek[]; planten: Plant[]; beplanting: Record<string, string[]>; jaar: number;
}): ReactNode[] {
  const n = plan.nummers;
  const namen = Object.fromEntries(plekken.map((plek) => [plek.id, (beplanting[plek.id] ?? plek.planten)
    .map((slug) => planten.find((plant) => plant.slug === slug)?.naam).filter((naam): naam is string => Boolean(naam))]));
  const paginas: ReactNode[] = plan.inhoudPaginas.map((kolommen, i) => <Inhoud key={`inhoud-${i}`} plan={plan} kolommen={kolommen} nummer={i + 1} jaar={jaar} />);
  if (plan.uitlijnBlanco) paginas.push(<div className="bp-pagina bp-blanco" key="uitlijnen" />);
  paginas.push(...plan.zoekPaginas.map((kolommen, i) => <Zoeklijst key={`zoek-${i}`} kolommen={kolommen} nummer={n.zoek + i} jaar={jaar} naastKaart={i === plan.zoekPaginas.length - 1} />));
  paginas.push(<Pagina key="kaart" nummer={n.kaart} jaar={jaar} naam="Plattegrond" klasse="bv-kaartpagina">
    <div className="bv-kaart"><Plattegrond zones={plekken} plants={planten} placements={beplanting} namen={namen}
      indexLaag={<KaartIndex plekken={plekken} namen={namen} />} /></div>
  </Pagina>, <Water key="water" nummer={n.water} jaar={jaar} />, <Functies key="functies" nummer={n.functies} jaar={jaar} />);
  for (let groep = 0; groep < 3; groep++) {
    paginas.push(<Termen key={`termen-${groep}`} groep={groep} nummer={n.termen + groep * 2} jaar={jaar} />,
      <Illustratie key={`tekening-${groep}`} groep={groep} nummer={n.termen + groep * 2 + 1} jaar={jaar} />);
  }
  paginas.push(<div key="voor-planten" className="bp-pagina bp-blanco" />,
    <Pagina key="planten" nummer={n.sectie} jaar={jaar} naam="De planten" klasse="bv-sectiepagina">
      <img className="bv-paginabeeld" src="/boekje/planten-tussenpagina.png" alt="Planten" />
      <div className="bv-sectie-namen"><p>{plan.planten.map((plant) => plant.naam).join(' · ')}</p></div>
    </Pagina>);
  return paginas;
}
