import type { Metadata } from 'next';
import Scherm from './Scherm';

export const metadata: Metadata = { title: 'Weghalen? · Beheren' };

export default async function Pagina({ params }: { params: Promise<{ plekId: string; slug: string }> }) {
  const { plekId, slug } = await params;
  return <Scherm plekId={decodeURIComponent(plekId)} slug={decodeURIComponent(slug)} />;
}
