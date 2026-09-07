import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { geldigeSessie } from './app/lib/auth';

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/beheren/') || await geldigeSessie(request)) return NextResponse.next();
  return NextResponse.redirect(new URL('/beheren', request.url));
}

export const config = { matcher: ['/beheren/:path*'] };
