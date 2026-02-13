'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Case as CaseType, CaseGalleryItem } from '@/types/global'

export type GalleryFormItem = { path: string | null; caption: string; file?: File }

interface CaseFormProps {
  caseItem: CaseType | null
  onSubmit: (data: Omit<Partial<CaseType>, 'gallery'> & { main_image_file?: File; gallery?: GalleryFormItem[] }) => void
  onCancel: () => void
}

export default function CaseForm({ caseItem, onSubmit, onCancel }: CaseFormProps) {
  const [title, setTitle] = useState(caseItem?.title ?? '')
  const [short_description, setShort_description] = useState(caseItem?.short_description ?? '')
  const [body, setBody] = useState(caseItem?.body ?? '')
  const [order_index, setOrder_index] = useState(caseItem?.order_index ?? 0)
  const [show_on_homepage, setShow_on_homepage] = useState(caseItem?.show_on_homepage ?? false)
  const [homepage_order, setHomepage_order] = useState(caseItem?.homepage_order ?? 0)
  const [main_image_file, setMain_image_file] = useState<File | null>(null)
  const [galleryItems, setGalleryItems] = useState<GalleryFormItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (caseItem) {
      setTitle(caseItem.title)
      setShort_description(caseItem.short_description)
      setBody(caseItem.body ?? '')
      setOrder_index(caseItem.order_index ?? 0)
      setShow_on_homepage(caseItem.show_on_homepage ?? false)
      setHomepage_order(caseItem.homepage_order ?? 0)
      const list = (caseItem.gallery ?? []) as CaseGalleryItem[]
      setGalleryItems(list.map((g) => ({ path: g.path, caption: g.caption ?? '', file: undefined })))
    } else {
      setTitle('')
      setShort_description('')
      setBody('')
      setOrder_index(0)
      setShow_on_homepage(false)
      setHomepage_order(0)
      setGalleryItems([])
    }
    setMain_image_file(null)
  }, [caseItem])

  const addGalleryItem = useCallback(() => {
    setGalleryItems((prev) => [...prev, { path: null, caption: '', file: undefined }])
  }, [])
  const removeGalleryItem = useCallback((index: number) => {
    setGalleryItems((prev) => prev.filter((_, i) => i !== index))
  }, [])
  const updateGalleryCaption = useCallback((index: number, caption: string) => {
    setGalleryItems((prev) => prev.map((item, i) => (i === index ? { ...item, caption } : item)))
  }, [])
  const updateGalleryFile = useCallback((index: number, file: File | undefined) => {
    setGalleryItems((prev) => prev.map((item, i) => (i === index ? { ...item, file, path: file ? null : item.path } : item)))
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!title.trim()) {
      setErrors({ title: 'Заглавието е задължително' })
      return
    }
    if (!short_description.trim()) {
      setErrors({ short_description: 'Краткото описание е задължително' })
      return
    }
    setIsSubmitting(true)
    try {
      const galleryForSubmit = galleryItems
        .filter((item) => item.path || item.file)
        .map((item) => ({ path: item.path ?? null, caption: item.caption.trim(), file: item.file }))
      await onSubmit({
        id: caseItem?.id,
        title: title.trim(),
        short_description: short_description.trim(),
        body: body.trim() || null,
        order_index,
        show_on_homepage,
        homepage_order,
        main_image_path: caseItem?.main_image_path ?? undefined,
        main_image_file: main_image_file ?? undefined,
        gallery: galleryForSubmit.length ? galleryForSubmit : undefined,
      })
    } catch {
      setErrors({ submit: 'Грешка при запазване' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Заглавие *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`mt-1 block w-full border rounded-md px-3 py-2 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Кратко описание (1 изречение) *</label>
        <input
          type="text"
          value={short_description}
          onChange={(e) => setShort_description(e.target.value)}
          className={`mt-1 block w-full border rounded-md px-3 py-2 ${errors.short_description ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Показва се на картичката"
        />
        {errors.short_description && <p className="mt-1 text-sm text-red-600">{errors.short_description}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Пълно описание (за „Виж още“)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          rows={4}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Основна снимка</label>
        {(caseItem?.main_image_path || main_image_file) && (
          <div className="mb-2">
            {main_image_file ? (
              <img src={URL.createObjectURL(main_image_file)} alt="" className="max-h-40 w-auto object-contain rounded border border-gray-200" />
            ) : caseItem?.main_image_path ? (
              <img src={caseItem.main_image_path} alt="" className="max-h-40 w-auto object-contain rounded border border-gray-200" />
            ) : null}
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setMain_image_file(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">Допълнителни снимки с описание</label>
          <button
            type="button"
            onClick={addGalleryItem}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Добави снимка
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">Под всяка снимка може да добавите текст – какво е на снимката или какво е направено.</p>
        <div className="space-y-4">
          {galleryItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600">Снимка {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeGalleryItem(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  aria-label="Премахни"
                >
                  Премахни
                </button>
              </div>
              <div className="mb-2">
                {(item.path || item.file) ? (
                  <div className="relative">
                    {item.file ? (
                      <img src={URL.createObjectURL(item.file)} alt="" className="max-h-32 w-auto object-contain rounded border border-gray-200" />
                    ) : item.path ? (
                      <img src={item.path} alt="" className="max-h-32 w-auto object-contain rounded border border-gray-200" />
                    ) : null}
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => updateGalleryFile(index, e.target.files?.[0])}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                />
              </div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Описание под снимката</label>
              <textarea
                value={item.caption}
                onChange={(e) => updateGalleryCaption(index, e.target.value)}
                placeholder="Какво има на снимката или какво е направено по случая"
                className="block w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={show_on_homepage}
            onChange={(e) => setShow_on_homepage(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Показвай на главната страница</span>
        </label>
      </div>
      {show_on_homepage && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Ред на главната (по-малко = по-горе)</label>
          <input
            type="number"
            min={0}
            value={homepage_order}
            onChange={(e) => setHomepage_order(parseInt(e.target.value, 10) || 0)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 max-w-[120px]"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Ред в списъка</label>
        <input
          type="number"
          min={0}
          value={order_index}
          onChange={(e) => setOrder_index(parseInt(e.target.value, 10) || 0)}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 max-w-[120px]"
        />
      </div>
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Отказ
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Запазване...' : caseItem ? 'Запази' : 'Добави'}
        </button>
      </div>
    </form>
  )
}
