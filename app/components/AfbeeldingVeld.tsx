'use client';

import { useRef, useState, type ReactNode } from 'react';

/**
 * Eén blok voor één afbeelding: de foto of de botanische illustratie.
 *
 * De opbouw is per afbeelding en niet per handeling. Eerst de kop met de hulp die er bij
 * hoort, dan wat er nu staat, dan wat je ermee kunt, dan de bron. Daarvoor stond alle hulp
 * bovenaan de sectie bij elkaar, los van het veld waar hij over ging, en waren de drie
 * blokken onderling niet gescheiden.
 *
 * Bijstellen kan alleen bij de foto. Die staat in een ronde uitsnede en kan daarin wegvallen,
 * dus daar moet je hem kunnen verschuiven. Een illustratie staat in een recht kader en hoort
 * gewoon volledig leesbaar te zijn; wie hem strakker wil, snijdt hem vooraf zelf bij.
 */
export type Afstelling = { bestand: string; bron: string; x: number; y: number; zoom: number };

type Props = {
  soort: 'foto' | 'illustratie';
  titel: string;
  /** Bij welke plant hoort dit; komt in de naam van het opgeslagen bestand. */
  slug: string;
  waarde: Afstelling;
  onChange: (waarde: Afstelling) => void;
  /** Het bestand dat nu geldt zolang er niets nieuws is gekozen. */
  huidigeBron?: string;
  /** "Waar vind ik die?" — staat hier en niet los bovenaan de sectie. */
  hulp?: ReactNode;
  /** Verschuiven en zoomen. Alleen zinvol bij een uitsnede die kan afsnijden. */
  bijstellen?: boolean;
};

const MIDDEN = { x: 50, y: 50, zoom: 1 };

/**
 * Verklein een afbeelding in de browser vóór het uploaden: hoogstens `maxZijde` pixels aan de
 * langste zijde, als WebP rond kwaliteit 80 (JPEG als de browser geen WebP kan maken). Zo
 * past het binnen elke servergrens — lokaal gaf een foto van 2000 × 1500 al "te groot" — en
 * laadt de site snel. Een op scherm is de foto hoogstens ongeveer 370 pixels breed.
 * Een klein bestand dat al klein genoeg is, laten we zoals het is.
 */
async function verklein(bestand: File, maxZijde: number): Promise<File> {
  let beeld: ImageBitmap;
  try { beeld = await createImageBitmap(bestand); } catch { return bestand; }
  const schaal = Math.min(1, maxZijde / Math.max(beeld.width, beeld.height));
  if (schaal === 1 && bestand.size < 400 * 1024) { beeld.close(); return bestand; }
  const doek = document.createElement('canvas');
  doek.width = Math.round(beeld.width * schaal);
  doek.height = Math.round(beeld.height * schaal);
  doek.getContext('2d')?.drawImage(beeld, 0, 0, doek.width, doek.height);
  beeld.close();
  const naarBlob = (type: string, kwaliteit: number) => new Promise<Blob | null>((klaar) => doek.toBlob(klaar, type, kwaliteit));
  const webp = await naarBlob('image/webp', 0.8);
  const blob = webp?.type === 'image/webp' ? webp : await naarBlob('image/jpeg', 0.85);
  if (!blob) return bestand;
  const extensie = blob.type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], bestand.name.replace(/\.[^.]+$/, '') + '.' + extensie, { type: blob.type });
}

