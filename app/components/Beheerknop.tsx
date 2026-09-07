'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function Beheerknop({ slug }: { slug: string }) { const [ingelogd, setIngelogd] = useState<boolean | null>(null); useEffect(() => { fetch('/api/auth/status').then(r => r.json() as Promise<{ ingelogd: boolean }>).then(d => setIngelogd(d.ingelogd)).catch(() => setIngelogd(false)); }, []); return ingelogd ? <Link className="beheer-direct" href={`/beheren/aanpassen/${slug}`}>Deze plant aanpassen</Link> : null; }
