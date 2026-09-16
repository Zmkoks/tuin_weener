import type { Plant } from '@/app/data/plantTypes';
import { fotoVan, illustratieVan } from '@/app/data/afbeeldingen';
import { icoonPad, standplaatsIcoon } from '@/app/data/iconen';
import { functionLabels, months, oogstInTuin, waterNiveaus } from '@/app/data/tuinTekst';
import { isOnkruid } from '../paspoortDelen';

/**
 * Eén plant op één A5-pagina, zoals `maak_pagina_fragment` in sept_booklet_layout.py hem
 * opmaakte (voorbeeld: plantpagina_voorbeeld.png).
 *
 * Bewust niet opgebouwd uit de secties van de plantenpagina op de site: die hebben links,
 * iconen in de koppen en een andere volgorde. Wel dezelfde gegevensregels, zodat papier en
 * scherm niets anders beweren:
 *  - oogstblok en oogstrij in de kalender alleen bij `oogstInTuin`;
 *  - gevaarlijke planten een band "Pas op" direct onder de kop;
 *  - onkruid krijgt de regelvakken van de site in plaats van Toegestaan/Niet doen.
 * Die drie bestonden nog niet toen de Python-generator werd geschreven.
 */

const MAAND_KORT = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
export const BOEKJE_TITEL = 'Plantenboekje';

/** Maanden in kalendervolgorde en kleine letters. */
function geordend(maanden: string[]) {
  return months.filter((m) => maanden.includes(m)).map((m) => m.toLowerCase());
}

/** Uit plantenboekje_teksten.json: "maart tot en met augustus". */
function maandReeks(maanden: string[]) {
  const klein = geordend(maanden);
  return klein.length < 2 ? klein.join('') : `${klein[0]} tot en met ${klein[klein.length - 1]}`;
}

/** "april, mei en juni". */
function maandOpsomming(maanden: string[]) {
  const klein = geordend(maanden);
  return klein.length < 2 ? klein.join('') : `${klein.slice(0, -1).join(', ')} en ${klein[klein.length - 1]}`;
}

/** Dezelfde zin als `seizoen_tekst` in de Python-generator. */
function seizoenTekst(plant: Plant) {
  const delen: string[] = [];
  if (plant.groei.length) {
    delen.push(`De plant groeit van ${maandReeks(plant.groei)}${plant.bloei.length ? ` en bloeit in ${maandOpsomming(plant.bloei)}.` : '.'}`);
  } else if (plant.bloei.length) {
    delen.push(`De plant bloeit in ${maandOpsomming(plant.bloei)}.`);
  }
  if (plant.sterf.length) {
    delen.push(`In ${maandOpsomming(plant.sterf)} trekt de plant zich terug en rust hij tot het voorjaar.`);
  }
  return delen.join(' ');
}

function Functielabel({ plant }: { plant: Plant }) {
  const naam = (f: string) => functionLabels[f] || f;
  const primair = plant.functies.primair.map(naam).join(' · ');
  const bijzaak = [...plant.functies.secundair.map(naam), plant.levensduur].filter(Boolean).join(' · ');
  return <div className="bp-functies">
    {primair}
    {bijzaak && <span className="bp-bijzaak">{primair ? ' · ' : ''}{bijzaak}</span>}
  </div>;
}

function Druppels({ plant }: { plant: Plant }) {
  const { laag, hoog } = waterNiveaus(plant);
  if (!laag && !hoog) return null;
  const rij = (n: number, s: string) => Array.from({ length: n }, (_, i) =>
    <img className="bp-druppel" src={icoonPad('water_drop_no')} alt="" key={`${s}${i}`} />);
  return <div className="bp-druppels" role="img" aria-label={laag === hoog ? `Waterbehoefte ${laag} van 5` : `Waterbehoefte ${laag} tot ${hoog} van 5`}>
    {rij(laag, 'l')}
    {laag !== hoog && <><span className="bp-tot" />{rij(hoog, 'h')}</>}
  </div>;
}

function Blok({ kop, children }: { kop: string; children: React.ReactNode }) {
  return <><div className="bp-bodykop">{kop}</div>{children}</>;
}

function Regelvakken({ plant }: { plant: Plant }) {
  const onkruid = isOnkruid(plant);
  if (onkruid && plant.gevaarlijk) {
    return <section className="bp-regels bp-regels-een">
      <div className="bp-regelbox bp-nietdoen">
        <strong>Haal weg:</strong> {plant.woekerToestemming}
        {plant.snoeiTijd.length > 0 && <> <strong>Wanneer:</strong> {maandOpsomming(plant.snoeiTijd)}.</>}
      </div>
    </section>;
  }
  const links = onkruid
    ? { kop: 'Waarom laten staan?', tekst: plant.waaromLatenStaan || 'Deze plant mag blijven staan zolang hij andere planten niet hindert.' }
    : { kop: 'Toegestaan:', tekst: plant.woekerToestemming };
  // Eerst het moment (het verbod), dan hoe ver je mag gaan — zoals SectieMoetBlijven op de site.
  const rechts = onkruid
    ? { kop: 'Wanneer weghalen?', tekst: [plant.woekerVerbod, plant.woekerToestemming].filter(Boolean).join(' ') }
    : { kop: 'Niet doen:', tekst: plant.woekerVerbod };
  if (!links.tekst && !rechts.tekst) return null;
  return <section className="bp-regels">
    {links.tekst && <div className="bp-regelbox bp-toegestaan"><strong>{links.kop}</strong> {links.tekst}</div>}
    {rechts.tekst && <div className="bp-regelbox bp-nietdoen"><strong>{rechts.kop}</strong> {rechts.tekst}</div>}
  </section>;
}

