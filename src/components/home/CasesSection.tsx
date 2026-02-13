'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type CaseItem = {
  id: number
  title: string
  short_description: string
  main_image_path: string | null
  body: string | null
  order_index?: number
  homepage_order?: number
}

export default function CasesSection() {
  const [sectionTitle, setSectionTitle] = useState('Клинични случаи')
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/cases?homepage=1')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setSectionTitle(data?.sectionTitle ?? 'Клинични случаи')
        setCases(Array.isArray(data?.cases) ? data.cases : [])
      })
      .catch(() => {
        if (!cancelled) setCases([])
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  if (!loaded || cases.length === 0) return null

  return (
    <section id="cases" className="section-padding bg-gradient-to-b from-white to-secondary-50/50 overflow-x-hidden">
      <div className="container-custom max-w-full min-w-0">
        <div className="text-center mb-12">
          <span className="inline-block text-primary-600 font-medium text-sm uppercase tracking-wider mb-2">
            Галерия
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-3">
            {sectionTitle}
          </h2>
          <div className="w-16 h-1 bg-primary-500 rounded-full mx-auto" aria-hidden />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-w-0">
          {cases.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/cases?id=${c.id}`}
              className="group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-secondary-100 hover:border-primary-200 hover:-translate-y-1"
            >
              <div className="aspect-[4/3] bg-secondary-50 relative overflow-hidden flex items-center justify-center">
                {c.main_image_path ? (
                  <img
                    src={c.main_image_path}
                    alt=""
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-300">
                    <span className="text-5xl">📷</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg text-secondary-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                  {c.title}
                </h3>
                <p className="text-sm text-secondary-600 line-clamp-2 mb-4">
                  {c.short_description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 group-hover:gap-2.5 transition-all">
                  Виж още
                  <span className="inline-block">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/cases"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
          >
            Виж всички случаи
          </Link>
        </div>
      </div>
    </section>
  )
}
