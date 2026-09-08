import Link from '@/app/components/NativeLink';

export default function SiteVoet() {
  return <footer className="site-voet">
    <div className="site-voet-inner">
      <div className="site-voet-merk"><img src="/iconen/WeenerLogo.svg" alt="Weener XL" /><p>Deze tuin is gemaakt voor <strong>Aan de Slag</strong> van Weener XL.</p></div>
      <nav aria-label="Sitemap" className="site-voet-sitemap"><Link href="/">Planten</Link><Link href="/plattegrond">Plattegrond</Link><Link href="/uitleg">Uitleg</Link><Link href="/drukwerk">Drukwerk</Link><Link href="/beheren">Beheren</Link></nav>
    </div>
  </footer>;
}
