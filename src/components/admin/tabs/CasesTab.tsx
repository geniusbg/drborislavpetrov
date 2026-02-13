'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import type { Case as CaseType } from '@/types/global'

interface CasesTabProps {
  cases: CaseType[]
  onAddCase: () => void
  onEditCase: (caseItem: CaseType) => void
  onDeleteCase: (id: number) => void
}

export default function CasesTab({ cases, onAddCase, onEditCase, onDeleteCase }: CasesTabProps) {
  const [sectionTitle, setSectionTitle] = useState('Клинични случаи')
  const [sectionTitleDirty, setSectionTitleDirty] = useState(false)
  const [savingTitle, setSavingTitle] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.settings?.casesSectionTitle) {
          setSectionTitle(data.settings.casesSectionTitle)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const saveSectionTitle = async () => {
    if (!sectionTitleDirty) return
    setSavingTitle(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casesSectionTitle: sectionTitle.trim() || 'Клинични случаи' }),
      })
      if (res.ok) {
        setSectionTitleDirty(false)
      }
    } finally {
      setSavingTitle(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-4 lg:px-6 py-4 border-b border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Клинични случаи</h2>
          <button
            onClick={onAddCase}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добави случай
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Име на секцията (главна страница):</label>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => {
                setSectionTitle(e.target.value)
                setSectionTitleDirty(true)
              }}
              className="flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Клинични случаи"
            />
            <button
              type="button"
              onClick={saveSectionTitle}
              disabled={!sectionTitleDirty || savingTitle}
              className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              {savingTitle ? 'Запазване...' : 'Запази'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {cases.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Няма добавени случаи. Натиснете „Добави случай“.</p>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                  {c.main_image_path ? (
                    <img
                      src={c.main_image_path}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{c.short_description}</p>
                  <div className="flex gap-2 mt-1">
                    {c.show_on_homepage && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        На главната (ред {c.homepage_order})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditCase(c)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Редактирай"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCase(c.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Изтрий"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
