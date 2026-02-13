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
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container-custom section-padding pt-24">
        <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
            {sectionTitle}
          </h1>
        </div>
        {!loaded ? (
          <p className="text-center text-gray-500">Зареждане...</p>
        ) : cases.length === 0 ? (
          <p className="text-center text-gray-500">Няма публикувани случаи.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openModal(c.id)}
                className="text-left bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
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
                  <h2 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                    {c.title}
                  </h2>
                  <p className="text-sm text-secondary-600 line-clamp-2">
                    {c.short_description}
                  </p>
                  <span className="inline-block mt-2 text-sm font-medium text-primary-600">
                    Виж още →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-primary-600 hover:underline font-medium"
          >
            ← Начало
          </Link>
        </div>
      </div>
      <Footer />

      {/* Case detail modal */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
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
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <h2 id="case-modal-title" className="text-lg font-semibold text-gray-900 truncate pr-2">
                {selectedCase.title}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="flex-shrink-0 p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Затвори"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedCase.main_image_path && (
                <div className="rounded-lg flex items-center justify-center min-h-[120px] mb-4 overflow-hidden">
                  <img
                    src={selectedCase.main_image_path}
                    alt=""
                    className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                  />
                </div>
              )}
              {selectedCase.body ? (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-4">
                  {selectedCase.body}
                </div>
              ) : (
                <p className="text-secondary-600 mb-4">{selectedCase.short_description}</p>
              )}
              {selectedCase.gallery && selectedCase.gallery.length > 0 && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  {selectedCase.gallery.map((item, idx) => (
                    <div key={idx}>
                      <div className="rounded-lg flex items-center justify-center min-h-[80px] overflow-hidden mb-2">
                        <img
                          src={item.path}
                          alt=""
                          className="max-w-full max-h-[60vh] w-auto h-auto object-contain"
                        />
                      </div>
                      {item.caption ? (
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.caption}</p>
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
        <div className="container-custom section-padding pt-24 flex justify-center items-center min-h-[40vh]">
          <p className="text-gray-500">Зареждане...</p>
        </div>
        <Footer />
      </main>
    }>
      <CasesPageContent />
    </Suspense>
  )
}
