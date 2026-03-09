'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type CaseItem = {
  id: number
  title: string
  short_description: string
  main_image_path: string | null
  body: string | null
  gallery?: Array<{ path: string; caption: string }>
  order_index?: number
  homepage_order?: number
  created_at?: string
}

export default function CasesSection() {
  const [sectionTitle, setSectionTitle] = useState('Клинични случаи')
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

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
  const selectedCase = selectedId ? cases.find((c) => c.id === selectedId) : null
  const visibleCases = showAll ? cases : cases.slice(0, 6)

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
          {visibleCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className="group text-left bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-secondary-100 hover:border-primary-200 hover:-translate-y-1"
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
            </button>
          ))}
        </div>
        <div className="text-center mt-12">
          {cases.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
            >
              {showAll ? 'Покажи по-малко' : 'Виж всички случаи'}
            </button>
          )}
        </div>
      </div>

      {/* Case detail modal */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-modal-title"
        >
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={() => setSelectedId(null)}
          />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg min-w-0 max-h-[90vh] overflow-y-auto overflow-x-hidden border border-secondary-100 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-white border-b border-primary-100 px-5 py-4 flex items-center justify-between z-10">
              <h3 id="case-modal-title" className="text-lg font-semibold text-secondary-900 truncate pr-2">
                {selectedCase.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex-shrink-0 p-2 rounded-xl text-secondary-500 hover:bg-primary-100 hover:text-primary-700 transition-colors"
                aria-label="Затвори"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {selectedCase.main_image_path && (
                <div className="rounded-xl bg-secondary-50 flex items-center justify-center min-h-[120px] mb-5 overflow-hidden">
                  <img
                    src={selectedCase.main_image_path}
                    alt=""
                    className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                  />
                </div>
              )}
              {selectedCase.body ? (
                <div className="text-secondary-700 whitespace-pre-wrap mb-5 leading-relaxed">
                  {selectedCase.body}
                </div>
              ) : (
                <p className="text-secondary-600 mb-5">{selectedCase.short_description}</p>
              )}
              {selectedCase.gallery && selectedCase.gallery.length > 0 && (
                <div className="space-y-6 pt-5 border-t border-secondary-200">
                  {selectedCase.gallery.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="rounded-xl bg-secondary-50 flex items-center justify-center min-h-[80px] overflow-hidden">
                        <img
                          src={item.path}
                          alt=""
                          className="max-w-full max-h-[60vh] w-auto h-auto object-contain"
                        />
                      </div>
                      {item.caption ? (
                        <p className="text-sm text-secondary-600 whitespace-pre-wrap pl-1 border-l-2 border-primary-200">
                          {item.caption}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
