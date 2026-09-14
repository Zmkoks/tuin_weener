'use client';

/**
 * Het formulier van een plantpagina: de velden, een leeg formulier, een formulier
 * gevuld met een bestaande plant, en de omzetting naar wat de API verwacht.
 *
 * Gedeeld door "Nieuwe plant toevoegen" (PlantCreator) en "Informatie wijzigen"
 * (Beheren), zodat allebei dezelfde velden en dezelfde regels gebruiken.
 */

import type { Afbeelding, Plant } from '../data/plantTypes';
import { afstellingVanSlug } from '../data/fotoAfstelling';
import { plantFoto } from '../data/fotos';
import { plantIllustratie } from '../data/illustraties';
import AfbeeldingVeld, { type Afstelling } from './AfbeeldingVeld';
import SymboolVeld, { type Symboolkeuze } from './SymboolVeld';

export const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
export const FUNCTION_OPTIONS = ['fruit', 'kruid', 'insecten', 'vogel', 'sier', 'boom', 'onkruid'];
export const FUNCTION_LABELS: Record<string, string> = { fruit: 'Fruit', kruid: 'Kruiden', insecten: 'Insecten', vogel: 'Vogels', sier: 'Sier', boom: 'Bomen', onkruid: 'Onkruid' };

export type PlantForm = {
  naam: string;
  botanischeNaam: string;
  plantnummer: string;
  functiesPrimair: string;
  functiesSecundair: string;
  intro: string;
  weetje: string;
  waterOndergrens: string;
  waterBovengrens: string;
  waterInfo: string;
  zon: string;
  zonInfo: string;
  levensduur: string;
  oogstTijd: string;
  oogstMethode: string;
  extraOogstTijd: string;
  extraOogstMethode: string;
  snoeiTijd: string;
  snoeiTijdInfo: string;
  snoeiMethode: string;
  snoeiInformatie: string;
  woekerToestemming: string;
  woekerVerbod: string;
  groei: string;
  bloei: string;
  sterf: string;
  commons: string;
  commonsIllustraties: string;
  /** Ja/nee-keuzes als tekst: 'ja', 'nee' of '' (nog niet beoordeeld). */
  boomHeester: Keuze;
  eetbaar: Keuze;
  eetbaarInfo: string;
  oogstbaarInTuin: Keuze;
  tuinOpmerking: string;
  gevaarlijk: Keuze;
  gevaarlijkInfo: string;
  waaromLatenStaan: string;
  foto: Afstelling;
  illustratie: Afstelling;
  symbolen: Symboolkeuze;
};

export type Keuze = 'ja' | 'nee' | '';

/** `true`/`false`/`null` uit de gegevens naar de keuze in het formulier, en terug gaat via de server. */
export function keuzeVan(waarde: boolean | null | undefined): Keuze {
  return waarde === true ? 'ja' : waarde === false ? 'nee' : '';
}

