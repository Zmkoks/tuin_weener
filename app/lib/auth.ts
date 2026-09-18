import { env } from 'cloudflare:workers';

export const AUTH_COOKIE = 'weener_beheer';
// Eén werkdag: op een gedeelde computer blijft niemand dagenlang ingelogd.
const MAX_AGE = 60 * 60 * 8;

function setting(name: string) {
  return (env as unknown as Record<string, string | undefined>)[name] || '';
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(setting('BEHEER_SESSION_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function maakSessie() {
  const waarde = `${Date.now()}`;
  return `${waarde}.${await sign(waarde)}`;
}

export async function geldigeSessie(request: Request) {
  const cookie = request.headers.get('cookie')?.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`))?.[1] || '';
  const [waarde, handtekening] = cookie.split('.');
  if (!waarde || !handtekening || !setting('BEHEER_SESSION_SECRET')) return false;
  const leeftijd = Date.now() - Number(waarde);
  if (!Number.isFinite(leeftijd) || leeftijd < 0 || leeftijd > MAX_AGE * 1000) return false;
  return handtekening === await sign(waarde);
}

export function juisteCode(code: unknown) {
  return typeof code === 'string' && Boolean(setting('BEHEER_CODE')) && code === setting('BEHEER_CODE');
}

export function cookieHeader(value: string, secure = false) {
  return `${AUTH_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}; ${secure ? 'Secure; ' : ''}`;
}
