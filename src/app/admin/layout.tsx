import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Админ Панел - Д-р Борислав Петров',
  description: 'Административен панел за управление на резервации',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Note: html/head/body са дефинирани само в кореновия layout (src/app/layout.tsx)
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="p-6 text-gray-600">Зареждане…</div>}>
        {children}
      </Suspense>
    </div>
  )
}