function Kalender({ plant }: { plant: Plant }) {
  const rijen: [string, string, string[]][] = [
    ['Groei', 'groei', plant.groei],
    ['Bloei', 'bloei', plant.bloei],
    ['Oogst', 'oogst', oogstInTuin(plant) ? [...plant.oogstTijd, ...plant.extraOogstTijd] : []],
    ['Snoei', 'snoei', plant.snoeiTijd],
    ['Rust', 'rust', plant.sterf],
  ];
  return <section className="bp-kalender">
    <table>
      <thead><tr><th />{MAAND_KORT.map((m) => <th key={m}>{m}</th>)}</tr></thead>
      <tbody>
        {rijen.map(([label, soort, actief]) => <tr key={soort}>
          <td className="bp-rijlabel">{label}</td>
          {months.map((m) => <td key={m} className={actief.includes(m) ? `bp-m-${soort}` : 'bp-m-leeg'} />)}
        </tr>)}
      </tbody>
    </table>
  </section>;
}

export default function BoekPlantPagina({ plant, nummer, jaar }: { plant: Plant; nummer: number; jaar: number }) {
  const foto = fotoVan(plant);
  const illustratie = illustratieVan(plant);
  const oogst = oogstInTuin(plant);
  const gevaarlijkOnkruid = isOnkruid(plant) && plant.gevaarlijk;
  const seizoen = seizoenTekst(plant);
  const waterStandplaats = [plant.waterInfo, plant.zonInfo].filter(Boolean).join(' ');
  const snoei = [plant.snoeiTijdInfo, plant.snoeiMethode, plant.snoeiInformatie].filter(Boolean);
  const extraEetbaar = !oogst && plant.eetbaar !== false ? plant.eetbaarInfo : '';
  // Even pagina's liggen links in het opengeslagen boekje; de groene bies hoort aan de buitenrand.
  const links = nummer % 2 === 0;

  return <article className={`bp-pagina${links ? ' bp-links' : ''}`} data-plant={plant.naam}>
    <div className="bp-bies" />

    <header className="bp-kop">
      <div className="bp-kop-tekst">
        <Functielabel plant={plant} />
        <h1>{plant.naam.charAt(0).toUpperCase() + plant.naam.slice(1)}</h1>
        {plant.botanischeNaam && <div className="bp-botanisch">{plant.botanischeNaam}</div>}
        {plant.intro && <p className="bp-inleiding">{plant.intro}</p>}
        <Druppels plant={plant} />
      </div>
      {/* Ronde foto met de afstelling uit Beheren; het kader knipt af, dus inzoomen mag. */}
      <div className="bp-foto">
        {foto && <img src={foto.src} style={foto.stijlMetZoom} alt={plant.naam} />}
      </div>
    </header>

    {plant.gevaarlijk && plant.gevaarlijkInfo && <section className="bp-gevaar">
      <strong>Pas op:</strong> {plant.gevaarlijkInfo}
    </section>}

    <section className="bp-tekst">
      {(illustratie || plant.weetje) && <div className="bp-illustratie-blok">
        {illustratie && <>
          <img className="bp-illustratie" src={illustratie.src} style={illustratie.stijl} alt={`Botanische illustratie van de ${plant.naam}`} />
          <div className="bp-bijschrift">Botanische illustratie van de {plant.naam}.</div>
        </>}
        {plant.weetje && <div className="bp-weetje"><div className="bp-weetje-kop">Wist je dat?</div>{plant.weetje}</div>}
      </div>}

      {(plant.zon || waterStandplaats) && <Blok kop="Water en standplaats">
        {plant.zon && <div className="bp-standplaats">
          <img src={icoonPad(standplaatsIcoon(plant.zon))} alt="" /><span>{plant.zon}</span>
        </div>}
        {waterStandplaats && <p>{waterStandplaats}</p>}
      </Blok>}

      {plant.tuinOpmerking && !gevaarlijkOnkruid && <Blok kop="In onze tuin"><p>{plant.tuinOpmerking}</p></Blok>}
      {oogst && plant.oogstMethode && <Blok kop="Oogst en gebruik"><p>{plant.oogstMethode}</p></Blok>}
      {extraEetbaar && <Blok kop="Extra informatie"><p>{extraEetbaar}</p></Blok>}
      {snoei.length > 0 && !gevaarlijkOnkruid && <Blok kop="Snoei door het jaar">{snoei.map((tekst, i) => <p key={i}>{tekst}</p>)}</Blok>}
      {seizoen && <Blok kop="Door het seizoen"><p>{seizoen}</p></Blok>}
    </section>

    <Regelvakken plant={plant} />
    <Kalender plant={plant} />

    <footer className="bp-voet"><b>{nummer}</b> {BOEKJE_TITEL} / {jaar}</footer>
  </article>;
}
