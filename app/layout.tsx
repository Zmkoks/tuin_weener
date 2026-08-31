import type { Metadata } from 'next';
import './globals.css';
import './editor.css';

const title = 'De tuin van Weener XL';
const description = 'Ontdek, beheer en print de informatie over de tuin van Weener XL.';

export const metadata: Metadata = {
  metadataBase: new URL('https://weener-xl-tuin.spamivia.chatgpt.site'),
  title,
  description,
  openGraph: {
    title,
    description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og.png'],
  },
};

export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="nl"><body>{children}</body></html>}
