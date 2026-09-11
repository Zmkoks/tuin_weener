import type { Metadata } from 'next';
import Scherm from './Scherm';

export const metadata: Metadata = { title: 'Een plantvak tekenen · Beheren' };

export default function Pagina() {
  return <Scherm />;
}
