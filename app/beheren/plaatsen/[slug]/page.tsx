import type { Metadata } from 'next';
import Scherm from './Scherm';

export const metadata: Metadata = { title: 'Waar staat hij? · Beheren' };

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Scherm slug={decodeURIComponent(slug)} />;
}
