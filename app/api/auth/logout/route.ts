import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/app/lib/auth';
export async function POST() { const response = NextResponse.json({ ingelogd: false }); response.headers.set('Set-Cookie', `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`); return response; }
