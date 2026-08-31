'use client';

import { useMemo, useState } from 'react';
import type { Plant } from './data/plantTypes';

const MONTHS = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const FUNCTION_OPTIONS = ['fruit', 'kruid', 'insecten', 'vogel', 'sier', 'boom', 'onkruid'];
const FUNCTION_LABELS: Record<string, string> = { fruit: 'Fruit', kruid: 'Kruiden', insecten: 'Insecten', vogel: 'Vogels', sier: 'Sier', boom: 'Bomen', onkruid: 'Onkruid' };

type PlantForm = {
  naam: string;
  botanischeNaam: string;
  plantnummer: string;
  functies: string;
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
};

type Props = { plants: Plant[]; onSaved: (plant: Plant) => void };

const AUTOMATION_PROMPT = String.raw`Je bent redacteur voor de tuin van Weener XL. Maak één nieuw plantenpaspoort op basis van mijn beschrijving.

Geef uitsluitend één geldig JSON-object terug, zonder markdown, uitleg of codeblok. Gebruik exact deze sleutels. Gebruik voor maandvelden uitsluitend maandnamen uit deze lijst: Januari, Februari, Maart, April, Mei, Juni, Juli, Augustus, September, Oktober, November, December. Gebruik voor functies uitsluitend: fruit, kruid, insecten, vogel, sier, boom, onkruid.

{
  "naam": "Nederlandse naam",
  "botanischeNaam": "Wetenschappelijke naam",
  "functies": ["kruid", "insecten"],
  "intro": "Korte introductie van maximaal twee zinnen.",
  "weetje": "Een interessant, begrijpelijk weetje.",
  "plantnummer": "",
  "waterOndergrens": "1",
  "waterBovengrens": "3",
  "waterInfo": "Wanneer en hoe geef je water?",
  "zon": "zon, halfschaduw of schaduw",
  "zonInfo": "Welke standplaats past?",
  "levensduur": "Eenjarig, tweejarig of meerjarig",
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
  "commons": "https://commons.wikimedia.org/"
}

Mijn plantbeschrijving:
`;

function nextPlantNumber(plants: Plant[]) {
  const numbers = plants.map((plant) => Number.parseInt(plant.plantnummer, 10)).filter(Number.isFinite);
  return String((numbers.length ? Math.max(...numbers) : 0) + 1);
}

function blankForm(plants: Plant[]): PlantForm {
  return {
    naam: '', botanischeNaam: '', plantnummer: nextPlantNumber(plants), functies: '', intro: '', weetje: '',
    waterOndergrens: '1', waterBovengrens: '3', waterInfo: '', zon: 'zon', zonInfo: '', levensduur: 'Meerjarig',
    oogstTijd: '', oogstMethode: '', extraOogstTijd: '', extraOogstMethode: '', snoeiTijd: '', snoeiTijdInfo: '',
    snoeiMethode: '', snoeiInformatie: '', woekerToestemming: '', woekerVerbod: '', groei: '', bloei: '', sterf: '', commons: '',
  };
}

function splitList(value: string) {
  return [...new Set(value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))];
}

function valueList(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').join(', ');
  return typeof value === 'string' ? value : '';
}

function valueText(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key]);
  return '';
}

