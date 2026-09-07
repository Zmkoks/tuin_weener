'use client';

import { useState } from 'react';
import type { Plant } from './data/plantTypes';
import {
  FUNCTION_OPTIONS,
  PlantFormFields,
  blankForm,
  nextPlantNumber,
  toPayload,
  type PlantForm,
} from './components/plantFormulier';

type Props = { plants: Plant[]; onSaved: (plant: Plant) => void };

const AUTOMATION_PROMPT = String.raw`Je bent een zorgvuldige plantenredacteur voor de gezamenlijke tuin van Weener XL in Nederland. Maak volledige, praktische en veilige gegevens voor de pagina van één nieuwe plant op basis van mijn beschrijving. De lezers zijn deelnemers zonder vakkennis.

TAALNIVEAU EN TOON
- Schrijf op eenvoudig taalniveau A2/B1. De informatie moet ook duidelijk zijn voor iemand die weinig leest of Nederlands niet als eerste taal heeft.
- Gebruik gewone, concrete woorden. Schrijf bijvoorbeeld "knip de dode tak weg" en niet "verwijder afgestorven hout".
- Schrijf korte, actieve zinnen. Streef naar maximaal 12–15 woorden per zin. Splits een zin als er meer dan één handeling of voorwaarde in staat.
- Geef opdrachten rechtstreeks in de gebiedende wijs: "Voel aan de grond", "Knip boven een knop" en "Laat de hoofdstam staan".
- Noem steeds wat iemand kan zien, voelen of doen. Vermijd abstracte woorden, beeldspraak, vakjargon en lange bijzinnen.
- Is een vakwoord echt nodig, leg het meteen uit in gewone woorden. Schrijf bijvoorbeeld: "Een uitloper is een lange stengel die over de grond groeit."
- Gebruik steeds hetzelfde woord voor hetzelfde plantdeel. Wissel bijvoorbeeld niet zonder reden tussen "tak", "scheut" en "stengel".
- Gebruik geen afkortingen. Gebruik cijfers alleen waar ze het uitvoeren makkelijker maken, zoals "5 centimeter" of "2 tot 3 centimeter diep".
- Schrijf rustig en respectvol voor volwassenen. Gebruik geen kinderlijke toon, uitroeptekens of grapjes in verzorgingsinstructies.
- Maak waarschuwingen concreet. Schrijf wat niet mag én welk herkenbaar deel wel moet blijven.
- De botanische naam mag vaktaal bevatten, maar de overige tekst moet zonder plantenkennis begrijpelijk zijn.

WERKWIJZE
- Bepaal eerst om welke soort het gaat. Gebruik de meest gangbare Nederlandse naam en een correcte wetenschappelijke naam. Neem geen specifiek ras of cultivar aan als dat niet is genoemd.
- Baseer verzorging, kalender en gebruik op betrouwbare botanische en tuinbouwkundige kennis voor het Nederlandse klimaat. Vul ontbrekende gegevens zelf aan. Neem bij echte onzekerheid de veiligste algemene instructie en benoem de beperking kort in het relevante tekstveld; verzin geen precisie.
- Ga uit van een gevestigde plant in de volle grond. Noem in waterInfo apart dat een pas geplante plant tijdelijk vaker controle of water nodig heeft als dat voor deze soort relevant is.
- Maak alle tekst specifiek voor deze plant. Vermijd nietszeggende tekst zoals "geef regelmatig water", "snoei indien nodig" of "houd de plant in de gaten".
- Beschrijf alleen eetbaarheid of oogst als normaal menselijk gebruik veilig en bekend is. Waarschuw duidelijk bij giftige of irriterende delen als verwarring mogelijk is.

WATER: KIES TWEE NIVEAUS
De getallen zijn GEEN liters, gietbeurten of aantal druppels. Ze beschrijven hoe vochtig de grond mag zijn op het moment van water geven, gemeten door 2–3 cm diep te voelen:
1 = alleen water bij lange of extreme droogte; de plant staat liever droog.
2 = water als de grond ook enkele centimeters diep helemaal droog aanvoelt.
3 = water als de bovenste laag droog is; dieper mag de grond nog licht vochtig zijn.
4 = water zodra de grond niet meer nat aanvoelt; laat hem niet uitdrogen.
5 = grond voortdurend nat of moerassig houden.

waterOndergrens is het droogste aanvaardbare niveau: het moment waarop uiterlijk water nodig is. waterBovengrens is het vochtigste niveau waarop al veilig water mag worden gegeven. Gebruik gehele getallen van 1 t/m 5 en zorg dat de ondergrens nooit hoger is dan de bovengrens. Kies een realistisch bereik, geen automatische standaard. Veel voorkomende bereiken zijn: 1–2 voor uitgesproken droogteminnende soorten; 1–3 voor droogtetolerante gevestigde vaste planten, struiken en bomen; 2–3 voor gemiddeld waterbehoevende soorten; 2–4 voor soorten die redelijk gelijkmatig vocht waarderen maar kort mogen opdrogen; 3–4 voor vochtminnende soorten. Gebruik niveau 5 alleen voor echte oever-, moeras- of waterplanten.

Laat waterInfo aansluiten op het gekozen bereik. Begin met voelen aan de grond, zeg wanneer wel en niet water te geven en vermeld relevante uitzonderingen zoals hitte, vruchtvorming, jonge aanplant of gevaar van natte wintergrond. Geef geen vast aantal liters of vaste weekfrequentie wanneer bakmaat, bodem, regen en temperatuur onbekend zijn. Beschrijf zo nodig wel de methode: rustig bij de voet, zodat de wortelzone vochtig wordt, zonder blijvende plas.

FUNCTIES: VERDEEL IN PRIMAIR EN SECUNDAIR
functies is een object met de arrays primair en secundair. Gebruik in beide arrays alleen passende waarden uit de onderstaande lijst en zet iedere functie maar één keer.

primair bevat de belangrijkste reden waarom deze plant bewust in deze tuin staat. Kies normaal precies één primaire functie. Kies alleen twee primaire functies als beide afzonderlijk zeer belangrijk en vrijwel gelijkwaardig zijn voor de aanwezigheid van deze plant in de tuin. Kies nooit meer dan twee. Als "onkruid" primair is, moet er altijd nog een tweede, inhoudelijke primaire functie naast staan: onkruid mag nooit alleen primair zijn.

secundair bevat alles wat de plant óók aantoonbaar is of doet, maar wat niet de hoofdreden voor zijn plek in de tuin is. Secundaire functies zijn dus echte eigenschappen of bijdragen, geen zwakke mogelijkheden. Een functie die al primair staat mag niet nogmaals secundair staan. Ken niet automatisch elke bloeiende plant "insecten" of elke aantrekkelijke plant "sier" toe.
- fruit: geeft voor mensen eetbare vruchten of bessen die daadwerkelijk geoogst kunnen worden.
- kruid: bladeren, jonge scheuten of bloemen worden normaal gebruikt in eten of thee. Gebruik dit niet alleen omdat de plant geneeskundig genoemd wordt.
- insecten: is een duidelijke voedselplant voor bijen, hommels, vlinders of andere nuttige insecten, bijvoorbeeld door betekenisvolle nectar, stuifmeel of waardplantfunctie.
- vogel: biedt duidelijk voedsel, nestgelegenheid of beschutting aan vogels.
- sier: staat er in belangrijke mate om opvallende bloemen, blad, vorm, geur of winterbeeld; niet als algemeen restlabel voor iedere mooie plant.
- boom: heeft een boomvorm of groeit uit tot een grote houtige structuur die schaduw of beschutting geeft. Een gewone kleine struik krijgt dit label niet.
- onkruid: komt in deze tuin spontaan op of zaait/verspreidt zich daar als ongewenste opslag. Dit is geen botanische eigenschap. Gebruik onkruid nooit als enige functie en alleen wanneer de beschrijving of tuinsituatie daar aanleiding voor geeft.

VELDREGELS
- intro: maximaal twee korte zinnen over wat deelnemers aan de plant herkennen en waarom hij interessant is.
- weetje: één juist, begrijpelijk en verrassend feit; herhaal de intro niet.
- plantnummer: altijd een lege tekenreeks; de website kent het nummer toe.
- zon: exact één waarde: "zon", "halfschaduw" of "schaduw". Kies de beste hoofdstandplaats; zet nuances in zonInfo.
- levensduur: exact één waarde: "Eenjarig", "Tweejarig" of "Meerjarig".
- oogstTijd en oogstMethode: de gewone oogstperiode en veilige, herkenbare oogstwijze. Laat beide leeg als er niets voor mensen te oogsten is.
- extraOogstTijd en extraOogstMethode: alleen voor een duidelijk tweede plantdeel of afwijkende tweede oogstperiode; anders leeg.
- snoeiTijd: alleen maanden waarin snoeien of terugknippen echt passend is. snoeiTijdInfo legt het moment uit; snoeiMethode zegt precies wat en waar te knippen; snoeiInformatie geeft noodzakelijke achtergrond, risico's of uitzonderingen. Is snoei niet nodig, gebruik lege maanden en leg in de tekstvelden kort uit wat hoogstens mag worden opgeruimd.
- woekerToestemming: schrijf concreet welke uitlopers, zaailingen, stengels, worteldelen of uitgebloeide delen een deelnemer zelfstandig mag verwijderen en waar.
- woekerVerbod: schrijf concreet welke kroon, stam, hoofdtakken, groeipunten, gezonde scheuten of gewenste planten moeten blijven. Ook een niet-woekerende plant krijgt bruikbare grenzen.
- groei: maanden met zichtbare nieuwe bladeren of stengels.
- bloei: maanden waarin de plant doorgaans bloeit.
- sterf: maanden waarin een kruidachtige plant bovengronds afsterft of duidelijk in rust gaat. Voor een bladverliezende houtige plant zijn dit de maanden van bladval/rust. Gebruik [] als er geen duidelijke zichtbare rust- of afsterfperiode is.
- commons: de directe Wikimedia Commons-categoriepagina voor precies deze soort, bij voorkeur in de vorm https://commons.wikimedia.org/wiki/Category:... Deze pagina wordt straks bij FOTO getoond als plek om een foto te zoeken en als mogelijke bron. Geef uitsluitend de kale URL als tekenreeks: geen Markdown, blokhaken, haakjes of linktekst. Gebruik https://commons.wikimedia.org/ als je de juiste categorie niet betrouwbaar weet. Kies geen specifieke foto, botanische illustratie of plattegrondsymbool.
- commonsIllustraties: zoek op Wikimedia Commons naar een bestaande categorie met botanische illustraties van precies deze soort. De naam is vaak "Category:Wetenschappelijke_naam_-_botanical_illustrations", bijvoorbeeld https://commons.wikimedia.org/wiki/Category:Rubus_caesius_-_botanical_illustrations. Controleer dat de categorie echt bestaat; maak de URL niet alleen op basis van dit patroon. Geef uitsluitend de kale URL zonder Markdown. Gebruik een lege tekenreeks als er geen passende categorie bestaat of als je het bestaan niet betrouwbaar kunt controleren.

UITVOERREGELS
Controleer vóór het antwoorden stil ieder tekstveld: begrijpt iemand zonder tuinervaring direct wat er bedoeld wordt, zijn moeilijke woorden uitgelegd en kan iedere instructie maar op één manier worden uitgevoerd? Vereenvoudig de tekst als dat niet zo is.

Geef uitsluitend één geldig JSON-object terug, zonder markdown, uitleg of codeblok. Gebruik exact de sleutels en volgorde uit het schema hieronder en voeg niets toe. Alle waarden zijn strings of arrays van strings zoals getoond. Gebruik in alle maandarrays uitsluitend deze volledige maandnamen, in kalender-volgorde: Januari, Februari, Maart, April, Mei, Juni, Juli, Augustus, September, Oktober, November, December. Gebruik lege arrays en lege tekenreeksen als iets werkelijk niet van toepassing is; laat geen sleutel weg.

{
  "naam": "Nederlandse naam",
  "botanischeNaam": "Wetenschappelijke naam",
  "functies": {
    "primair": ["kruid"],
    "secundair": ["insecten"]
  },
  "intro": "Korte introductie van maximaal twee zinnen.",
  "weetje": "Een interessant, begrijpelijk weetje.",
  "plantnummer": "",
  "waterOndergrens": "1",
  "waterBovengrens": "3",
  "waterInfo": "Wanneer en hoe geef je water?",
  "zon": "zon",
  "zonInfo": "Concrete uitleg over licht, beschutting en relevante bodem- of vochtomstandigheden.",
  "levensduur": "Meerjarig",
  "oogstTijd": [],
  "oogstMethode": "",
  "extraOogstTijd": [],
  "extraOogstMethode": "",
  "snoeiTijd": [],
  "snoeiTijdInfo": "",
  "snoeiMethode": "",
  "snoeiInformatie": "",
  "woekerToestemming": "Wat mag een deelnemer zelf verwijderen?",
  "woekerVerbod": "Wat moet blijven of mag niet?",
  "groei": [],
  "bloei": [],
  "sterf": [],
  "commons": "https://commons.wikimedia.org/",
  "commonsIllustraties": ""
}

Mijn plantbeschrijving:
`;

