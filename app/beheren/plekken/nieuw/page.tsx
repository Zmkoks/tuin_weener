import type { Metadata } from 'next';
import Scherm from './Scherm';

export const metadata: Metadata = { title: 'Een plek toevoegen · Beheren' };

export default function Pagina() {
  return <Scherm />;
}
