import type { Metadata } from 'next';
import './globals.css';
import './editor.css';
import './beheer.css';
import './scan.css';
import './uitleg.css';
import './menu.css';
import SiteVoet from './components/SiteVoet';
export const metadata:Metadata={title:'De tuin van Weener XL',description:'Ontdek, beheer en print de informatie over de tuin van Weener XL.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="nl"><body>{children}<SiteVoet /></body></html>}