/** Hulpjes voor het antwoord van een taalmodel: dat levert lijsten en losse waarden door elkaar. */
function valueList(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').join(', ');
  return typeof value === 'string' ? value : '';
}

function valueText(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key]);
  return '';
}

/** Haal een kale URL uit bijvoorbeeld `[tekst](https://…)`, ook als een model Markdown gebruikte. */
function cleanUrl(value: string) {
  const markdownUrl = /\]\((https?:\/\/[^)]+)\)/.exec(value)?.[1];
  const plainUrl = /https?:\/\/[^\s\])]+/.exec(value)?.[0];
  return (markdownUrl || plainUrl || '').replace(/\\_/g, '_');
}

function functionLists(record: Record<string, unknown>) {
  const value = record.functies ?? record.functions;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const groups = value as Record<string, unknown>;
    const primary = (Array.isArray(groups.primair) ? groups.primair : Array.isArray(groups.primary) ? groups.primary : []).filter((item): item is string => typeof item === 'string');
    const secondary = (Array.isArray(groups.secundair) ? groups.secundair : Array.isArray(groups.secondary) ? groups.secondary : []).filter((item): item is string => typeof item === 'string');
    const unknown = [...primary, ...secondary].find((item) => !FUNCTION_OPTIONS.includes(item));
    if (unknown) throw new Error(`Onbekende functie: ${unknown}.`);
    if (primary.length < 1 || primary.length > 2) throw new Error('Kies één of maximaal twee primaire functies.');
    if (primary.includes('onkruid') && primary.length < 2) throw new Error('Onkruid mag niet de enige primaire functie zijn.');
    const duplicate = secondary.find((item) => primary.includes(item));
    if (duplicate) throw new Error(`De functie ${duplicate} staat zowel primair als secundair.`);
    return { functiesPrimair: [...new Set(primary)].join(', '), functiesSecundair: [...new Set(secondary)].join(', ') };
  }
  const lijst = valueList(value).split(',').map(v => v.trim()).filter(Boolean);
  return { functiesPrimair: lijst.slice(0, 1).join(', '), functiesSecundair: lijst.slice(1).join(', ') };
}

