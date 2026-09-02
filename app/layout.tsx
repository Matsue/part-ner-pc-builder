import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PART / NER — AI-assisted PC building',
  description: 'Shop fictional PC parts together with an AI assistant that shares your live build and explains every trade-off.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
