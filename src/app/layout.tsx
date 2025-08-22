import type { Metadata, Viewport } from 'next'
import { getSiteDomain } from '@/lib/site'
import { Inter } from 'next/font/google'
import './globals.css'
import UnderConstructionBanner from '@/components/UnderConstructionBanner'
import Script from 'next/script'

// Extend Window interface for service worker registration flag and socket
declare global {
  interface Window {
    serviceWorkerRegistered?: boolean
    socket?: {
      emit: (event: string, data: unknown) => void
      on: (event: string, handler: (data: unknown) => void) => void
      off: (event: string, handler: (data: unknown) => void) => void
    }
  }
}

// No global overlay to avoid body-level hydration diffs

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteDomain()
  return {
    title: 'Д-р Борислав Петров - Стоматология',
    description: 'Професионална стоматологична практика в София',
    manifest: '/manifest.json',
    other: {
      'Cache-Control': 'public, max-age=3600', // Cache manifest for 1 hour
    },
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
        {/* Защита от ботове - забранява индексиране */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta name="bingbot" content="noindex, nofollow" />
        <meta name="slurp" content="noindex, nofollow" />
        
        {/* PWA мета тегове */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Админ Панел" />
      </head>
      <body className={inter.className}>
        <UnderConstructionBanner />
        <div className="pt-16"></div>
        {children}
          <Script
            id="service-worker"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                // Only register service worker once to prevent multiple requests
                if ('serviceWorker' in navigator && !window.serviceWorkerRegistered) {
                  window.serviceWorkerRegistered = true
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
                } else if (!('serviceWorker' in navigator)) {
                  console.log('[SW] Not supported');
                }
              `,
            }}
          />
      </body>
    </html>
  )
} 