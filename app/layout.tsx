import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';
import GlobalToasts from '@/components/ui/GlobalToasts';
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@/lib/appConfig';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${APP_NAME} - ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <AppProvider>
          {children}
          <GlobalToasts />
        </AppProvider>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
