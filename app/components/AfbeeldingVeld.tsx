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

export default function AfbeeldingVeld({ soort, titel, slug, waarde, onChange, huidigeBron, hulp, bijstellen }: Props) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  // Kies je de bestaande tekening terug, dan raakt `waarde.bestand` leeg. De sleutel
  // blijft hier staan, zodat je zonder opnieuw uploaden heen en weer kunt klikken.
  const [eigenBestand, setEigenBestand] = useState(waarde.bestand);
  const kiezer = useRef<HTMLInputElement>(null);

  const src = waarde.bestand ? `/api/media/${waarde.bestand}` : huidigeBron;
  const stijl = { objectPosition: `${waarde.x}% ${waarde.y}%`, transform: `scale(${waarde.zoom})`, transformOrigin: `${waarde.x}% ${waarde.y}%` };

  const upload = async (bestand: File) => {
    setBezig(true); setFout('');
    try {
      const formulier = new FormData();
      formulier.append('soort', soort);
      formulier.append('slug', slug || 'plant');
      formulier.append('bestand', bestand);
      const antwoord = await fetch('/api/media', { method: 'POST', body: formulier });
      const gegevens = await antwoord.json() as { bestand?: string; error?: string };
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
    const kader = gebeurtenis.currentTarget;
    const maat = kader.getBoundingClientRect();
    let vorigeX = gebeurtenis.clientX;
    let vorigeY = gebeurtenis.clientY;
    kader.setPointerCapture(gebeurtenis.pointerId);

    const beweeg = (volgende: PointerEvent) => {
      const dx = ((volgende.clientX - vorigeX) / maat.width) * 100;
      const dy = ((volgende.clientY - vorigeY) / maat.height) * 100;
      vorigeX = volgende.clientX;
      vorigeY = volgende.clientY;
      verschuif(-dx, -dy);
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
