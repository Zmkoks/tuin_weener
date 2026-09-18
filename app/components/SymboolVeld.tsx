'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * De symbolen waarmee een plant op de plattegrond wordt getekend.
 *
 * Meerdere mogen tegelijk aanstaan: de plattegrond kiest er per plant zelf uit, en dat is
 * ook hoe het nu al werkt — de venkel heeft `plant-venkel` en `plant-venkel-groot`. Elke
 * tekening is daarom een eigen vinkje, niet een keuze tussen twee.
 *
 * De tekeningen uit de bibliotheek komen uit `planten_symbolen.svg` (als kopie in
 * `public/symbolen/bibliotheek.svg`). Het zijn `<g id="plant-…">`-groepen met een eigen
 * transform; hoe groot ze in beeld zijn staat nergens, dus dat laat de browser met
 * `getBBox()` uitrekenen. Zo blijft het kloppen als de bibliotheek verandert.
 */
export type EigenSymbool = { bestand: string; bron: string };
export type Symboolkeuze = { bibliotheek: string[] | null; eigen: EigenSymbool[]; bron: string };

const NS = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';
let bibliotheek: Promise<Document> | null = null;

function laadBibliotheek() {
  bibliotheek ??= fetch('/symbolen/bibliotheek.svg')
    .then((antwoord) => antwoord.text())
    .then((tekst) => new DOMParser().parseFromString(tekst, 'image/svg+xml'));
  return bibliotheek;
}

/**
 * De hele bibliotheek één keer verborgen in de pagina zetten.
 *
 * Dat moet wel: de tekeningen delen bouwstenen. Een blaadje of een besje staat één keer
 * getekend en wordt met `<use xlink:href="#ab-leaflet">` hergebruikt — 220 keer, voor 30
 * bouwstenen. Kopieer je alleen de groep van één plant, dan verwijzen die naar niets meer
 * en mist de tekening het grootste deel van zijn blad en vruchten. Staat de bibliotheek
 * in de pagina, dan vinden de verwijzingen elkaar gewoon terug.
 */
function zetBibliotheekInPagina(document_: Document) {
  if (document.getElementById('symbolenbibliotheek')) return;
  const houder = document.createElement('div');
  houder.id = 'symbolenbibliotheek';
  houder.setAttribute('aria-hidden', 'true');
  houder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  const wortel = document_.documentElement.cloneNode(true) as SVGSVGElement;
  houder.appendChild(wortel);
  document.body.appendChild(houder);
}

/** Eén tekening, als `<use>` naar de bibliotheek in de pagina. */
function tekenGroep(id: string, doel: HTMLElement) {
  const tekening = document.createElementNS(NS, 'svg');
  const verwijzing = document.createElementNS(NS, 'use');
  verwijzing.setAttributeNS(XLINK, 'xlink:href', `#${id}`);
  verwijzing.setAttribute('href', `#${id}`);
  tekening.appendChild(verwijzing);
  doel.replaceChildren(tekening);

  // De viewBox komt uit de browser: hoe groot een symbool in beeld is staat nergens
  // opgeschreven, en zo blijft het kloppen als de bibliotheek verandert.
  const kader = verwijzing.getBBox();
  if (!kader.width || !kader.height) return;
  const rand = Math.max(kader.width, kader.height) * 0.04;
  tekening.setAttribute('viewBox', `${kader.x - rand} ${kader.y - rand} ${kader.width + rand * 2} ${kader.height + rand * 2}`);
}

function Bibliotheektekening({ id }: { id: string }) {
  const vak = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (vak.current) tekenGroep(id, vak.current); }, [id]);
  return <span className="symbool-tegel" ref={vak} aria-hidden="true" />;
}

type Props = {
  naam: string;
  botanischeNaam: string;
  slug: string;
  waarde: Symboolkeuze;
  onChange: (waarde: Symboolkeuze) => void;
};

