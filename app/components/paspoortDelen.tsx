import Link from '@/app/components/NativeLink';
import type { Plant } from '../data/plantTypes';
import { fotoVan, illustratieVan } from '../data/afbeeldingen';
import { functieIcoon, icoonPad, standplaatsIcoon } from '../data/iconen';
import { functionLabels, months, monthShort, oogstInTuin, waterNiveaus } from '../data/tuinTekst';
import { metVaktermen } from '../data/vaktermLinks';
import IllustratieGroot from './IllustratieGroot';

/**
 * Foto van een plant, of een nette vervanger wanneer er nog geen foto is. De foto staat
 * in beeld zoals hij is afgesteld — geüpload via Beheren, of uit `foto_instellingen.json`
 * voor de foto's die er al waren.
 *
 * `inKader` mag alleen aan als er een element met `overflow: hidden` omheen staat dat
 * even groot is als de foto; alleen dan wordt er ook ingezoomd. Overal elders schuift de
 * uitsnede wel mee, maar blijft de foto binnen zijn eigen vak.
 */
export function PlantFoto({ plant, className, inKader }: { plant: Plant; className?: string; inKader?: boolean }) {
  const beeld = fotoVan(plant);
  if (beeld) return <img className={className} src={beeld.src} style={inKader ? beeld.stijlMetZoom : beeld.stijl} alt={plant.naam} />;
  return <span className={`foto-leeg ${className || ''}`} role="img" aria-label={`Nog geen foto van ${plant.naam}`}>{plant.naam.slice(0, 1).toUpperCase()}</span>;
}

/** Rij druppels, net als op de plantenkaart. Met `tot` wordt het een bereik: 2 — 3. */
export function Druppels({ van, tot }: { van: number; tot?: number }) {
  const hoog = tot === undefined ? van : tot;
  const druppel = (sleutel: string) => <img className="druppel" src={icoonPad('water_drop_no')} alt="" key={sleutel} />;
  return <div className="druppels" role="img" aria-label={van === hoog ? `Waterbehoefte ${van} van 5` : `Waterbehoefte ${van} tot ${hoog} van 5`}>
    {Array.from({ length: van }, (_, i) => druppel(`van-${i}`))}
    {van !== hoog && <>
      <span className="druppel-tot" />
      {Array.from({ length: hoog }, (_, i) => druppel(`tot-${i}`))}
    </>}
  </div>;
}

/**
 * De waterbehoefte van een plant als druppelrij: ondergrens — bovengrens.
 *
 * Met `naarUitleg` is de rij zelf een link naar het niveau van deze plant op
 * /uitleg/water. Alleen aanzetten waar de druppels niet al ín een link staan.
 */
export function Waterdruppels({ plant, naarUitleg }: { plant: Plant; naarUitleg?: boolean }) {
  const { laag, hoog } = waterNiveaus(plant);
  if (laag === 0 && hoog === 0) return null;
  const rij = <Druppels van={laag} tot={hoog} />;
  if (!naarUitleg) return rij;
  return <Link className="icoon-uitleg" href={`/uitleg/water#niveau-${laag || hoog}`} aria-label="Wat betekenen deze druppels?" title="Wat betekenen deze druppels?">{rij}</Link>;
}

/**
 * Functies als icoon met bijschrift, zoals op de plantenkaart. Zie `naarUitleg` hierboven.
 *
 * Secundaire functies stonden hier eerst als tekstregel eronder ("Ook: Insecten"). Dat was
 * de enige plek op de pagina waar een functie een woord was in plaats van een icoon, en dat
 * brak het ritme van de rij erboven. Nu staan ze in dezelfde rij, maar vervaagd en met een
 * grijs bijschrift, zodat je ziet dat ze minder zwaar wegen zonder dat er een regel bij komt.
 */
export function Functies({ plant, max, naarUitleg }: { plant: Plant; max?: number; naarUitleg?: boolean }) {
  const primair = (max ? plant.functies.primair.slice(0, max) : plant.functies.primair).filter((f) => functieIcoon[f]);
  const secundair = max ? [] : plant.functies.secundair.filter((f) => functieIcoon[f]);
  if (primair.length === 0 && secundair.length === 0) return null;

  const item = (f: string, bijzaak: boolean) => {
    const naam = (functionLabels[f] || f).toLowerCase();
    const klasse = `functie-item${bijzaak ? ' functie-bijzaak' : ''}`;
    // Bij een bijzaak vertelt de omschrijving ook dát het er een is; het vervaagde icoon
    // alleen zegt dat niet aan wie de pagina laat voorlezen.
    const omschrijving = bijzaak ? `Ook ${naam} — wat betekent dat?` : `Wat betekent ${naam}?`;
    const inhoud = <>
      <img src={icoonPad(functieIcoon[f])} alt="" />
      <em>{naam}</em>
    </>;
    if (!naarUitleg) return <span className={klasse} key={f}>{inhoud}</span>;
    return <Link className={klasse} href={`/uitleg/functies#functie-${f}`} aria-label={omschrijving} title={omschrijving} key={f}>{inhoud}</Link>;
  };

  return <div className="functie-iconen">
    {primair.map((f) => item(f, false))}
    {secundair.map((f) => item(f, true))}
  </div>;
}