export default function AfbeeldingVeld({ soort, titel, slug, waarde, onChange, huidigeBron, hulp, bijstellen }: Props) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  // Kies je de bestaande tekening terug, dan raakt `waarde.bestand` leeg. De sleutel
  // blijft hier staan, zodat je zonder opnieuw uploaden heen en weer kunt klikken.
  const [eigenBestand, setEigenBestand] = useState(waarde.bestand);
  const kiezer = useRef<HTMLInputElement>(null);

  const src = waarde.bestand ? `/api/media/${waarde.bestand}` : huidigeBron;
  const stijl = { objectPosition: `${waarde.x}% ${waarde.y}%`, transform: `scale(${waarde.zoom})`, transformOrigin: `${waarde.x}% ${waarde.y}%` };

  const upload = async (origineel: File) => {
    setBezig(true); setFout('');
    try {
      const bestand = await verklein(origineel, soort === 'foto' ? 1200 : 1600);
      const formulier = new FormData();
      formulier.append('soort', soort);
      formulier.append('slug', slug || 'plant');
      formulier.append('bestand', bestand);
      const antwoord = await fetch('/api/media', { method: 'POST', body: formulier });
      // Geen `antwoord.json()` rechtstreeks: gaat er vóór de route iets mis (bestand te groot
      // voor de server, sessie verlopen, serverfout), dan komt er een HTML-pagina terug en werd
      // de melding "JSON.parse: unexpected character" — die zegt niemand iets.
      const ruw = await antwoord.text();
      let gegevens: { bestand?: string; error?: string } = {};
      try { gegevens = JSON.parse(ruw); } catch {
        throw new Error(antwoord.status === 413
          ? 'Dit bestand is ook na verkleinen nog te groot voor de server. Probeer een ander JPEG-, PNG- of WebP-bestand.'
          : `Uploaden is niet gelukt (server gaf status ${antwoord.status}). Probeer het opnieuw of kies een kleiner JPEG-, PNG- of WebP-bestand.`);
      }
      if (!antwoord.ok || !gegevens.bestand) throw new Error(gegevens.error || 'Uploaden is niet gelukt.');
      setEigenBestand(gegevens.bestand);
      // Een nieuwe afbeelding begint in het midden: de bijstelling van de vórige foto zegt
      // niets over deze, en scheef beginnen is verwarrender dan opnieuw instellen.
      onChange({ ...waarde, ...MIDDEN, bestand: gegevens.bestand });
    } catch (probleem) {
      setFout(probleem instanceof Error ? probleem.message : 'Uploaden is niet gelukt.');
    } finally { setBezig(false); }
  };

  const verschuif = (dx: number, dy: number) => onChange({
    ...waarde,
    x: Math.min(100, Math.max(0, waarde.x + dx)),
    y: Math.min(100, Math.max(0, waarde.y + dy)),
  });

  /**
   * Slepen in het kader, zoals bij het instellen van een profielfoto.
   *
   * De verplaatsing wordt als deel van de kaderbreedte gerekend: sleep je het kader helemaal
   * door, dan schuift de uitsnede 100% op. Dat is niet exact de afstand in de foto — daarvoor
   * zou je de ware afmetingen en de zoom moeten meerekenen — maar het voelt wel juist en is
   * voorspelbaar. Het teken is omgekeerd omdat je de fóto verschuift en niet het kader: naar
   * rechts slepen brengt de linkerkant in beeld.
   */
  const startSlepen = (gebeurtenis: React.PointerEvent<HTMLSpanElement>) => {
    if (!bijstellen || !src) return;
    gebeurtenis.preventDefault();
    const kader = gebeurtenis.currentTarget;
    const maat = kader.getBoundingClientRect();
    const beginX = gebeurtenis.clientX;
    const beginY = gebeurtenis.clientY;
    // Vanaf de stand bij het begin rekenen, met de totale verplaatsing. Eerder werd per
    // beweging een klein stapje opgeteld bij `waarde` — maar die `waarde` was de stand van
    // het moment dat het slepen begon (de functie onthoudt hem), dus elke beweging zette de
    // foto terug op het begin plus één stapje: hij bewoog vrijwel niet.
    const begin = { ...waarde };
    kader.setPointerCapture(gebeurtenis.pointerId);

    // Hoeveel schermpixels één procent `object-position` is, zodat het vastgepakte punt onder
    // de muis blijft — ook ingezoomd. De foto vult het kader als `cover` (getekende maat I) en
    // wordt daarna `scale(z)` vergroot rond het punt x% van het kader (breedte W). Een punt
    // in de foto verschuift dan per procent (W − z·I) / 100 pixels: dat is dus kleiner naarmate
    // er minder over de rand valt, en groter naarmate je verder inzoomt. Een vaste stap per
    // kaderbreedte (zoals eerst) liet de foto bij sterke zoom verder schieten dan de muis.
    const foto = kader.querySelector('img');
    const perProcent = (kaderMaat: number, natuur: number, ander: number, anderKader: number) => {
      const cover = Math.max(kaderMaat / natuur, anderKader / ander);
      const getekend = natuur * cover * begin.zoom;
      return (getekend - kaderMaat) / 100;
    };
    const pxX = foto?.naturalWidth ? perProcent(maat.width, foto.naturalWidth, foto.naturalHeight, maat.height) : maat.width / 100;
    const pxY = foto?.naturalHeight ? perProcent(maat.height, foto.naturalHeight, foto.naturalWidth, maat.width) : maat.height / 100;

    const beweeg = (volgende: PointerEvent) => {
      // Valt er langs een as (bijna) niets buiten het kader, dan valt er daar ook niets te
      // verschuiven. Uitgezoomd (zoom < 1) is de stap negatief; de formule klopt dan nog steeds.
      const dx = Math.abs(pxX) > 0.5 ? (volgende.clientX - beginX) / pxX : 0;
      const dy = Math.abs(pxY) > 0.5 ? (volgende.clientY - beginY) / pxY : 0;
      onChange({
        ...begin,
        x: Math.round(Math.min(100, Math.max(0, begin.x - dx)) * 10) / 10,
        y: Math.round(Math.min(100, Math.max(0, begin.y - dy)) * 10) / 10,
      });
    };
    const stop = () => {
      kader.removeEventListener('pointermove', beweeg);
      kader.removeEventListener('pointerup', stop);
      kader.removeEventListener('pointercancel', stop);
    };
    kader.addEventListener('pointermove', beweeg);
    kader.addEventListener('pointerup', stop);
    kader.addEventListener('pointercancel', stop);
  };

  /** Slepen werkt niet met een toetsenbord; de pijltjes doen hetzelfde in stapjes van 2%. */
  const opToets = (gebeurtenis: React.KeyboardEvent) => {
    if (!bijstellen) return;
    const stappen: Record<string, [number, number]> = {
      ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2],
    };
    const stap = stappen[gebeurtenis.key];
    if (!stap) return;
    gebeurtenis.preventDefault();
    verschuif(stap[0], stap[1]);
  };

  const inhoud = src
    ? <img src={src} style={stijl} alt="" draggable={false} />
    : <span className="afbeelding-leeg">Nog geen {soort}</span>;

  const bijgesteld = waarde.x !== MIDDEN.x || waarde.y !== MIDDEN.y || waarde.zoom !== MIDDEN.zoom;

  return <section className="media-blok">
    <div className="media-kop">
      <h4>{titel}</h4>
      {hulp && <details className="media-hulp">
        <summary>Waar vind ik die?</summary>
        <div>{hulp}</div>
      </details>}
    </div>

    <div className="media-lijf">
      <div className="media-voorbeeld">
        <span
          className={`beeldvlak ${soort}${bijstellen && src ? ' sleepbaar' : ''}`}
          onPointerDown={startSlepen}
          onKeyDown={opToets}
          role={bijstellen && src ? 'application' : undefined}
          tabIndex={bijstellen && src ? 0 : undefined}
          aria-label={bijstellen && src ? `${titel} verschuiven met de pijltjestoetsen` : undefined}
        >{inhoud}</span>
        {bijstellen && src && <p className="media-tip">Sleep de foto om hem goed in de cirkel te zetten.</p>}
      </div>

      <div className="media-acties">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={kiezer}
          hidden
          onChange={(gebeurtenis) => {
            const gekozen = gebeurtenis.target.files?.[0];
            if (gekozen) void upload(gekozen);
            gebeurtenis.target.value = '';
          }}
        />
        <button type="button" className="media-doen" onClick={() => kiezer.current?.click()} disabled={bezig}>
          {bezig ? 'Bezig met uploaden…'
            : eigenBestand ? 'Ander bestand uploaden' : 'Eigen bestand uploaden'}
        </button>
        {/* Is er een eigen bestand, dan kun je terug naar het oorspronkelijke beeld zonder
            de sleutel kwijt te raken; heen en weer klikken kan dus zonder opnieuw uploaden. */}
        {eigenBestand && <div className="media-welke" role="group" aria-label={`Welke ${soort} geldt`}>
          <button type="button" className={waarde.bestand ? '' : 'gekozen'} aria-pressed={!waarde.bestand}
            onClick={() => onChange({ ...waarde, bestand: '' })}>Oorspronkelijk</button>
          <button type="button" className={waarde.bestand ? 'gekozen' : ''} aria-pressed={Boolean(waarde.bestand)}
            onClick={() => onChange({ ...waarde, bestand: eigenBestand })}>Eigen bestand</button>
        </div>}

        {fout && <p className="creator-error" role="alert">{fout}</p>}

        {bijstellen && <label className="afbeelding-schuif">
          <span>Zoom <b>{waarde.zoom}×</b></span>
          <input type="range" min={0.25} max={2.5} step={0.01} value={waarde.zoom}
            onChange={(gebeurtenis) => onChange({ ...waarde, zoom: Number(gebeurtenis.target.value) })} />
        </label>}
        {bijstellen && bijgesteld && <button type="button" className="media-terug"
          onClick={() => onChange({ ...waarde, ...MIDDEN })}>Bijstelling terugzetten</button>}

        <label className="plant-field">
          <span>Bron van deze {soort}</span>
          <input
            type="text"
            value={waarde.bron}
            placeholder="Een link, of de naam van de maker"
            onChange={(gebeurtenis) => onChange({ ...waarde, bron: gebeurtenis.target.value })}
          />
        </label>
      </div>
    </div>
  </section>;
}