function symboolPrompt(naam: string, botanischeNaam: string) {
  return `Help mij een eenvoudig plantsymbool voor een plattegrond te maken.

Ik heb geen ervaring met tekenen, SVG of programmeren. Maak daarom zelf het volledige bestand. Ik voeg een HTML-bestand met de bestaande plantsymbolen toe. Bestudeer daarin eerst meerdere symbolen. Kies intern het bestaande symbool met de meest vergelijkbare groeiwijze en gebruik dezelfde visuele taal. Kopieer geen complete bestaande plant.

Plant: ${naam || '[Nederlandse naam]'}
Botanische naam: ${botanischeNaam || '[botanische naam]'}

Doel
Het symbool wordt zeer klein op een tuinplattegrond afgebeeld. Maak geen generiek pictogram, logo, emoji, clipart of silhouet van grote kleurvlakken. Maak een botanisch geloofwaardige tekening die is vereenvoudigd voor klein gebruik. Teken één volledig plantenexemplaar of hoogstens twee deels overlappende exemplaren. Teken geen perk, landschap, pot, bordje of achtergrond.

Botanische opbouw
- Onderzoek eerst de natuurlijke groeiwijze: bijvoorbeeld polvormend, kruipend, overhangend, klimmend, struikvormig of rechtop. Laat vooral die groeiwijze kloppen. Forceer een kruipende of overhangende plant niet in een stijve rechtopstaande V-vorm.
- Geef daarna de echte bladopbouw weer. Let op enkelvoudige of samengestelde bladeren, aantal deelblaadjes, plaats aan de stengel en globale bladvorm.
- Kies pas daarna één herkenbaar accent, zoals enkele bloemen, één kleine vruchttros of een opvallende zaadvorm. Maak een bloem of vrucht niet tot een groot embleem midden in de plant.
- Gebruik twee of drie botanische kenmerken waaraan de soort te herkennen is. Vereenvoudig hun omtrek, maar vervang ze niet door willekeurige geometrische bladvormen.
- Gebruik weinig bladeren, bloemen en vruchten. Begin met minder bladeren dan je eerste ontwerp nodig lijkt te hebben. Voeg alleen een extra blad toe als de plant daardoor duidelijker herkenbaar wordt.
- Geef elk blad een eigen, volledig leesbare buitenrand. Bladeren mogen elkaar niet kruisen, in elkaar verdwijnen of samen één groot groen vlak vormen.
- Laat tussen naburige bladeren zichtbaar ademruimte of een stukje stengel vrij. Plaats bladeren naast elkaar of trapsgewijs, niet precies boven op elkaar.

Compositie
- Houd een duidelijke hiërarchie: hoofdtakken of stengels dragen de plant, bladeren zijn kleiner en accenten zoals vruchten nog kleiner.
- Laat voldoende open ruimte tussen takken en bladeren. Maak geen dicht blok van overlappende kleurvlakken.
- Controleer de tekening ook als zwart silhouet: de afzonderlijke bladeren moeten dan nog steeds als losse vormen herkenbaar blijven.
- Maak stengels zichtbaar smaller dan de bladeren. Gebruik zijstengels dunner dan de hoofdstengel.
- Maak de tekening compact en bij voorkeur hoger dan breed, behalve wanneer de echte groeiwijze laag of kruipend is.
- Streef naar een breedte/hoogteverhouding tussen 0,45 en 0,90. Ga alleen tot maximaal 1,10 als de natuurlijke groeiwijze dat echt nodig maakt.
- Zet de voet van de plant midden onderaan. Gebruik een strakke viewBox met weinig lege ruimte.
- Bij twee planten: laat ze deels overlappen. Zet ze niet als een brede rij naast elkaar.

Stijl en techniek
- Volg de organische, licht botanische stijl van het bijgevoegde overzicht: gebogen stengels, rustige kleurverschillen en herkenbare maar vereenvoudigde plantdelen.
- Gebruik SVG-paden, cirkels en ellipsen waar ze bij de werkelijke vorm passen. Gebruik geen hoekige kartelrand als vervanging voor een natuurlijke bladrand.
- Gebruik afgeronde lijnuiteinden. Maak lijnen dik genoeg om klein zichtbaar te blijven, maar vermijd zware uniforme stokken.
- Gebruik meerdere gedempte tinten alleen om plantdelen leesbaar te scheiden. Vermijd grote egale vlakken die de hele compositie overheersen.
- Gebruik een transparante achtergrond.
- Gebruik geen tekst, lettertypen, foto, rasterafbeelding, verloop, filter, masker, animatie, script of externe link.
- Het bestand moet één zelfstandig, geldig SVG-bestand zijn dat direct in een browser opent.

Eindcontrole vóór de uitvoer
- Bekijk de tekening denkbeeldig op ongeveer 18 × 27 millimeter.
- Is de natuurlijke groeiwijze nog herkenbaar?
- Kloppen bladopbouw en plaatsing globaal voor deze soort?
- Lijkt het bij de bijgevoegde symbolen te horen, en niet bij een algemene iconenset?
- Zijn plantdelen leesbaar zonder dat één blad, bloem of vrucht een logo wordt?
- Raakt geen enkel blad een ander blad zó dat de buitenrand verdwijnt? Verplaats of verwijder bladeren totdat ieder blad los te lezen is.
- Vereenvoudig opnieuw als het te druk is; herstel eerst de botanische vorm als het te grof of generiek is.

Uitvoer
Maak een downloadbaar bestand met de naam ${slugVanNaam(naam) || 'plant'}-symbool.svg. Geef geen PNG of JPEG. Als je geen bestand kunt aanbieden, geef dan uitsluitend de volledige SVG-code, beginnend met <svg en eindigend met </svg>.`;
}