function normalizeParsed(value: unknown, plants: Plant[]): PlantForm {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    naam: valueText(record, 'naam', 'name'),
    botanischeNaam: valueText(record, 'botanischeNaam', 'botanicalName', 'wetenschappelijkeNaam'),
    plantnummer: valueText(record, 'plantnummer', 'plantNumber') || nextPlantNumber(plants),
    functies: valueList(record.functies ?? record.functions),
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
    commons: valueText(record, 'commons', 'sourceUrl'),
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

function TextField({ id, label, value, onChange, multiline = false, type = 'text', placeholder, help }: { id: keyof PlantForm; label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string; placeholder?: string; help?: string }) {
  return <label className={`plant-field ${multiline ? 'wide' : ''}`} htmlFor={`plant-${id}`}><span>{label}</span>{multiline ? <textarea id={`plant-${id}`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={3} /> : <input id={`plant-${id}`} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}{help && <small>{help}</small>}</label>;
}

function PlantFormFields({ form, setForm }: { form: PlantForm; setForm: (form: PlantForm) => void }) {
  const update = (id: keyof PlantForm, value: string) => setForm({ ...form, [id]: value });
  return <>
    <div className="plant-form-section"><h3>Basisinformatie</h3><div className="plant-field-grid">
      <TextField id="naam" label="Nederlandse naam" value={form.naam} onChange={(value) => update('naam', value)} placeholder="bijv. Oost-Indische kers" />
      <TextField id="botanischeNaam" label="Botanische naam" value={form.botanischeNaam} onChange={(value) => update('botanischeNaam', value)} placeholder="bijv. Tropaeolum majus" />
      <TextField id="plantnummer" label="Plantnummer" value={form.plantnummer} onChange={(value) => update('plantnummer', value)} type="number" help="Laat het voorgestelde nummer staan als dit de volgende plant is." />
      <TextField id="functies" label="Labels / functies" value={form.functies} onChange={(value) => update('functies', value)} placeholder="kruid, insecten" help="Scheid labels met komma’s." />
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
    <div className="plant-form-section"><h3>Wat mag weg?</h3><div className="plant-field-grid">
      <TextField id="woekerToestemming" label="Dit mag een deelnemer verwijderen" value={form.woekerToestemming} onChange={(value) => update('woekerToestemming', value)} multiline />
      <TextField id="woekerVerbod" label="Dit moet blijven / mag niet" value={form.woekerVerbod} onChange={(value) => update('woekerVerbod', value)} multiline />
    </div></div>
    <div className="plant-form-section"><h3>Jaarkalender</h3><div className="plant-field-grid">
      <TextField id="groei" label="Groei" value={form.groei} onChange={(value) => update('groei', value)} placeholder="April, Mei, Juni" />
      <TextField id="bloei" label="Bloei" value={form.bloei} onChange={(value) => update('bloei', value)} placeholder="Mei, Juni" />
      <TextField id="sterf" label="Rust / sterfte" value={form.sterf} onChange={(value) => update('sterf', value)} placeholder="November, December" />
      <TextField id="commons" label="Bronlink (optioneel)" value={form.commons} onChange={(value) => update('commons', value)} placeholder="https://commons.wikimedia.org/…" />
    </div><p className="field-note">Vul maanden in als losse namen, bijvoorbeeld <b>April, Mei, Juni</b>.</p></div>
  </>;
}

function toPayload(form: PlantForm) {
  return {
    naam: form.naam.trim(), botanischeNaam: form.botanischeNaam.trim(), plantnummer: form.plantnummer.trim(), functies: splitList(form.functies), intro: form.intro.trim(), weetje: form.weetje.trim(),
    waterOndergrens: form.waterOndergrens.trim(), waterBovengrens: form.waterBovengrens.trim(), waterInfo: form.waterInfo.trim(), zon: form.zon.trim(), zonInfo: form.zonInfo.trim(), levensduur: form.levensduur.trim(),
    oogstTijd: splitList(form.oogstTijd), oogstMethode: form.oogstMethode.trim(), extraOogstTijd: splitList(form.extraOogstTijd), extraOogstMethode: form.extraOogstMethode.trim(), snoeiTijd: splitList(form.snoeiTijd), snoeiTijdInfo: form.snoeiTijdInfo.trim(), snoeiMethode: form.snoeiMethode.trim(), snoeiInformatie: form.snoeiInformatie.trim(), woekerToestemming: form.woekerToestemming.trim(), woekerVerbod: form.woekerVerbod.trim(), groei: splitList(form.groei), bloei: splitList(form.bloei), sterf: splitList(form.sterf), commons: form.commons.trim(),
  };
}

export default function PlantCreator({ plants, onSaved }: Props) {
  const [mode, setMode] = useState<'manual' | 'automatic'>('manual');
  const [form, setForm] = useState<PlantForm>(() => blankForm(plants));
  const [automaticText, setAutomaticText] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);
  const availableFunctions = useMemo(() => FUNCTION_OPTIONS.map((value) => `${value} = ${FUNCTION_LABELS[value]}`).join(' · '), []);

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
    {mode === 'automatic' ? <div className="automatic-creator">
      <div className="prompt-card"><div className="prompt-card-head"><div><span className="number">STAP 1</span><h3>Kopieer deze prompt</h3></div><button type="button" onClick={copyPrompt}>{copied ? 'Gekopieerd ✓' : 'Prompt kopiëren'}</button></div><pre>{AUTOMATION_PROMPT}</pre><small>Werkt in ChatGPT, Claude, Gemini of een andere LLM. Beschrijf de plant onderaan de prompt zo concreet mogelijk. Geldige functies: {availableFunctions}.</small></div>
      <div className="prompt-card prompt-input-card"><span className="number">STAP 2</span><h3>Plak het antwoord hier</h3><p>De website haalt het JSON-object uit het antwoord, ook als het model er per ongeluk tekst of een codeblok omheen zet.</p><textarea aria-label="Antwoord van taalmodel" value={automaticText} onChange={(event) => setAutomaticText(event.target.value)} placeholder="Plak hier het antwoord van het taalmodel…" rows={12} /><button type="button" className="primary-action" onClick={parseAutomaticAnswer} disabled={!automaticText.trim()}>Antwoord controleren en invullen →</button></div>
    </div> : <form className="plant-form" onSubmit={(event) => { event.preventDefault(); void save(); }}><PlantFormFields form={form} setForm={setForm} /><div className="plant-form-actions"><p>Na opslaan verschijnt de plant direct in de bibliotheek. Een foto kun je later toevoegen.</p><button type="submit" className="primary-action" disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Plant opslaan…' : 'Plant opslaan'}</button></div></form>}
  </section>;
}