function normalizeParsed(value: unknown, plants: Plant[]): PlantForm {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const commons = cleanUrl(valueText(record, 'commons', 'sourceUrl'));
  const commonsIllustraties = cleanUrl(valueText(record, 'commonsIllustraties', 'illustrationCategoryUrl'));
  return {
    naam: valueText(record, 'naam', 'name'),
    botanischeNaam: valueText(record, 'botanischeNaam', 'botanicalName', 'wetenschappelijkeNaam'),
    plantnummer: valueText(record, 'plantnummer', 'plantNumber') || nextPlantNumber(plants),
    ...functionLists(record),
    intro: valueText(record, 'intro', 'description'),
    weetje: valueText(record, 'weetje', 'fact'),
    waterOndergrens: valueText(record, 'waterOndergrens', 'waterMin') || '1',
    waterBovengrens: valueText(record, 'waterBovengrens', 'waterMax') || '3',
    waterInfo: valueText(record, 'waterInfo', 'watering'),
    zon: valueText(record, 'zon', 'sun') || 'zon',
    zonInfo: valueText(record, 'zonInfo', 'sunInfo'),
    levensduur: valueText(record, 'levensduur', 'lifespan') || 'Meerjarig',
    oogstTijd: valueList(record.oogstTijd ?? record.harvestMonths),
    oogstMethode: valueText(record, 'oogstMethode', 'harvestMethod'),
    extraOogstTijd: valueList(record.extraOogstTijd ?? record.extraHarvestMonths),
    extraOogstMethode: valueText(record, 'extraOogstMethode', 'extraHarvestMethod'),
    snoeiTijd: valueList(record.snoeiTijd ?? record.pruneMonths),
    snoeiTijdInfo: valueText(record, 'snoeiTijdInfo', 'pruneTiming'),
    snoeiMethode: valueText(record, 'snoeiMethode', 'pruneMethod'),
    snoeiInformatie: valueText(record, 'snoeiInformatie', 'pruneInfo'),
    woekerToestemming: valueText(record, 'woekerToestemming', 'removalAllowed'),
    woekerVerbod: valueText(record, 'woekerVerbod', 'removalForbidden'),
    groei: valueList(record.groei ?? record.growthMonths),
    bloei: valueList(record.bloei ?? record.bloomMonths),
    sterf: valueList(record.sterf ?? record.dormantMonths),
    commons,
    commonsIllustraties,
    // Commons helpt bij het zoeken van de foto. De botanische illustratie krijgt een eigen bron.
    foto: { bestand: '', bron: commons, x: 50, y: 50, zoom: 1 },
    illustratie: { bestand: '', bron: '', x: 50, y: 50, zoom: 1 },
    symbolen: { bibliotheek: null, eigen: [], bron: '' },
  };
}

