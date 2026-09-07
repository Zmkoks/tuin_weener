'use client';

import { useRouter } from 'next/navigation';
import PlantCreator from '@/app/PlantCreator';
import { useBeheer } from '../BeheerContext';
import { BovenaanBeginnen, Terug } from '../onderdelen';

export default function NieuwePlant() {
  const router = useRouter();
  const { planten, nieuwePlantOpgeslagen } = useBeheer();

  return <div className="beheer">
    <BovenaanBeginnen />
    <Terug naar="/beheren" tekst="Terug naar het begin" />
    <PlantCreator
      plants={planten}
      onSaved={(plant) => {
        nieuwePlantOpgeslagen(plant);
        // `replace`, geen `push`: de plant is opgeslagen, dus de terugknop hoort niet in
        // een formulier te komen dat al verstuurd is.
        router.replace(`/beheren/plaatsen/${encodeURIComponent(plant.slug)}`);
      }}
    />
  </div>;
}