/** Standplaats als icoon met bijschrift, zoals in het boekje. Zie `naarUitleg` hierboven. */
export function Standplaats({ plant, naarUitleg }: { plant: Plant; naarUitleg?: boolean }) {
  if (!plant.zon) return null;
  const icoon = standplaatsIcoon(plant.zon);
  const inhoud = <>
    <img src={icoonPad(icoon)} alt="" />
    <em>{plant.zon}</em>
  </>;
  if (!naarUitleg) return <span className="standplaats">{inhoud}</span>;
  return <Link className="standplaats" href={`/uitleg/functies#standplaats-${icoon}`} aria-label={`Wat betekent ${plant.zon}?`} title={`Wat betekent ${plant.zon}?`}>{inhoud}</Link>;
}

const KALENDER_RIJEN = ['groei', 'bloei', 'oogst', 'snoei'] as const;

export function Kalender({ plant }: { plant: Plant }) {
  const rows = [
    ['Groei', plant.groei, 'grow'],
    ['Bloei', plant.bloei, 'bloom'],
    ['Oogst', oogstInTuin(plant) ? [...plant.oogstTijd, ...plant.extraOogstTijd] : [], 'harvest'],
    ['Snoei', plant.snoeiTijd, 'prune'],
    ['Rust', plant.sterf, 'rest'],
  ] as const;
  return <div className="calendar">
    <div />
    <>{monthShort.map((m, i) => <b key={i}>{m}</b>)}</>
    {rows.map(([label, active, kind], index) => <div className="calendar-row" key={label}>
      <strong>
        <Link className="kalender-rijkop" href={`/uitleg/functies#kalender-${kind}`} title={`Wat betekent ${label.toLowerCase()}?`}>
          {KALENDER_RIJEN[index] && <img className="kalender-icoon" src={icoonPad(KALENDER_RIJEN[index])} alt="" />}
          {label}
        </Link>
      </strong>
      {months.map((m) => <i className={active.includes(m) ? kind : ''} key={m} title={`${label}: ${m}`} />)}
    </div>)}
  </div>;
}

/** Kop van een tekstblok, met het icoon van de plantenkaart ervoor. */
function Blokkop({ icoon, children }: { icoon?: string; children: React.ReactNode }) {
  return <h3>{icoon && <img className="blok-icoon" src={icoonPad(icoon)} alt="" />}{children}</h3>;
}

export function SectieVerzorging({ plant }: { plant: Plant }) {
  return <section><Blokkop icoon="drop">Waterbehoefte &amp; standplaats</Blokkop><div className="blok-kenmerken"><Waterdruppels plant={plant} naarUitleg /><Standplaats plant={plant} naarUitleg /></div><p>{plant.waterInfo}</p><p>{plant.zonInfo}</p><Link className="uitleg-link" href="/uitleg/water">Wat betekenen de druppels? →</Link></section>;
}

export function SectieOogsten({ plant }: { plant: Plant }) {
  const maanden = [...plant.oogstTijd, ...plant.extraOogstTijd];
  if (maanden.length === 0 || !oogstInTuin(plant)) return null;
  return <section><Blokkop icoon="oogst1">Oogst &amp; gebruik</Blokkop><b>{maanden.join(', ')}</b><p>{plant.oogstMethode || plant.extraOogstMethode}</p></section>;
}

/** "juni, juli en augustus" */
const opsomming = (woorden: string[]) =>
  woorden.length < 2 ? woorden.join('') : `${woorden.slice(0, -1).join(', ')} en ${woorden[woorden.length - 1]}`;

/**
 * Eetbaarheid die geen gewone oogsttaak is: lavendel (sier), azarooldoorn (boom), of kiwi
 * die hier geen vruchten draagt. De kennis blijft zo bewaard zonder dat de maandlijst oproept
 * tot oogsten.
 */
export function SectieExtra({ plant }: { plant: Plant }) {
  if (oogstInTuin(plant) || plant.eetbaar === false) return null;
  const maanden = [...plant.oogstTijd, ...plant.extraOogstTijd];
  const methode = plant.oogstMethode || plant.extraOogstMethode;
  if (!plant.eetbaarInfo && !methode) return null;
  return <section className="extra"><h3>Extra informatie</h3>
    {plant.eetbaarInfo && <p>{plant.eetbaarInfo}</p>}
    {/* De maanden in een zin: als losse vetgedrukte rij ("Juni, Juli, Augustus.") zei niets
        waar ze over gingen — in het oogstblok doet de kop dat, hier niet. */}
    {maanden.length > 0 && <p><b>Plukken kan in {opsomming(maanden.map((m) => m.toLowerCase()))}.</b></p>}
    {methode && <p>{methode}</p>}
  </section>;
}

