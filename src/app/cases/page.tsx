'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { X } from 'lucide-react'

type CaseGalleryItem = { path: string; caption: string }

type CaseItem = {
  id: number
  title: string
  short_description: string
  main_image_path: string | null
  body: string | null
  gallery?: CaseGalleryItem[]
  order_index?: number
}

function CasesPageContent() {
  const searchParams = useSearchParams()
  const [sectionTitle, setSectionTitle] = useState('Клинични случаи')
  const [cases, setCases] = useState<CaseItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)

  const openModal = useCallback((id: number) => {
    setSelectedId(id)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedId(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/cases')
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

  useEffect(() => {
    const idParam = searchParams?.get('id')
    if (idParam && loaded) {
      const id = parseInt(idParam, 10)
      if (!Number.isNaN(id) && cases.some((c) => c.id === id)) {
        setSelectedId(id)
      }
    }
  }, [searchParams, loaded, cases])

  const selectedCase = selectedId ? cases.find((c) => c.id === selectedId) : null

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-secondary-50/50 overflow-x-hidden">
      <Header />
      <div className="container-custom pt-28 pb-12 sm:pb-16 lg:pb-20 max-w-full min-w-0">
        <div className="text-center mb-12">
          <span className="inline-block text-primary-600 font-medium text-sm uppercase tracking-wider mb-2">
            Галерия
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-3">
            {sectionTitle}
          </h1>
          <div className="w-16 h-1 bg-primary-500 rounded-full mx-auto mb-2" aria-hidden />
          <p className="text-secondary-600 max-w-xl mx-auto">
            Преглед на избрани клинични случаи и процедури
          </p>
        </div>
        {!loaded ? (
          <p className="text-center text-secondary-500 py-12">Зареждане...</p>
        ) : cases.length === 0 ? (
          <p className="text-center text-secondary-500 py-12">Няма публикувани случаи.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-w-0">
            {cases.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openModal(c.id)}
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
                  <h2 className="font-semibold text-lg text-secondary-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                    {c.title}
                  </h2>
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
        )}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <span className="inline-block">←</span>
            Начало
          </Link>
        </div>
      </div>
      <Footer />

      {/* Case detail modal */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-modal-title"
        >
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onClick={closeModal}
          />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-secondary-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-white border-b border-primary-100 px-5 py-4 flex items-center justify-between z-10">
              <h2 id="case-modal-title" className="text-lg font-semibold text-secondary-900 truncate pr-2">
                {selectedCase.title}
              </h2>
              <button
                type="button"
                onClick={closeModal}
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
    </main>
  )
}

export default function CasesPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container-custom pt-28 pb-12 sm:pb-16 lg:pb-20 flex justify-center items-center min-h-[40vh]">
          <p className="text-gray-500">Зареждане...</p>
        </div>
        <Footer />
      </main>
    }>
      <CasesPageContent />
    </Suspense>
  )
}
