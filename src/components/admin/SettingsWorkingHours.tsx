'use client'

import { useEffect, useState } from 'react'

type WorkingDefaults = {
  workingDays: number[]
  startTime: string
  endTime: string
  breakStart?: string | null
  breakEnd?: string | null
}

export default function SettingsWorkingHours() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [defaults, setDefaults] = useState<WorkingDefaults>({
    workingDays: [1,2,3,4,5],
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
  })
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const adminToken = localStorage.getItem('adminToken')
        const res = await fetch('/api/admin/settings', { headers: { 'x-admin-token': adminToken || 'mock-token' } })
        if (res.ok) {
          const data = await res.json()
          setDefaults(data.settings?.defaultWorkingHours)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleDay = (d: number) => {
    setDefaults(prev => {
      const has = prev.workingDays.includes(d)
      const workingDays = has ? prev.workingDays.filter(x => x !== d) : [...prev.workingDays, d]
      return { ...prev, workingDays: workingDays.sort((a,b)=>a-b) }
    })
  }

  const save = async () => {
    try {
      setSaving(true)
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || 'mock-token' },
        body: JSON.stringify({ defaultWorkingHours: defaults })
      })
      if (res.ok) setMsg('Запазено успешно')
      else setMsg('Грешка при запазване')
      setTimeout(()=>setMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const dayLabels = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб']

  return (
    <div className="bg-white rounded-lg p-4 border">
      <h3 className="text-lg font-semibold mb-3">Default Работно време</h3>
      {loading ? (
        <div>Зареждане...</div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Работни дни</label>
            <div className="flex flex-wrap gap-2">
              {dayLabels.map((lbl, idx)=>{
                const d = idx
                const active = defaults.workingDays.includes(d)
                return (
                  <button key={d} onClick={() => toggleDay(d)} className={`px-2 py-1 rounded border text-sm ${active? 'bg-green-100 border-green-300 text-green-800':'bg-gray-100 border-gray-300 text-gray-700'}`}>
                    {lbl}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Начало</label>
              <input type="time" value={defaults.startTime} onChange={(e)=>setDefaults(prev=>({...prev, startTime: e.target.value}))} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Край</label>
              <input type="time" value={defaults.endTime} onChange={(e)=>setDefaults(prev=>({...prev, endTime: e.target.value}))} className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Почивка от</label>
              <input type="time" value={defaults.breakStart || ''} onChange={(e)=>setDefaults(prev=>({...prev, breakStart: e.target.value||null}))} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Почивка до</label>
              <input type="time" value={defaults.breakEnd || ''} onChange={(e)=>setDefaults(prev=>({...prev, breakEnd: e.target.value||null}))} className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          {msg && <div className="text-sm text-green-700">{msg}</div>}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{saving? 'Запазване...' : 'Запази'}</button>
          </div>
        </div>
      )}
    </div>
  )
}


