'use client';

import { useState } from 'react';
import type { Vorm } from '@/app/data/plekTypes';
import { useBeheer } from '../../../BeheerContext';
import { BovenaanBeginnen, Kaart, Melding, NietGevonden, Terug, useHandeling } from '../../../onderdelen';

type VormType = 'rect' | 'circle' | 'oval';
type Soort = 'bak' | 'vrij' | 'boom';

/**
 * Uitweg vanuit het plantenplaatsingsscherm: teken een echte plek en zet de plant daar
 * meteen op. Een boom of heester is geen vorm maar één punt (dat punt ís de boom), dus voor
 * zo'n plant is er een derde keuze: een punt aanklikken. Zonder die keuze kon een nieuwe boom
 * nergens heen — op een bestaand punt staat al een andere boom.
 */
export default function NieuwePlekVoorPlant({ slug }: { slug: string }) {
  const { planten, plantVan, plekken, beplanting, namen, maakPlekEnZetVorm, maakBoomPunt } = useBeheer();
  const plant = plantVan(slug);
  const [soort, setSoort] = useState<Soort>(plant?.boomHeester ? 'boom' : 'vrij');
  const [vormType, setVormType] = useState<VormType>('oval');
  const [vorm, setVorm] = useState<Vorm | null>(null);
  const [punt, setPunt] = useState<{ x: number; y: number } | null>(null);
  const { bezig, fout, doe } = useHandeling();

  if (!plant) return <NietGevonden
    titel="Deze plant staat niet in de bibliotheek"
    tekst="Misschien is de naam veranderd of is de plant verwijderd. Kies hem opnieuw uit de lijst."
    naar="/beheren/plaatsen"
    tekstTerug="Een plant kiezen"
  />;

  const kiesVorm = (nieuwType: VormType) => {
    setVormType(nieuwType);
    setVorm(null);
  };

  const kiesSoort = (nieuweSoort: Soort) => {
    setSoort(nieuweSoort);
    setVormType(nieuweSoort === 'bak' ? 'rect' : 'oval');
    setVorm(null);
    setPunt(null);
  };

  const maat = vorm?.type === 'rect' && vorm.b && vorm.h
    ? `${vorm.b} × ${vorm.h} mm`
    : vorm?.type === 'ellipse' && vorm.rx && vorm.ry
      ? Math.abs(vorm.rx - vorm.ry) < 0.01
        ? `doorsnee ${vorm.rx * 2} mm`
        : `${vorm.rx * 2} × ${vorm.ry * 2} mm`
      : '';

  const isBoom = soort === 'boom';
  const kanOpslaan = isBoom ? Boolean(punt) : Boolean(vorm);
  const opslaan = () => {
    if (isBoom && punt) void doe(() => maakBoomPunt(plant, punt.x, punt.y));
    else if (!isBoom && vorm) void doe(() => maakPlekEnZetVorm(plant, vorm, soort === 'bak' ? 'bak' : 'vrij'));
  };

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar={`/beheren/plaatsen/${encodeURIComponent(plant.slug)}`} tekst="Toch een bestaande plek kiezen" />
    <h1>Een nieuwe plek voor de {plant.naam}</h1>
    <p className="lead">{isBoom
      ? `Klik op de kaart aan waar de ${plant.naam} staat. Hij komt er als punt met een letter te staan.`
      : `Kun je de juiste plek niet aanwijzen? Teken hier de echte vorm van de plek. De ${plant.naam} wordt er meteen op gezet.`}</p>

    <div className="beheer-werkblad">
      <Kaart
        plekken={plekken}
        gekozen=""
        onKies={() => {}}
        namen={namen}
        planten={planten}
        beplanting={beplanting}
        {...(isBoom
          ? { opPunt: (x: number, y: number) => setPunt({ x, y }), punt }
          : { tekenVorm: vormType, onVorm: setVorm, vormPreview: vorm })}
      />
      <aside>
        <div className="beheer-paneel">
          <h2>Wat wil je {isBoom ? 'aanwijzen' : 'tekenen'}?</h2>
          <div className="soort-keuze" role="radiogroup" aria-label="Soort plek">
            {plant.boomHeester && <button type="button" className={isBoom ? 'gekozen' : ''} role="radio" aria-checked={isBoom} onClick={() => kiesSoort('boom')}>
              <b>Dit is een boom of heester</b>
              <small>Hij staat los in de grond: klik aan waar de stam staat.</small>
            </button>}
            <button type="button" className={soort === 'bak' ? 'gekozen' : ''} role="radio" aria-checked={soort === 'bak'} onClick={() => kiesSoort('bak')}>
              <b>{plant.boomHeester ? 'Hij staat in een plantenbak' : 'Dit is een plantenbak'}</b>
              <small>Een afgebakende bak: kies daarna een rechthoek of cirkel.</small>
            </button>
            <button type="button" className={soort === 'vrij' ? 'gekozen' : ''} role="radio" aria-checked={soort === 'vrij'} onClick={() => kiesSoort('vrij')}>
              <b>{plant.boomHeester ? 'Hij staat in een vrije plek' : 'Dit is geen plantenbak'}</b>
              <small>Een vrije plek in de grond: die teken je als ovaal.</small>
            </button>
          </div>
          {isBoom
            ? <>
              <p className="teken-uitleg">Klik op de kaart waar de boom of heester staat. Klik opnieuw om het punt te verzetten.</p>
              {punt && <p className="teken-maat">Gekozen punt: {punt.x.toFixed(0)}, {punt.y.toFixed(0)} mm</p>}
            </>
            : <>
              <h2 className="vorm-kop">Vorm tekenen</h2>
              {soort === 'bak'
                ? <div className="vorm-keuze" role="group" aria-label="Vorm van de plantenbak">
                  <button type="button" className={vormType === 'rect' ? 'gekozen' : ''} aria-pressed={vormType === 'rect'} onClick={() => kiesVorm('rect')}>
                    <span className="vorm-icoon rechthoek" aria-hidden="true" />
                    Rechthoek
                  </button>
                  <button type="button" className={vormType === 'circle' ? 'gekozen' : ''} aria-pressed={vormType === 'circle'} onClick={() => kiesVorm('circle')}>
                    <span className="vorm-icoon cirkel" aria-hidden="true" />
                    Cirkel
                  </button>
                </div>
                : <div className="vorm-vrije-plek">
                  <span className="vorm-icoon ovaal" aria-hidden="true" />
                  <p>Deze vrije plek teken je als een ovaal. Sleep over de kaart in de richting en maat die klopt.</p>
                </div>}
              <p className="teken-uitleg">Sleep op de kaart om de gekozen vorm te tekenen.</p>
              {vorm && <p className="teken-maat">Gekozen: {maat}</p>}
            </>}
          <Melding fout={fout} />
          <button type="button" className="beheer-doen" disabled={!kanOpslaan || bezig} onClick={opslaan}>
            {bezig ? 'Bezig met opslaan…' : isBoom ? `De ${plant.naam} hier op de kaart zetten` : `Nieuwe plek maken met de ${plant.naam}`}
          </button>
          <p className="beheer-let-op">{isBoom
            ? 'Staat deze soort al ergens anders als boom, dan krijgt het nieuwe punt dezelfde letter.'
            : 'De vorm en de beplanting staan na opslaan meteen op de kaart.'}</p>
        </div>
      </aside>
    </div>
  </div>;
}
