'use client';

import { useEffect, useState } from 'react';
import Link from '@/app/components/NativeLink';
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
    <div className="topbar-start">
      <Zijmenu />
      <Link className="brand" href="/"><img src="/iconen/WeenerLogo.svg" alt="Weener XL" className="brand-logo" /></Link>
    </div>
    <nav aria-label="Hoofdnavigatie">
      <Link className={klas('planten')} href="/">Planten</Link>
      <Link className={klas('plattegrond')} href="/plattegrond">Plattegrond</Link>
      <Link className={klas('uitleg')} href="/uitleg">Uitleg</Link>
      <Link className={klas('drukwerk')} href="/drukwerk">Drukwerk</Link>
    </nav>
    {status === true && <div className="manage-actions">
      <Link className="manage" href="/beheren">Beheren</Link>
      <button type="button" className="manage manage-uitloggen" onClick={() => void uitloggen()}>Uitloggen</button>
    </div>}
  </header>;
}
