import { NextResponse } from 'next/server';
import { geldigeSessie } from '@/app/lib/auth';
export async function GET(request: Request) { return NextResponse.json({ ingelogd: await geldigeSessie(request) }); }
