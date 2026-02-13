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
    <section id="cases" className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
            {sectionTitle}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/cases?id=${c.id}`}
              className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="aspect-[4/3] bg-white relative overflow-hidden flex items-center justify-center">
                {c.main_image_path ? (
                  <img
                    src={c.main_image_path}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-4xl">📷</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                  {c.title}
                </h3>
                <p className="text-sm text-secondary-600 line-clamp-2">
                  {c.short_description}
                </p>
                <span className="inline-block mt-2 text-sm font-medium text-primary-600">
                  Виж още →
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/cases"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            Виж всички
          </Link>
        </div>
      </div>
    </section>
  )
}
