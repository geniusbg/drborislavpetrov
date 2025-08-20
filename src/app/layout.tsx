import type { Metadata, Viewport } from 'next'
import { getSiteDomain } from '@/lib/site'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
// No global overlay to avoid body-level hydration diffs

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteDomain()
  return {
    title: 'Д-р Борислав Петров - Стоматология',
    description: 'Професионална стоматологична практика в София',
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Админ Панел',
    },
    metadataBase: new URL(base),
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e40af',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Админ Панел" />
      </head>
      <body className={inter.className}>
        {children}
          <Script
            id="service-worker"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  var isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
                  if (isLocal) {
                    console.log('[SW] Skipping registration on localhost');
                    navigator.serviceWorker.getRegistrations().then(function(regs){
                      regs.forEach(function(r){ r.unregister(); });
                    });
                  } else {
                    window.addEventListener('load', function() {
                      console.log('[SW] Registering...');
                      navigator.serviceWorker.register('/sw.js')
                        .then(function(registration) {
                          console.log('[SW] Registered:', registration.scope);
                        })
                        .catch(function(error) {
                          console.error('[SW] Registration failed:', error);
                        });
                    });
                    navigator.serviceWorker.addEventListener('message', function(event) {
                      console.log('[SW] message:', event.data);
                    });
                  }
                } else {
                  console.log('[SW] Not supported');
                }
              `,
                         }}
           />
      </body>
    </html>
  )
} 