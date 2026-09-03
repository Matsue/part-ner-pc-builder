import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://part-ner-pc-builder.hiroki-matsue.chatgpt.site'),
  title: 'PART / NER — AI-assisted PC building',
  description: 'Shop fictional PC parts together with an AI assistant that shares your live build and explains every trade-off.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'PART / NER',
    title: 'PART / NER — Build together. Choose with confidence.',
    description: 'Explore PC parts with an AI assistant that shares your build, budget, and compatibility checks. A fictional WebMCP demo.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'PART / NER — Build together. Choose with confidence.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PART / NER — Build together. Choose with confidence.',
    description: 'Explore PC parts with an AI assistant that shares your build, budget, and compatibility checks. A fictional WebMCP demo.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US" className="dark">
      <body>{children}</body>
    </html>
  );
}
