import type { Metadata } from 'next';
import Scherm from './Scherm';

export const metadata: Metadata = { title: 'Op welke plek? · Beheren' };

export default function Pagina() {
  return <Scherm />;
}
