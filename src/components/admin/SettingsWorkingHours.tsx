'use client'

import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'

type WorkingDefaults = {
  workingDays: number[]
  startTime: string
  endTime: string
  breakStart?: string | null
  breakEnd?: string | null
}
type SiteSettings = { domain: string }

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
  const [site, setSite] = useState<SiteSettings>({ domain: 'http://localhost:3000' })
  const [msg, setMsg] = useState<string | null>(null)
  const [testSending, setTestSending] = useState(false)
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const [sms, setSms] = useState({
    enabled: false,
    applicationId: '',
    applicationToken: '',
    senderId: 'InfoSMS',
    senderType: 'alphanumeric' as 'number' | 'alphanumeric' | 'shortcode',
    testRecipient: '',
    t1Enabled: true,
    t1Hour: 18,
    t0Enabled: false,
    templateT1: 'Напомняне: {date} в {time} – {service}. Д-р Петров. Ако не можете да дойдете, моля обадете се.',
    templateT0: 'Днес в {time}: {service}. Д-р Петров.',
    channelPriority: ['viber','sms'] as ('viber'|'sms')[]
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const adminToken = localStorage.getItem('adminToken')
        const res = await fetch('/api/admin/settings', { headers: { 'x-admin-token': adminToken || 'mock-token' } })
        if (res.ok) {
          const data = await res.json()
          setDefaults(data.settings?.defaultWorkingHours)
          if (data.settings?.site?.domain) setSite({ domain: data.settings.site.domain })
          const bg = data.settings?.sms?.bulkgate
          if (bg) {
            setSms({
              enabled: !!bg.enabled,
              applicationId: bg.applicationId || '',
              applicationToken: bg.applicationToken || '',
              senderId: bg.senderId || 'InfoSMS',
              senderType: (bg.senderType || 'alphanumeric') as 'number' | 'alphanumeric' | 'shortcode',
              testRecipient: bg.testRecipient || '',
              t1Enabled: bg.t1Enabled ?? true,
              t1Hour: Number(bg.t1Hour ?? 18),
              t0Enabled: bg.t0Enabled ?? false,
              templateT1: bg.templateT1 || 'Напомняне: {date} в {time} – {service}. Д-р Петров. Ако не можете да дойдете, моля обадете се.',
              templateT0: bg.templateT0 || 'Днес в {time}: {service}. Д-р Петров.',
              channelPriority: (Array.isArray(bg.channelPriority) && bg.channelPriority.length>0 ? bg.channelPriority : ['viber','sms']) as ('viber'|'sms')[]
            })
          }
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
        body: JSON.stringify({ site, defaultWorkingHours: defaults, sms: { bulkgate: sms } })
      })
      if (res.ok) setMsg('Запазено успешно')
      else setMsg('Грешка при запазване')
      setTimeout(()=>setMsg(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const sendTestSms = async () => {
    setTestMsg(null)
    if (!sms.testRecipient) {
      setTestMsg('Моля, въведете тестов номер в E.164 формат.')
      return
    }
    try {
      setTestSending(true)
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken || 'mock-token' },
        body: JSON.stringify({ phone: sms.testRecipient, text: 'Тест: {date} {time} – {service}.', channel: 'auto' })
      })
      if (res.ok) {
        setTestMsg('Изпратено успешно')
      } else {
        const data = await res.json().catch(()=>({}))
        setTestMsg(`Грешка: ${data?.error || res.status}`)
      }
    } catch (e) {
      setTestMsg('Грешка при изпращане')
    } finally {
      setTestSending(false)
      setTimeout(()=>setTestMsg(null), 4000)
    }
  }

  const dayLabels = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб']

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Default Работно време</h3>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Domain на сайта</label>
        <input type="text" value={site.domain} onChange={(e)=>setSite({ domain: e.target.value })} className="w-full border rounded px-2 py-1" placeholder="https://example.com" />
      </div>
      <div className="border-t pt-4 mt-4">
        <h4 className="text-md font-semibold mb-2">SMS (BulkGate)</h4>
        <div className="flex items-center gap-2 mb-3">
          <input id="sms-enabled" type="checkbox" checked={sms.enabled} onChange={(e)=>setSms(prev=>({...prev, enabled: e.target.checked}))} />
          <label htmlFor="sms-enabled" className="text-sm">Включено</label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application ID</label>
            <input type="text" value={sms.applicationId} onChange={(e)=>setSms(prev=>({...prev, applicationId: e.target.value}))} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Token</label>
            <input type="password" value={sms.applicationToken} onChange={(e)=>setSms(prev=>({...prev, applicationToken: e.target.value}))} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
            <input type="text" value={sms.senderId} onChange={(e)=>setSms(prev=>({...prev, senderId: e.target.value}))} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender Type</label>
            <select value={sms.senderType} onChange={(e)=>setSms(prev=>({...prev, senderType: e.target.value as 'number' | 'alphanumeric' | 'shortcode'}))} className="w-full border rounded px-2 py-1">
              <option value="alphanumeric">alphanumeric</option>
              <option value="number">number</option>
              <option value="shortcode">shortcode</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тестов номер (E.164)</label>
            <input type="text" value={sms.testRecipient} onChange={(e)=>setSms(prev=>({...prev, testRecipient: e.target.value}))} className="w-full border rounded px-2 py-1" placeholder="+35988..." />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div className="flex items-center gap-2">
            <input id="t1" type="checkbox" checked={sms.t1Enabled} onChange={(e)=>setSms(prev=>({...prev, t1Enabled: e.target.checked}))} />
            <label htmlFor="t1" className="text-sm">T‑1 напомняне</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Час за T‑1 (0‑23)</label>
            <input type="number" min={0} max={23} value={sms.t1Hour} onChange={(e)=>setSms(prev=>({...prev, t1Hour: Number(e.target.value)}))} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="flex items-center gap-2">
            <input id="t0" type="checkbox" checked={sms.t0Enabled} onChange={(e)=>setSms(prev=>({...prev, t0Enabled: e.target.checked}))} />
            <label htmlFor="t0" className="text-sm">T‑0 напомняне</label>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Шаблон T‑1</label>
          <textarea value={sms.templateT1} onChange={(e)=>setSms(prev=>({...prev, templateT1: e.target.value}))} className="w-full border rounded px-2 py-1" rows={2} />
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Шаблон T‑0</label>
          <textarea value={sms.templateT0} onChange={(e)=>setSms(prev=>({...prev, templateT0: e.target.value}))} className="w-full border rounded px-2 py-1" rows={2} />
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div className="flex items-center gap-3">
            <button onClick={sendTestSms} disabled={testSending || !sms.enabled} className={`px-3 py-2 rounded text-white ${sms.enabled? 'bg-emerald-600 hover:bg-emerald-700':'bg-gray-400 cursor-not-allowed'}`}>{testSending? 'Изпращане...' : 'Изпрати тест (auto)'}</button>
            {testMsg && <span className="text-sm text-gray-700">{testMsg}</span>}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Приоритет канали</label>
            <select value={sms.channelPriority[0]} onChange={(e)=>{
              const first = e.target.value as 'viber'|'sms'
              const second = first === 'viber' ? 'sms' : 'viber'
              setSms(prev=>({ ...prev, channelPriority: [first, second] }))
            }} className="w-full border rounded px-2 py-1">
              <option value="viber">viber → sms</option>
              <option value="sms">sms → viber</option>
            </select>
          </div>
        </div>
      </div>
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


