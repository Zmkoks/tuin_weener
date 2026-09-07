'use client';

import { useRef, useState } from 'react';

/**
 * Een foto of illustratie kiezen, in beeld zetten en vertellen waar hij vandaan komt.
 *
 * Het bijstellen werkt met dezelfde drie waarden als het afstelgereedschap in de hoofdmap
 * (`foto_afstellen_browser_v1.py`): horizontaal, verticaal en zoom. De voorbeeldweergave
 * hiernaast gebruikt exact de opmaak van de plantenpagina, dus wat je hier ziet is wat er
 * straks staat.
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
};

const SCHUIVEN = [
  { veld: 'x' as const, label: 'Horizontaal', min: 0, max: 100, stap: 1, eenheid: '%' },
  { veld: 'y' as const, label: 'Verticaal', min: 0, max: 100, stap: 1, eenheid: '%' },
  { veld: 'zoom' as const, label: 'Zoom', min: 0.25, max: 2.5, stap: 0.01, eenheid: '×' },
];

export default function AfbeeldingVeld({ soort, titel, slug, waarde, onChange, huidigeBron }: Props) {
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
      onChange({ ...waarde, bestand: gegevens.bestand });
    } catch (probleem) {
      setFout(probleem instanceof Error ? probleem.message : 'Uploaden is niet gelukt.');
    } finally { setBezig(false); }
  };

  const eigenGekozen = Boolean(waarde.bestand);
  const kies = (eigen: boolean) => onChange({ ...waarde, bestand: eigen ? eigenBestand : '' });

  /* Is er een eigen bestand, dan zijn er twee mogelijkheden en klik je aan welke geldt.
     De gekozen tekening krijgt een groene rand; de andere vervaagt. Zo hoeft er geen
     knop bij te staan die uitlegt waar je heen gaat. */
  const keuze = (eigen: boolean, label: string, inhoud: React.ReactNode) => <button
    type="button"
    className={`beeldkeuze${(eigen === eigenGekozen) ? ' gekozen' : ''}`}
    aria-pressed={eigen === eigenGekozen}
    onClick={() => kies(eigen)}
    key={label}
  >
    {inhoud}
    <span className="beeldkeuze-label">{label}</span>
  </button>;

  /**
   * Het kader staat vast, de foto beweegt eronder. Dat moet, want `transform: scale()`
   * vergroot het element waar het op staat: zet je dat op de foto zelf, dan groeit de
   * cirkel mee in plaats van dat er meer van de foto wordt afgesneden. Zelfde opbouw als
   * op de plantenpagina, waar `.scan-foto-vlak` het kader is en de foto het vult.
   */
  const inKader = (inhoud: React.ReactNode) => <span className={`beeldvlak ${soort}`}>{inhoud}</span>;

  const bestaandeAfbeelding = inKader(huidigeBron
    ? <img src={huidigeBron} style={stijl} alt="" />
    : <span className="afbeelding-leeg">Nog geen {soort}</span>);

  const eigenAfbeelding = inKader(<img src={`/api/media/${eigenBestand}`} style={stijl} alt="" />);

  return <div className="afbeelding-veld">
    <div className={`beeldkeuzes ${soort}`}>
      {eigenBestand
        ? <>
            {keuze(false, 'origineel', bestaandeAfbeelding)}
            {keuze(true, 'eigen', eigenAfbeelding)}
          </>
        : <div className="beeldkeuze enkel">{bestaandeAfbeelding}</div>}
    </div>

    <div className="afbeelding-knoppen">
      <h4>{titel}</h4>
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
      <button type="button" onClick={() => kiezer.current?.click()} disabled={bezig}>
        {bezig ? 'Bezig met uploaden…'
          : eigenBestand ? 'Ander bestand uploaden' : 'Eigen bestand uploaden'}
      </button>
      {fout && <p className="creator-error" role="alert">{fout}</p>}

      {SCHUIVEN.map(({ veld, label, min, max, stap, eenheid }) => <label className="afbeelding-schuif" key={veld}>
        <span>{label} <b>{waarde[veld]}{eenheid}</b></span>
        <input
          type="range"
          min={min}
          max={max}
          step={stap}
          value={waarde[veld]}
          onChange={(gebeurtenis) => onChange({ ...waarde, [veld]: Number(gebeurtenis.target.value) })}
        />
      </label>)}
      <button type="button" className="afbeelding-terug" onClick={() => onChange({ ...waarde, x: 50, y: 50, zoom: 1 })}>
        Bijstelling terugzetten
      </button>

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
  </div>;
}
