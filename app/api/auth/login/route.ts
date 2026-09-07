import { NextResponse } from 'next/server';
import { cookieHeader, maakSessie, juisteCode } from '@/app/lib/auth';
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { code?: unknown };
  if (!juisteCode(body.code)) return NextResponse.json({ error: 'Inloggen lukt niet.' }, { status: 401 });
  const response = NextResponse.json({ ingelogd: true });
  response.headers.set('Set-Cookie', cookieHeader(await maakSessie(), new URL(request.url).protocol === 'https:'));
  return response;
}