function parseJsonAnswer(input: string) {
  const trimmed = input.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(trimmed) as unknown; } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('Ik zie geen JSON-object in dit antwoord.');
    try { return JSON.parse(trimmed.slice(start, end + 1)) as unknown; } catch { throw new Error('Het JSON-object is niet geldig.'); }
  }
}

export default function PlantCreator({ plants, onSaved }: Props) {
  const [mode, setMode] = useState<'manual' | 'automatic'>('manual');
  const [form, setForm] = useState<PlantForm>(() => blankForm(plants));
  const [automaticText, setAutomaticText] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);

  const parseAutomaticAnswer = () => {
    setError(''); setNotice('');
    try {
      const parsed = normalizeParsed(parseJsonAnswer(automaticText), plants);
      if (!parsed.naam) throw new Error('Vul eerst een plantbeschrijving in of controleer het LLM-antwoord.');
      setForm(parsed); setMode('manual'); setNotice('De gegevens zijn ingelezen. Controleer ze hieronder en sla daarna de plant op.');
    } catch (parseError) { setError(parseError instanceof Error ? parseError.message : 'Dit antwoord kon niet worden gelezen.'); }
  };

  const save = async () => {
    setError(''); setNotice('');
    if (!form.naam.trim() || !form.botanischeNaam.trim() || !form.intro.trim()) { setError('Vul minimaal de Nederlandse naam, botanische naam en korte introductie in.'); return; }
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/planten', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(toPayload(form)) });
      const data = await response.json() as { plant?: Plant; error?: string };
      if (!response.ok || !data.plant) throw new Error(data.error || 'Opslaan is niet gelukt.');
      onSaved(data.plant); setSaveStatus('saved'); setNotice(`Plant “${data.plant.naam}” is toegevoegd aan de plantenbibliotheek.`); setForm(blankForm([...plants, data.plant])); setAutomaticText('');
    } catch (saveError) { setSaveStatus('idle'); setError(saveError instanceof Error ? saveError.message : 'Opslaan is niet gelukt.'); }
  };

  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(AUTOMATION_PROMPT); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setError('Kopiëren lukt niet automatisch. Selecteer de prompt en kopieer hem handmatig.'); }
  };

  return <section className="plant-creator" aria-labelledby="plant-creator-title">
    <div className="plant-creator-intro"><span className="pill">NIEUWE PLANT</span><h2 id="plant-creator-title">Voeg een plant toe</h2><p>Kies zelf alle gegevens in te vullen, of laat een taalmodel een eerste versie maken die je daarna altijd kunt controleren en aanpassen.</p></div>
    <div className="creator-mode-switch" role="tablist" aria-label="Manier van toevoegen"><button type="button" role="tab" aria-selected={mode === 'manual'} className={mode === 'manual' ? 'active' : ''} onClick={() => { setMode('manual'); setError(''); }}>Handmatig invullen</button><button type="button" role="tab" aria-selected={mode === 'automatic'} className={mode === 'automatic' ? 'active' : ''} onClick={() => { setMode('automatic'); setError(''); }}>Met LLM-prompt</button></div>
    {error && <p className="creator-error" role="alert">{error}</p>}
    {notice && <p className="creator-notice" role="status">{notice}</p>}
    {mode === 'automatic' ? <>
      <details className="recognition-help">
        <summary><span>Vooraf</span> Hoe weet ik welke plant dit is?</summary>
        <div><p>Maak duidelijke foto’s van de hele plant, het blad en de bloem of vrucht. Laat een herkenningsdienst zoeken en vergelijk altijd meer dan één resultaat. Een app kan zich vergissen.</p><p><a href="https://lens.google/" target="_blank" rel="noreferrer">Google Lens</a> zoekt met een foto. <a href="https://identify.plantnet.org/" target="_blank" rel="noreferrer">Pl@ntNet</a> is speciaal gemaakt voor planten. Noteer bij voorkeur zowel de Nederlandse als de botanische naam. Bij twijfel kun je de foto en meerdere mogelijke namen ook aan het LLM geven.</p></div>
      </details>
      <div className="automatic-creator">
      <div className="prompt-card"><div className="prompt-card-head"><div><span className="number">STAP 1</span><h3>Kopieer deze prompt en zet de naam van de plant erbij</h3></div><button type="button" className="prompt-kopieer" onClick={copyPrompt}>{copied ? 'Gekopieerd ✓' : 'Prompt kopiëren'}</button></div><pre>{AUTOMATION_PROMPT}</pre><small>Werkt in ChatGPT, Claude, Gemini of een andere LLM. Zet onderaan de prompt de naam van de plant, het liefst de Nederlandse én de botanische, en beschrijf hem zo concreet mogelijk.</small></div>
      <div className="prompt-card prompt-input-card"><span className="number">STAP 2</span><h3>Plak het antwoord hier</h3><p>De website haalt het JSON-object uit het antwoord, ook als het model er per ongeluk tekst of een codeblok omheen zet.</p><textarea aria-label="Antwoord van taalmodel" value={automaticText} onChange={(event) => setAutomaticText(event.target.value)} placeholder="Plak hier het antwoord van het taalmodel…" rows={12} /><button type="button" className="primary-action" onClick={parseAutomaticAnswer} disabled={!automaticText.trim()}>Antwoord controleren en invullen →</button></div>
    </div></> : <form className="plant-form" onSubmit={(event) => { event.preventDefault(); void save(); }}><PlantFormFields form={form} setForm={setForm} /><div className="plant-form-actions"><p>Na opslaan verschijnt de plant direct in de bibliotheek. Een foto kun je later toevoegen.</p><button type="submit" className="primary-action" disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Plant opslaan…' : 'Plant opslaan'}</button></div></form>}
  </section>;
}