/** Dezelfde slug als de server maakt, zodat een upload meteen de goede naam krijgt. */
export function slugVanNaam(naam: string) {
  return naam.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

const LEEG_BEELD: Afstelling = { bestand: '', bron: '', x: 50, y: 50, zoom: 1 };
/** `bibliotheek: null` betekent: alles uit de bibliotheek staat aan, zoals altijd. */
const LEGE_SYMBOLEN: Symboolkeuze = { bibliotheek: null, eigen: [], bron: '' };

export function nextPlantNumber(plants: Plant[]) {
  const numbers = plants.map((plant) => Number.parseInt(plant.plantnummer, 10)).filter(Number.isFinite);
  return String((numbers.length ? Math.max(...numbers) : 0) + 1);
}

export function blankForm(plants: Plant[]): PlantForm {
  return {
    naam: '', botanischeNaam: '', plantnummer: nextPlantNumber(plants), functiesPrimair: '', functiesSecundair: '', intro: '', weetje: '',
    waterOndergrens: '1', waterBovengrens: '3', waterInfo: '', zon: 'zon', zonInfo: '', levensduur: 'Meerjarig',
    oogstTijd: '', oogstMethode: '', extraOogstTijd: '', extraOogstMethode: '', snoeiTijd: '', snoeiTijdInfo: '',
    snoeiMethode: '', snoeiInformatie: '', woekerToestemming: '', woekerVerbod: '', groei: '', bloei: '', sterf: '', commons: '', commonsIllustraties: '',
    boomHeester: 'nee', eetbaar: '', eetbaarInfo: '', oogstbaarInTuin: '', tuinOpmerking: '', gevaarlijk: '', gevaarlijkInfo: '', waaromLatenStaan: '',
    foto: { ...LEEG_BEELD }, illustratie: { ...LEEG_BEELD }, symbolen: { ...LEGE_SYMBOLEN },
  };
}

/** De afbeelding van een plant als beginstand voor het formulier. */
function beeldVanPlant(bestaand: Afbeelding | undefined, standaard: Afstelling): Afstelling {
  if (!bestaand) return standaard;
  return { bestand: bestaand.bestand, bron: bestaand.bron, x: bestaand.x, y: bestaand.y, zoom: bestaand.zoom };
}

/** Een bestaande plantpagina in het formulier zetten: lijsten worden komma’s. */
export function formVanPlant(plant: Plant): PlantForm {
  const rij = (waarden: string[]) => waarden.join(', ');
  return {
    naam: plant.naam, botanischeNaam: plant.botanischeNaam, plantnummer: plant.plantnummer, functiesPrimair: rij(plant.functies.primair), functiesSecundair: rij(plant.functies.secundair),
    intro: plant.intro, weetje: plant.weetje, waterOndergrens: plant.waterOndergrens, waterBovengrens: plant.waterBovengrens,
    waterInfo: plant.waterInfo, zon: plant.zon, zonInfo: plant.zonInfo, levensduur: plant.levensduur,
    oogstTijd: rij(plant.oogstTijd), oogstMethode: plant.oogstMethode, extraOogstTijd: rij(plant.extraOogstTijd),
    extraOogstMethode: plant.extraOogstMethode, snoeiTijd: rij(plant.snoeiTijd), snoeiTijdInfo: plant.snoeiTijdInfo,
    snoeiMethode: plant.snoeiMethode, snoeiInformatie: plant.snoeiInformatie, woekerToestemming: plant.woekerToestemming,
    woekerVerbod: plant.woekerVerbod, groei: rij(plant.groei), bloei: rij(plant.bloei), sterf: rij(plant.sterf), commons: plant.commons, commonsIllustraties: plant.commonsIllustraties || '',
    boomHeester: keuzeVan(plant.boomHeester ?? false), eetbaar: keuzeVan(plant.eetbaar), eetbaarInfo: plant.eetbaarInfo || '',
    oogstbaarInTuin: keuzeVan(plant.oogstbaarInTuin), tuinOpmerking: plant.tuinOpmerking || '',
    gevaarlijk: keuzeVan(plant.gevaarlijk), gevaarlijkInfo: plant.gevaarlijkInfo || '', waaromLatenStaan: plant.waaromLatenStaan || '',
    // Staat er nog niets eigens, dan begint het schuifje waar de gedrukte kaart staat.
    foto: beeldVanPlant(plant.foto, { ...LEEG_BEELD, ...afstellingVanSlug(plant.slug) }),
    illustratie: beeldVanPlant(plant.illustratie, { ...LEEG_BEELD }),
    symbolen: plant.symbolen
      ? { bibliotheek: plant.symbolen.bibliotheek, eigen: plant.symbolen.eigen, bron: plant.symbolen.eigen[0]?.bron || '' }
      : { ...LEGE_SYMBOLEN },
  };
}

export function splitList(value: string) {
  return [...new Set(value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))];
}

export function TextField({ id, label, value, onChange, multiline = false, type = 'text', placeholder, help }: { id: keyof PlantForm; label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string; placeholder?: string; help?: string }) {
  return <label className={`plant-field ${multiline ? 'wide' : ''}`} htmlFor={`plant-${id}`}><span>{label}</span>{multiline ? <textarea id={`plant-${id}`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} /> : <input id={`plant-${id}`} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}{help && <small>{help}</small>}</label>;
}

/** Een ja/nee-vraag met een uitdrukkelijke "weet ik niet"; die bewaart de server als niet beoordeeld. */
function KeuzeField({ id, label, value, onChange, help, zonderOnbekend = false }: { id: keyof PlantForm; label: string; value: Keuze; onChange: (value: Keuze) => void; help?: string; zonderOnbekend?: boolean }) {
  return <label className="plant-field" htmlFor={`plant-${id}`}><span>{label}</span>
    <select id={`plant-${id}`} value={value} onChange={(event) => onChange(event.target.value as Keuze)}>
      <option value="ja">Ja</option>
      <option value="nee">Nee</option>
      {!zonderOnbekend && <option value="">Weet ik niet</option>}
    </select>{help && <small>{help}</small>}</label>;
}