function slugVanNaam(naam: string) {
  return naam.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}


export default function SymboolVeld({ naam, botanischeNaam, slug, waarde, onChange }: Props) {
  const [varianten, setVarianten] = useState<Element[] | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [promptGekopieerd, setPromptGekopieerd] = useState(false);
  const [geplakt, setGeplakt] = useState('');
  const kiezer = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let verlaten = false;
    void laadBibliotheek().then((document_) => {
      if (verlaten) return;
      zetBibliotheekInPagina(document_);
      setVarianten([...document_.querySelectorAll('g[id^="plant-"]')].filter((groep) => {
        const naam = groep.id.slice('plant-'.length);
        return naam === slug || naam.startsWith(`${slug}-`);
      }));
    });
    return () => { verlaten = true; };
  }, [slug]);

  // Niets gekozen betekent: alles uit de bibliotheek staat aan, net als altijd.
  const aangevinkt = (id: string) => waarde.bibliotheek === null || waarde.bibliotheek.includes(id);

  const wissel = (id: string) => {
    const nu = waarde.bibliotheek ?? (varianten ?? []).map((groep) => groep.id);
    onChange({ ...waarde, bibliotheek: nu.includes(id) ? nu.filter((naam) => naam !== id) : [...nu, id] });
  };

  const upload = async (bestand: File) => {
    setBezig(true); setFout('');
    try {
      const formulier = new FormData();
      formulier.append('soort', 'symbool');
      formulier.append('slug', slug || 'plant');
      formulier.append('bestand', bestand);
      const antwoord = await fetch('/api/media', { method: 'POST', body: formulier });
      // Zie AfbeeldingVeld: een HTML-foutpagina gaf anders "JSON.parse: unexpected character".
      const ruw = await antwoord.text();
      let gegevens: { bestand?: string; error?: string } = {};
      try { gegevens = JSON.parse(ruw); } catch {
        throw new Error(`Uploaden is niet gelukt (server gaf status ${antwoord.status}). Probeer het opnieuw.`);
      }
      if (!antwoord.ok || !gegevens.bestand) throw new Error(gegevens.error || 'Uploaden is niet gelukt.');
      onChange({
        ...waarde,
        bibliotheek: waarde.bibliotheek ?? (varianten ?? []).map((groep) => groep.id),
        eigen: [...waarde.eigen, { bestand: gegevens.bestand, bron: waarde.bron }],
      });
      return true;
    } catch (probleem) {
      setFout(probleem instanceof Error ? probleem.message : 'Uploaden is niet gelukt.');
      return false;
    } finally { setBezig(false); }
  };

  /**
   * Geplakte SVG-code opsturen alsof het een bestand is.
   *
   * Dit bestaat omdat een taalmodel lang niet altijd een bestand teruggeeft: bij de
   * acceptatieproef van 10 september 2026 kwam er eerst een PNG, en gratis of uitgelogde
   * chatdiensten bieden vaak helemaal geen download aan. De tekening staat dan wél gewoon
   * als code in het antwoord. Door er hier een bestand van te maken loopt het verder langs
   * precies dezelfde weg als een upload — inclusief de keuring in `keurSymbool`.
   */
  const plak = async () => {
    const tekst = geplakt.trim();
    if (!tekst) return;
    const bestand = new File([tekst], `${slugVanNaam(naam) || 'plant'}-symbool.svg`, { type: 'image/svg+xml' });
    if (await upload(bestand)) setGeplakt('');
  };

  const aantalAan = (varianten ?? []).filter((groep) => aangevinkt(groep.id)).length + waarde.eigen.length;

  return <section className="media-blok symbool-veld">
    <div className="media-kop">
      <h4>Symbool voor de plattegrond</h4>
      <p className="media-tip">Een SVG blijft scherp als hij groter of kleiner wordt. Op de plattegrond wordt dit symbool heel klein, dus gebruik één eenvoudige plant of hoogstens twee.</p>
    </div>

    <div className="symbool-keuzes">
      {varianten?.map((groep) => <button
        type="button"
        key={groep.id}
        className={`beeldkeuze${aangevinkt(groep.id) ? ' gekozen' : ''}`}
        aria-pressed={aangevinkt(groep.id)}
        onClick={() => wissel(groep.id)}
      >
        <Bibliotheektekening id={groep.id} />
        <span className="beeldkeuze-label">bibliotheek</span>
      </button>)}

      {/* Een eigen tekening staat altijd aan; hem uitzetten is hem weggooien. Dat gebeurde
          eerder door op de tegel zelf te klikken, en dat zag niemand aankomen — vandaar een
          eigen kruisje met een eigen omschrijving. */}
      {waarde.eigen.map((eigen) => <span key={eigen.bestand} className="beeldkeuze gekozen symbool-eigen">
        <span className="symbool-tegel"><img src={`/api/media/${eigen.bestand}`} alt="" /></span>
        <span className="beeldkeuze-label">eigen</span>
        <button
          type="button"
          className="symbool-weg"
          aria-label="Deze tekening verwijderen"
          title="Deze tekening verwijderen"
          onClick={() => onChange({ ...waarde, eigen: waarde.eigen.filter((ander) => ander.bestand !== eigen.bestand) })}
        >×</button>
      </span>)}

      {varianten?.length === 0 && waarde.eigen.length === 0 && <p className="symbool-leeg">Nog geen symbool</p>}
    </div>

    <p className="symbool-teller">{aantalAan === 0
      ? 'Niets aangevinkt'
      : `${aantalAan} ${aantalAan === 1 ? 'tekening' : 'tekeningen'} in gebruik`}</p>

    <input
      type="file"
      accept="image/svg+xml"
      ref={kiezer}
      hidden
      onChange={(gebeurtenis) => {
        const gekozen = gebeurtenis.target.files?.[0];
        if (gekozen) void upload(gekozen);
        gebeurtenis.target.value = '';
      }}
    />

    {/* Twee wegen naar een eigen tekening, met de knop in de uitklap waar hij bij hoort. */}
    <div className="symbool-routes">
      <details>
        <summary>Zelf maken <span>met een tekenprogramma</span></summary><div>
          <p>Maak of bewerk een SVG in een tekenprogramma. Dat kan bijvoorbeeld met het gratis programma <a href="https://inkscape.org/" target="_blank" rel="noreferrer">Inkscape</a>. Sla de tekening op als SVG-bestand en voeg dat hier toe.</p>
          {/* Dezelfde eisen als `keurSymbool` in db/media.ts; wie ze vooraf leest, krijgt geen weigering achteraf. */}
          <p className="media-tip">Het bestand moet:</p>
          <ul className="media-tip">
            <li>een SVG zijn (geen PNG of JPEG), kleiner dan 8 MB;</li>
            <li>een <code>viewBox</code> hebben (Inkscape doet dat vanzelf);</li>
            <li>op zichzelf staan: geen links naar internet, geen script en geen ingesloten webinhoud.</li>
          </ul>
          <button type="button" onClick={() => kiezer.current?.click()} disabled={bezig}>
            {bezig ? 'Bezig met uploaden…' : 'SVG-bestand uploaden'}
          </button>
        </div>
      </details>
      <details>
        <summary>Automatisch maken <span>met een LLM</span></summary><div>
          <p>Een LLM is een digitaal hulpmiddel waaraan je in gewone taal een opdracht geeft, zoals ChatGPT, Claude of Gemini. Je hoeft geen SVG-code te begrijpen.</p>
          <ol>
            <li><a href="/symbolen/planten_symbolen_overzicht.html" download>Download het voorbeeld met bestaande symbolen.</a></li>
            <li>Open een LLM dat bestanden kan lezen en voeg het gedownloade voorbeeld toe.</li>
            <li>Kopieer de opdracht hieronder en stuur die naar het LLM.</li>
            <li>Krijg je een bestand, upload dat dan bij &ldquo;Zelf maken&rdquo;. Krijg je code, plak die dan hieronder.</li>
          </ol>
          <button type="button" onClick={async () => {
            try {
              await navigator.clipboard.writeText(symboolPrompt(naam, botanischeNaam));
              setPromptGekopieerd(true);
              window.setTimeout(() => setPromptGekopieerd(false), 2000);
            } catch { setFout('Kopiëren lukt niet automatisch. Selecteer de opdracht hieronder en kopieer hem handmatig.'); }
          }}>{promptGekopieerd ? 'Opdracht gekopieerd ✓' : 'Kopieer de opdracht voor het LLM'}</button>
          <details><summary>Bekijk de volledige opdracht</summary><pre>{symboolPrompt(naam, botanischeNaam)}</pre></details>

          <label className="symbool-plakveld">
            <span>Of plak de SVG-code die je terugkreeg</span>
            <textarea
              rows={4}
              value={geplakt}
              placeholder="<svg …> … </svg>"
              onChange={(gebeurtenis) => setGeplakt(gebeurtenis.target.value)}
            />
          </label>
          <button type="button" onClick={() => void plak()} disabled={bezig || !geplakt.trim()}>
            {bezig ? 'Bezig met toevoegen…' : 'Geplakte code toevoegen'}
          </button>
        </div>
      </details>
    </div>

    {fout && <p className="creator-error" role="alert">{fout}</p>}

    <label className="plant-field">
      <span>Bron van je eigen tekeningen</span>
      <input
        type="text"
        value={waarde.bron}
        placeholder="Een link, of de naam van de maker"
        onChange={(gebeurtenis) => onChange({ ...waarde, bron: gebeurtenis.target.value })}
      />
    </label>
  </section>;
}
