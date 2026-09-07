import Link from 'next/link';
import Zijmenu from './Zijmenu';

/** Zelfde namen als `Onderdeel` in Kopbalk.tsx, maar hier is nooit "planten" of "beheren"
 * de actieve pagina — dit is geen tabblad van de homepage. */
type Actief = 'uitleg';

/**
 * Kopbalk voor de pagina's achter een QR-code: plant, plek en de drie uitlegpagina's.
 *
 * Smal: alleen het merk en de menuknop. Wie in de tuin een bordje scant, wil eerst zien
 * waar hij is; een volle balk met vier tabbladen is dan alleen ruis.
 *
 * Vanaf 901px — dezelfde grens als de homepage — is er ruimte genoeg en staat er in
 * plaats daarvan de gewone navigatie, in scan.css tot de rand van het venster getrokken
 * net als `.topbar`. Het zijmenu is dan overbodig en gaat weg; zie `.scan-kop .menu-knop`
 * in menu.css.
 *
 * Eigen opmaak en eigen links in plaats van hergebruik van Kopbalk.tsx: scan.css staat
 * los van globals.css (zelfde reden als de gedupliceerde kleurtokens hierboven), en de
 * pagina's hier hebben geen homepage-tabblad om als "actief" te markeren — behalve Uitleg.
 */
export default function ScanKop({ actief }: { actief?: Actief } = {}) {
  const klas = (naam: Actief) => (actief === naam ? 'actief' : undefined);
  return <header className="scan-kop">
    <Zijmenu />
    <Link className="scan-kop-merk" href="/">
      <img src="/iconen/WeenerLogo.svg" alt="Weener XL" className="scan-kop-logo"/>
      <small>de tuin</small>
    </Link>

    {/* Gewone ankers voor de homepage-tabbladen: die zijn geen eigen adres maar een
        `#`-stukje, en `app/page.tsx` leest dat bij het laden uit `location.hash` — dat
        werkt voor een volle paginalading vanaf hier net zo goed als vanaf de balk zelf. */}
    <nav className="scan-kop-nav" aria-label="Hoofdnavigatie">
      <a href="/">Planten</a>
      <Link href="/plattegrond">Plattegrond</Link>
      <Link className={klas('uitleg')} href="/uitleg">Uitleg</Link>
      <Link href="/drukwerk">Drukwerk</Link>
    </nav>
    <Link className="scan-kop-beheren" href="/beheren">Beheren</Link>
  </header>;
}