export function PlantFormFields({ form, setForm }: { form: PlantForm; setForm: (form: PlantForm) => void }) {
  const update = (id: keyof PlantForm, value: string) => setForm({ ...form, [id]: value });
  // Een nieuwe plant heeft nog geen slug; die leiden we af uit de naam, net als de server.
  const slug = slugVanNaam(form.naam);
  return <>
    <div className="plant-form-section"><h3>Basisinformatie</h3><div className="plant-field-grid">
      <TextField id="naam" label="Nederlandse naam" value={form.naam} onChange={(value) => update('naam', value)} placeholder="bijv. Oost-Indische kers" />
      <TextField id="botanischeNaam" label="Botanische naam" value={form.botanischeNaam} onChange={(value) => update('botanischeNaam', value)} placeholder="bijv. Tropaeolum majus" />
      <TextField id="plantnummer" label="Plantnummer" value={form.plantnummer} onChange={(value) => update('plantnummer', value)} type="number" help="Laat het voorgestelde nummer staan als dit de volgende plant is." />
      <TextField id="functiesPrimair" label="Primaire functies (1–2)" value={form.functiesPrimair} onChange={(value) => update('functiesPrimair', value)} placeholder="kruid" help="fruit, kruid, insecten, vogel, sier, boom, onkruid" />
      <TextField id="functiesSecundair" label="Secundaire functies" value={form.functiesSecundair} onChange={(value) => update('functiesSecundair', value)} placeholder="insecten" />
      <TextField id="intro" label="Korte introductie" value={form.intro} onChange={(value) => update('intro', value)} multiline placeholder="Wat valt meteen op aan deze plant?" />
      <TextField id="weetje" label="Wist-je-datje" value={form.weetje} onChange={(value) => update('weetje', value)} multiline placeholder="Een leuk of verrassend feit." />
    </div></div>
    <div className="plant-form-section"><h3>Verzorging</h3><div className="plant-field-grid">
      <TextField id="waterOndergrens" label="Water: minimum (1–5)" value={form.waterOndergrens} onChange={(value) => update('waterOndergrens', value)} type="number" />
      <TextField id="waterBovengrens" label="Water: maximum (1–5)" value={form.waterBovengrens} onChange={(value) => update('waterBovengrens', value)} type="number" />
      <TextField id="zon" label="Standplaats" value={form.zon} onChange={(value) => update('zon', value)} placeholder="zon of halfschaduw" />
      <TextField id="levensduur" label="Levensduur" value={form.levensduur} onChange={(value) => update('levensduur', value)} placeholder="Meerjarig" />
      <TextField id="waterInfo" label="Water geven" value={form.waterInfo} onChange={(value) => update('waterInfo', value)} multiline />
      <TextField id="zonInfo" label="Informatie standplaats" value={form.zonInfo} onChange={(value) => update('zonInfo', value)} multiline />
    </div></div>
    <div className="plant-form-section"><h3>Oogsten en snoeien</h3><div className="plant-field-grid">
      <TextField id="oogstTijd" label="Oogstmaanden" value={form.oogstTijd} onChange={(value) => update('oogstTijd', value)} placeholder="Juni, Juli" help="Gebruik maandnamen, gescheiden door komma’s." />
      <TextField id="extraOogstTijd" label="Extra oogstmaanden" value={form.extraOogstTijd} onChange={(value) => update('extraOogstTijd', value)} placeholder="Oktober" />
      <TextField id="oogstMethode" label="Hoe oogsten?" value={form.oogstMethode} onChange={(value) => update('oogstMethode', value)} multiline />
      <TextField id="extraOogstMethode" label="Extra oogstinformatie" value={form.extraOogstMethode} onChange={(value) => update('extraOogstMethode', value)} multiline />
      <TextField id="snoeiTijd" label="Snoeimaanden" value={form.snoeiTijd} onChange={(value) => update('snoeiTijd', value)} placeholder="Maart, Augustus" />
      <TextField id="snoeiTijdInfo" label="Wanneer snoeien?" value={form.snoeiTijdInfo} onChange={(value) => update('snoeiTijdInfo', value)} multiline />
      <TextField id="snoeiMethode" label="Hoe snoeien?" value={form.snoeiMethode} onChange={(value) => update('snoeiMethode', value)} multiline />
      <TextField id="snoeiInformatie" label="Extra snoei-informatie" value={form.snoeiInformatie} onChange={(value) => update('snoeiInformatie', value)} multiline />
    </div></div>
    {/* Twee soorten informatie: over de soort (overal waar), en over het exemplaar hier. Die
        staan apart omdat ze elkaar kunnen tegenspreken: een kiwi is eetbaar, maar deze draagt
        geen vruchten. */}
    <div className="plant-form-section"><h3>Over de soort</h3><div className="plant-field-grid">
      <KeuzeField id="boomHeester" label="Is dit een boom of heester?" value={form.boomHeester} onChange={(value) => setForm({ ...form, boomHeester: value })} zonderOnbekend
        help="Ja: hij kan als los punt met een letter op de kaart staan. Nee: hij staat in een bak of vrije plek." />
      <KeuzeField id="eetbaar" label="Eetbaar?" value={form.eetbaar} onChange={(value) => setForm({ ...form, eetbaar: value })} help="Of de soort of een deel ervan veilig gegeten kan worden." />
      <KeuzeField id="gevaarlijk" label="Gevaarlijk?" value={form.gevaarlijk} onChange={(value) => setForm({ ...form, gevaarlijk: value })} help="Ja geeft bovenaan de pagina een waarschuwing." />
      <TextField id="eetbaarInfo" label="Wat is eetbaar?" value={form.eetbaarInfo} onChange={(value) => update('eetbaarInfo', value)} multiline />
      <TextField id="gevaarlijkInfo" label="Waarschuwing" value={form.gevaarlijkInfo} onChange={(value) => update('gevaarlijkInfo', value)} multiline placeholder="Wat is gevaarlijk, en wat moet je doen?" />
      <TextField id="waaromLatenStaan" label="Onkruid: waarom laten staan?" value={form.waaromLatenStaan} onChange={(value) => update('waaromLatenStaan', value)} multiline help="Alleen bij onkruid dat veilig mag blijven." />
    </div></div>
    <div className="plant-form-section"><h3>Deze plant in onze tuin</h3><div className="plant-field-grid">
      <KeuzeField id="oogstbaarInTuin" label="Levert hij hier echt oogst op?" value={form.oogstbaarInTuin} onChange={(value) => setForm({ ...form, oogstbaarInTuin: value })} help="Nee: geen oogsttaken, ook als de soort eetbaar is." />
      <TextField id="tuinOpmerking" label="Bijzonderheid in onze tuin" value={form.tuinOpmerking} onChange={(value) => update('tuinOpmerking', value)} multiline placeholder="bijv. Deze kiwi draagt geen vruchten." />
    </div></div>
    <div className="plant-form-section"><h3>Wat mag weg?</h3><div className="plant-field-grid">
      <TextField id="woekerToestemming" label="Dit mag een deelnemer verwijderen" value={form.woekerToestemming} onChange={(value) => update('woekerToestemming', value)} multiline />
      <TextField id="woekerVerbod" label="Dit moet blijven / mag niet" value={form.woekerVerbod} onChange={(value) => update('woekerVerbod', value)} multiline />
    </div></div>
    <div className="plant-form-section"><h3>Jaarkalender</h3><div className="plant-field-grid">
      <TextField id="groei" label="Groei" value={form.groei} onChange={(value) => update('groei', value)} placeholder="April, Mei, Juni" />
      <TextField id="bloei" label="Bloei" value={form.bloei} onChange={(value) => update('bloei', value)} placeholder="Mei, Juni" />
      <TextField id="sterf" label="Rust / sterfte" value={form.sterf} onChange={(value) => update('sterf', value)} placeholder="November, December" />
    </div><p className="field-note">Vul maanden in als losse namen, bijvoorbeeld <b>April, Mei, Juni</b>.</p></div>
    <div className="plant-form-section media-section">
      <h3>Foto, illustratie en symbool handmatig toevoegen</h3>
      <p className="media-intro">Deze drie afbeeldingen komen niet uit de gegevensprompt. Voeg ze hier zelf toe. Kies bestanden die je mag gebruiken en noteer altijd de bron.</p>
      {/* Elk blok staat op zichzelf: kop met de hulp die erbij hoort, wat er nu staat, wat je
          ermee kunt, en de bron. De hulpteksten stonden hiervoor met z'n tweeën bovenaan de
          sectie, los van het veld waar ze over gingen, en het symbool — het lastigste van de
          drie — had er helemaal geen. */}
      <AfbeeldingVeld
        soort="foto"
        titel="Foto"
        slug={slug}
        waarde={form.foto}
        onChange={(waarde) => setForm({ ...form, foto: waarde })}
        huidigeBron={plantFoto(slug) || undefined}
        bijstellen
        hulp={<>
          <p>Een foto laat zien hoe de plant er in het echt uitziet. Gebruik een eigen foto of zoek op Wikimedia Commons. Controleer bij een gevonden foto altijd de maker en de gebruiksvoorwaarden.</p>
          {/^https:\/\/commons\.wikimedia\.org\//.test(form.commons)
            ? <a href={form.commons} target="_blank" rel="noreferrer">Open de voorgestelde Commons-pagina →</a>
            : <a href="https://commons.wikimedia.org/" target="_blank" rel="noreferrer">Zoeken op Wikimedia Commons →</a>}
        </>}
      />
      <AfbeeldingVeld
        soort="illustratie"
        titel="Botanische illustratie"
        slug={slug}
        waarde={form.illustratie}
        onChange={(waarde) => setForm({ ...form, illustratie: waarde })}
        huidigeBron={plantIllustratie(slug) || undefined}
        hulp={<>
          <p>Dit is een duidelijke tekening van de plant en zijn onderdelen. Wikimedia Commons heeft voor veel soorten een aparte categorie met botanische illustraties. Controleer de maker en de gebruiksvoorwaarden, en vul daarna de pagina van de gekozen afbeelding als bron in.</p>
          {/^https:\/\/commons\.wikimedia\.org\//.test(form.commonsIllustraties)
            ? <a href={form.commonsIllustraties} target="_blank" rel="noreferrer">Open de voorgestelde illustratiepagina →</a>
            : <p>Er is geen aparte Commons-categorie gevonden. Zoek dan op de botanische naam met de woorden <i>botanical illustration</i>.</p>}
        </>}
      />
      <SymboolVeld naam={form.naam} botanischeNaam={form.botanischeNaam} slug={slug} waarde={form.symbolen} onChange={(waarde) => setForm({ ...form, symbolen: waarde })} />
    </div>
  </>;
}

