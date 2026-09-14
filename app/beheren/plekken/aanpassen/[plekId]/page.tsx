import type { Metadata } from 'next';
import Scherm from '../Scherm';
export const metadata: Metadata = { title: 'Een plek aanpassen · Beheren' };
export default async function Pagina({ params }: { params: Promise<{ plekId: string }> }) {
  const { plekId } = await params;
  return <Scherm key={plekId} plekId={plekId} />;
}
