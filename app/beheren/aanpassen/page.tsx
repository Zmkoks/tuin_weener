import type { Metadata } from 'next';
import Scherm from './Scherm';

export const metadata: Metadata = { title: 'Welke plant klopt niet? · Beheren' };

export default function Pagina() {
  return <Scherm />;
}
