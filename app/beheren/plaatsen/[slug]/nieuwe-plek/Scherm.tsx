'use client';

import { useState } from 'react';
import type { Vorm } from '@/app/data/plekTypes';
import { useBeheer } from '../../../BeheerContext';
import { BovenaanBeginnen, Kaart, Melding, NietGevonden, Terug, useHandeling } from '../../../onderdelen';

type VormType = 'rect' | 'circle' | 'oval';

/**
 * Uitweg vanuit het plantenplaatsingsscherm: teken een echte plek en zet de plant daar
 * meteen op. Een losse punt blijft alleen voor bomen en heesters bestaan.
 */
export default function NieuwePlekVoorPlant({ slug }: { slug: string }) {
  const { planten, plantVan, plekken, beplanting, namen, maakPlekEnZetVorm } = useBeheer();
  const [isBak, setIsBak] = useState(false);
  const [vormType, setVormType] = useState<VormType>('oval');
  const [vorm, setVorm] = useState<Vorm | null>(null);
  const { bezig, fout, doe } = useHandeling();

  const plant = plantVan(slug);
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

  const kiesSoort = (nieuweIsBak: boolean) => {
    setIsBak(nieuweIsBak);
    setVormType(nieuweIsBak ? 'rect' : 'oval');
    setVorm(null);
  };

  const maat = vorm?.type === 'rect' && vorm.b && vorm.h
    ? `${vorm.b} × ${vorm.h} mm`
    : vorm?.type === 'ellipse' && vorm.rx && vorm.ry
      ? Math.abs(vorm.rx - vorm.ry) < 0.01
        ? `doorsnee ${vorm.rx * 2} mm`
        : `${vorm.rx * 2} × ${vorm.ry * 2} mm`
      : '';

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar={`/beheren/plaatsen/${encodeURIComponent(plant.slug)}`} tekst="Toch een bestaande plek kiezen" />
    <h1>Een nieuwe plek voor de {plant.naam}</h1>
    <p className="lead">Kun je de juiste plek niet aanwijzen? Teken hier de echte vorm van de plek. De {plant.naam} wordt er meteen op gezet.</p>

    <div className="beheer-werkblad">
      <Kaart
        plekken={plekken}
        gekozen=""
        onKies={() => {}}
        namen={namen}
        planten={planten}
        beplanting={beplanting}
        tekenVorm={vormType}
        onVorm={setVorm}
        vormPreview={vorm}
      />
      <aside>
        <div className="beheer-paneel">
          <h2>Wat wil je tekenen?</h2>
          <div className="soort-keuze" role="radiogroup" aria-label="Soort plek">
            <button type="button" className={isBak ? 'gekozen' : ''} role="radio" aria-checked={isBak} onClick={() => kiesSoort(true)}>
              <b>Dit is een plantenbak</b>
              <small>Een afgebakende bak: kies daarna een rechthoek of cirkel.</small>
            </button>
            <button type="button" className={!isBak ? 'gekozen' : ''} role="radio" aria-checked={!isBak} onClick={() => kiesSoort(false)}>
              <b>Dit is geen plantenbak</b>
              <small>Een vrije plek in de grond: die teken je als ovaal.</small>
            </button>
          </div>
          <h2 className="vorm-kop">Vorm tekenen</h2>
          {isBak
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
          <Melding fout={fout} />
          <button type="button" className="beheer-doen" disabled={!vorm || bezig} onClick={() => vorm && void doe(() => maakPlekEnZetVorm(plant, vorm, isBak ? 'bak' : 'vrij'))}>
            {bezig ? 'Bezig met opslaan…' : `Nieuwe plek maken met de ${plant.naam}`}
          </button>
          <p className="beheer-let-op">De vorm en de beplanting staan na opslaan meteen op de kaart. Op de gedrukte plattegrond komt de plek pas als die opnieuw wordt gemaakt.</p>
        </div>
      </aside>
    </div>
  </div>;
}
