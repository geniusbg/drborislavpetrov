import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Админ Панел - Д-р Борислав Петров',
  description: 'Административен панел за управление на резервации',
  manifest: '/admin-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Админ Панел',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Админ Панел',
    'application-name': 'Админ Панел',
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Note: html/head/body са дефинирани само в кореновия layout (src/app/layout.tsx)
  return (
    <>
      {/* 🚨 ЗАДЪЛЖИТЕЛНО: PWA мета тагове за АДМИН СЕКЦИЯТА - НЕ ПРОМЕНЯЙТЕ БЕЗ РАЗРЕШЕНИЕ! */}
      <head>
        <link rel="apple-touch-icon" href="/admin-icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/admin-icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/admin-icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/admin-icon-192.png" />
        <meta name="apple-mobile-web-app-title" content="Админ Панел" />
        <meta name="application-name" content="Админ Панел" />
      </head>
      <div className="min-h-screen">
        <Suspense fallback={<div className="p-6 text-gray-600">Зареждане…</div>}>
          {children}
        </Suspense>
      </div>
    </>
  )
}