import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Д-р Борислав Петров - Зъболекар в София',
  description: 'Професионална зъболекарска грижа в София. Д-р Борислав Петров предлага модерни стоматологични услуги, профилактика, лечение на кариес и естетична стоматология.',
  keywords: 'зъболекар, стоматология, София, д-р Борислав Петров, лечение на кариес, профилактика, естетична стоматология',
  authors: [{ name: 'Д-р Борислав Петров' }],
  creator: 'Д-р Борислав Петров',
  publisher: 'Д-р Борислав Петров',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://drborislavpetrov.bg'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Д-р Борислав Петров - Зъболекар в София',
    description: 'Професионална зъболекарска грижа в София. Модерни стоматологични услуги и индивидуален подход.',
    url: 'https://drborislavpetrov.bg',
    siteName: 'Д-р Борислав Петров',
    locale: 'bg_BG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Д-р Борислав Петров - Зъболекар в София',
    description: 'Професионална зъболекарска грижа в София',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0284c7" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
} 