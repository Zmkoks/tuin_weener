import type { Metadata } from 'next';
import Scherm from './Scherm';

export const metadata: Metadata = { title: 'Nieuwe plant · Beheren' };

export default function Pagina() {
  return <Scherm />;
}
