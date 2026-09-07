import type { Metadata } from 'next';
import Scherm from './Scherm';

export const metadata: Metadata = { title: 'Welke plant staat er niet meer? · Beheren' };

export default async function Pagina({ params }: { params: Promise<{ plekId: string }> }) {
  const { plekId } = await params;
  return <Scherm plekId={decodeURIComponent(plekId)} />;
}
