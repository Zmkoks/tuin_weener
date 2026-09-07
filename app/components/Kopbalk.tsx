'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Zijmenu from './Zijmenu';

/**
 * De balk bovenaan, gedeeld door de homepage en het beheerscherm.
 */
export type Onderdeel = 'planten' | 'plattegrond' | 'uitleg' | 'drukwerk' | 'beheren';

export default function Kopbalk({ actief }: { actief: Onderdeel }) {
  const [status, setStatus] = useState<boolean | null>(null);
  useEffect(() => { fetch('/api/auth/status').then(r => r.json() as Promise<{ ingelogd: boolean }>).then(data => setStatus(data.ingelogd)).catch(() => setStatus(false)); }, []);
  async function uitloggen() { await fetch('/api/auth/logout', { method: 'POST' }); setStatus(false); }
  const klas = (naam: Onderdeel) => (actief === naam ? 'active' : '');
  return <header className="topbar">
    <Zijmenu />
    <a className="brand" href="/"><img src="/iconen/WeenerLogo.svg" alt="Weener XL" className="brand-logo" /></a>
    <nav aria-label="Hoofdnavigatie">
      <a className={klas('planten')} href="/">Planten</a>
      <Link className={klas('plattegrond')} href="/plattegrond">Plattegrond</Link>
      <Link className={klas('uitleg')} href="/uitleg">Uitleg</Link>
      <Link className={klas('drukwerk')} href="/drukwerk">Drukwerk</Link>
    </nav>
    {status === true ? <button type="button" className="manage" onClick={() => void uitloggen()}>Uitloggen</button> : <Link className="manage" href="/beheren">Beheren</Link>}
  </header>;
}
