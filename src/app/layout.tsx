import type { Metadata, Viewport } from 'next';
import type React from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Rota',
  description: 'Four training days, in order, whenever you train.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Rota', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#131416' },
    { media: '(prefers-color-scheme: light)', color: '#F2F0EB' },
  ],
};

// Strata's Night is the default; Day follows the phone's light setting (useful under bright gym lights).
const THEME_SCRIPT = `(function(){var m=window.matchMedia('(prefers-color-scheme: light)');function s(){document.documentElement.dataset.theme=m.matches?'day':'night'}s();m.addEventListener('change',s)})()`;

export default function RootLayout({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
