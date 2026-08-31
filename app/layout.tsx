import type { Metadata } from 'next';
import './globals.css';
import './editor.css';
export const metadata:Metadata={title:'De tuin van Weener XL',description:'Ontdek, beheer en print de informatie over de tuin van Weener XL.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="nl"><body>{children}</body></html>}
