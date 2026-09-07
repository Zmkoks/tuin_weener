import { leesBestand } from '@/db/media';

type Props = { params: Promise<{ sleutel: string[] }> };

/** Een geüploade afbeelding uitserveren. De sleutel staat in het plantenpaspoort. */
export async function GET(_request: Request, { params }: Props) {
  const sleutel = (await params).sleutel.map(decodeURIComponent).join('/');
  const bestand = await leesBestand(sleutel);
  if (!bestand) return new Response('Niet gevonden', { status: 404 });

  return new Response(bestand.body, {
    headers: {
      'content-type': bestand.httpMetadata?.contentType || 'application/octet-stream',
      // Een SVG is tekst die de browser uitvoert als je hem als pagina opent. Bij het
      // uploaden weigeren we al script; dit is het tweede slot op dezelfde deur.
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
      'x-content-type-options': 'nosniff',
      // De sleutel is uniek per upload, dus een nieuwe foto is een nieuw adres.
      'cache-control': 'public, max-age=31536000, immutable',
      'content-length': String(bestand.size),
    },
  });
}