export function toPayload(form: PlantForm) {
  return {
    naam: form.naam.trim(), botanischeNaam: form.botanischeNaam.trim(), plantnummer: form.plantnummer.trim(), functies: { primair: splitList(form.functiesPrimair), secundair: splitList(form.functiesSecundair) }, intro: form.intro.trim(), weetje: form.weetje.trim(),
    waterOndergrens: form.waterOndergrens.trim(), waterBovengrens: form.waterBovengrens.trim(), waterInfo: form.waterInfo.trim(), zon: form.zon.trim(), zonInfo: form.zonInfo.trim(), levensduur: form.levensduur.trim(),
    oogstTijd: splitList(form.oogstTijd), oogstMethode: form.oogstMethode.trim(), extraOogstTijd: splitList(form.extraOogstTijd), extraOogstMethode: form.extraOogstMethode.trim(), snoeiTijd: splitList(form.snoeiTijd), snoeiTijdInfo: form.snoeiTijdInfo.trim(), snoeiMethode: form.snoeiMethode.trim(), snoeiInformatie: form.snoeiInformatie.trim(), woekerToestemming: form.woekerToestemming.trim(), woekerVerbod: form.woekerVerbod.trim(), groei: splitList(form.groei), bloei: splitList(form.bloei), sterf: splitList(form.sterf), commons: form.commons.trim(), commonsIllustraties: form.commonsIllustraties.trim(),
    boomHeester: form.boomHeester, eetbaar: form.eetbaar, eetbaarInfo: form.eetbaarInfo.trim(), oogstbaarInTuin: form.oogstbaarInTuin,
    tuinOpmerking: form.tuinOpmerking.trim(), gevaarlijk: form.gevaarlijk, gevaarlijkInfo: form.gevaarlijkInfo.trim(), waaromLatenStaan: form.waaromLatenStaan.trim(),
    foto: form.foto, illustratie: form.illustratie,
    // Niets aangeraakt: het veld blijft weg, en dan gelden alle varianten uit de bibliotheek.
    symbolen: form.symbolen.bibliotheek === null && form.symbolen.eigen.length === 0
      ? undefined
      : {
          bibliotheek: form.symbolen.bibliotheek ?? [],
          eigen: form.symbolen.eigen.map((eigen) => ({ bestand: eigen.bestand, bron: form.symbolen.bron || eigen.bron })),
        },
  };
}

