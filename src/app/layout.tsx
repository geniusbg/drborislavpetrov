import type { Metadata, Viewport } from 'next'
import { getSiteDomain } from '@/lib/site'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import ClientProviders from '@/components/ClientProviders'

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
        {/* CSP: frame-src разрешава Google iframe (карти, форми); идва от app, не от прокси */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="frame-src 'self' https://www.google.com https://maps.google.com https://docs.google.com;"
        />
        {/* Защита от ботове - забранява индексиране */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />
        <meta name="bingbot" content="noindex, nofollow" />
        <meta name="slurp" content="noindex, nofollow" />
        
        {/* 🚨 ЗАДЪЛЖИТЕЛНО: PWA мета тегове за ГЛАВНАТА СТРАНИЦА - НЕ ПРОМЕНЯЙТЕ БЕЗ РАЗРЕШЕНИЕ! */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Д-р Петров" />
        <meta name="application-name" content="Д-р Петров" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* PWA Install Hints */}
        <meta name="mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
          <Script
            id="service-worker"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                // Only register service worker once to prevent multiple requests
                if ('serviceWorker' in navigator && !window.serviceWorkerRegistered) {
                  window.serviceWorkerRegistered = true
                  
                  // Запазваме текущия URL за offline функционалност
                  if (typeof window !== 'undefined' && window.location.pathname !== '/offline.html') {
                    try {
                      sessionStorage.setItem('offline-original-url', window.location.pathname);
                    } catch (e) {
                      // Ignore storage errors
                    }
                  }
                  
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                      .then(function(registration) {
                        // Service Worker registered successfully
                        
                        // Check for updates immediately
                        registration.update();
                        
                        // Check for updates every hour
                        setInterval(function() {
                          registration.update();
                        }, 60 * 60 * 1000);
                        
                        // Handle service worker update found
                        registration.addEventListener('updatefound', function() {
                          const newWorker = registration.installing;
                          if (newWorker) {
                            newWorker.addEventListener('statechange', function() {
                              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker is installed and waiting
                                // Notify user about update
                                if (typeof window !== 'undefined' && window.confirm) {
                                  const shouldUpdate = confirm('Налично е ново обновяване на приложението. Искате ли да обновите сега?');
                                  if (shouldUpdate) {
                                    // Send message to new worker to skip waiting
                                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    // Reload page after update
                                    window.location.reload();
                                  }
                                }
                              }
                            });
                          }
                        });
                        
                        // Handle controller change (new service worker activated)
                        navigator.serviceWorker.addEventListener('controllerchange', function() {
                          // Service worker has been updated, reload page
                          window.location.reload();
                        });
                      })
                      .catch(function(error) {
                        // Service Worker registration failed
                        console.error('Service Worker registration failed:', error);
                      });
                  });
                  
                  navigator.serviceWorker.addEventListener('message', function(event) {
                    // Handle Service Worker messages
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