/** Wat alleen voor het exemplaar in deze tuin geldt, zoals een kiwi zonder vruchten. */
export function SectieInOnzeTuin({ plant }: { plant: Plant }) {
  if (!plant.tuinOpmerking) return null;
  return <section className="tuin-opmerking"><h3>In onze tuin</h3><p>{plant.tuinOpmerking}</p></section>;
}

/**
 * De tuinwoorden in de snoeitekst zijn zelf de link naar hun uitleg — geen losse regel
 * eronder die vraagt of je een woord niet kent. Zie `metVaktermen` in vaktermLinks.tsx.
 */
export function SectieSnoeien({ plant }: { plant: Plant }) {
  return <section><Blokkop icoon="snoei">Snoeien</Blokkop><b>{plant.snoeiTijd.join(', ') || 'Alleen wanneer nodig'}</b><p>{metVaktermen(plant.snoeiMethode)}</p><p>{metVaktermen(plant.snoeiInformatie)}</p></section>;
}

/** Onkruid als primaire óf secundaire functie: juist een plant die ook iets bijdraagt, is onkruid dat mag blijven. */
export function isOnkruid(plant: Plant) {
  return [...plant.functies.primair, ...plant.functies.secundair].includes('onkruid');
}

/**
 * Waarschuwing direct onder de kop, vóór alles wat geruststellend kan klinken. Gold eerst
 * alleen als zin in het roze regelvak onderaan, na "Deze maand hoef je niets te doen".
 */
export function SectieGevaar({ plant }: { plant: Plant }) {
  if (!plant.gevaarlijk || !plant.gevaarlijkInfo) return null;
  return <section className="scan-gevaar" role="note" aria-label="Waarschuwing">
    <span className="scan-gevaar-teken" aria-hidden="true">!</span>
    <div><h2>Pas op</h2><p>{plant.gevaarlijkInfo}</p></div>
  </section>;
}

/**
 * Bij gevaarlijk onkruid vervangt dit het blauwe maandvak én de twee regelvakken: er valt
 * niets af te wegen, alleen hoe en wanneer je hem weghaalt.
 */
export function SectieWeghalen({ plant }: { plant: Plant }) {
  return <section className="scan-weghalen">
    <p className="eyebrow">DIT IS ONKRUID</p>
    <h2>Haal weg</h2>
    <p>{plant.woekerToestemming}</p>
    {plant.snoeiTijd.length > 0 && <p><b>Wanneer:</b> {plant.snoeiTijd.join(', ').toLowerCase()}. {plant.snoeiTijdInfo}</p>}
  </section>;
}

export function SectieMagWeg({ plant }: { plant: Plant }) {
  if (isOnkruid(plant)) return <section className="allowed"><h3>Waarom laten staan?</h3><p>{plant.waaromLatenStaan || 'Deze plant mag blijven staan zolang hij andere planten niet hindert.'}</p></section>;
  return <section className="allowed"><h3>Toegestaan</h3><p>{plant.woekerToestemming}</p></section>;
}

export function SectieMoetBlijven({ plant }: { plant: Plant }) {
  // Eerst het moment (het verbod: "laat niet alle zaad rijp worden"), dan hoe ver je mag gaan.
  if (isOnkruid(plant)) return <section className="forbidden"><h3>Wanneer weghalen?</h3><p>{plant.woekerVerbod}</p><p>{plant.woekerToestemming}</p></section>;
  return <section className="forbidden"><h3>Niet doen</h3><p>{plant.woekerVerbod}</p></section>;
}

/** Botanische illustratie uit het boekje, net als naast de foto op de gedrukte pagina. */
export function SectieIllustratie({ plant }: { plant: Plant }) {
  const beeld = illustratieVan(plant);
  if (!beeld) return null;
  const bijschrift = `Botanische illustratie van de ${plant.naam}.`;
  return <section className="illustratie-blok">
    {/* `stijl` en niet `stijlMetZoom`: de illustratie wordt sinds 10 september 2026 niet meer
        bijgesteld. Ze staat in een recht kader en hoort gewoon volledig leesbaar te zijn; wie
        hem strakker wil, snijdt hem vooraf zelf bij. De opgeslagen `zoom` bij een enkele plant
        (de beemdooievaarsbek stond op 1,12) doet daarmee niets meer, in plaats van te blijven
        hangen op een waarde die niemand nog kan veranderen. */}
    <IllustratieGroot
      src={beeld.src}
      stijl={beeld.stijl}
      alt={`Botanische illustratie van de ${plant.naam}`}
      bijschrift={bijschrift}
    />
    <p className="illustratie-bijschrift">{bijschrift}</p>
  </section>;
}

export function SectieWeetje({ plant, className }: { plant: Plant; className?: string }) {
  if (!plant.weetje) return null;
  return <section className={`fact ${className || ''}`}><h3>Wist je dat?</h3><p>{plant.weetje}</p></section>;
}
