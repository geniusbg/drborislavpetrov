import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'app-settings.json')

type AppSettings = {
  site: {
    domain: string
  }
  defaultWorkingHours: {
    workingDays: number[] // 0=Sun..6=Sat
    startTime: string // HH:MM
    endTime: string // HH:MM
    breakStart?: string | null
    breakEnd?: string | null
  }
  sms?: {
    bulkgate?: {
      enabled: boolean
      applicationId: string
      applicationToken: string
      senderId: string
      senderType: 'number' | 'alphanumeric' | 'shortcode'
      testRecipient?: string
      t1Enabled?: boolean
      t1Hour?: number
      t0Enabled?: boolean
      templateT1?: string
      templateT0?: string
      channelPriority?: ('viber' | 'sms')[]
    }
  }
}

function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) as AppSettings
    }
  } catch (e) {
    console.error('Settings load error:', e)
  }
  // Defaults: Mon-Fri 09:00-18:00
  return {
    site: {
      domain: process.env.SITE_DOMAIN || 'http://localhost:3000'
    },
    defaultWorkingHours: {
      workingDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    },
    sms: {
      bulkgate: {
        enabled: false,
        applicationId: '',
        applicationToken: '',
        senderId: 'InfoSMS',
        senderType: 'alphanumeric',
        testRecipient: '',
        t1Enabled: true,
        t1Hour: 18,
        t0Enabled: false,
        templateT1: 'Напомняне: {date} в {time} – {service}. Д-р Петров. Ако не можете да дойдете, моля обадете се.',
        templateT0: 'Днес в {time}: {service}. Д-р Петров.',
        channelPriority: ['viber','sms']
      }
    }
  }
}

function saveSettings(settings: AppSettings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

function isAuthorized(request: NextRequest) {
  const token = request.headers.get('x-admin-token')
  return token === 'mock-token' || token === 'test'
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const settings = loadSettings()
  return NextResponse.json({ settings })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const current = loadSettings()
  const next: AppSettings = {
    site: {
      domain: typeof body?.site?.domain === 'string' && body.site.domain.trim() !== ''
        ? String(body.site.domain).trim()
        : current.site.domain
    },
    defaultWorkingHours: {
      workingDays: Array.isArray(body?.defaultWorkingHours?.workingDays)
        ? body.defaultWorkingHours.workingDays.map((n: unknown) => Number(n)).filter((n: number) => n >= 0 && n <= 6)
        : current.defaultWorkingHours.workingDays,
      startTime: body?.defaultWorkingHours?.startTime ?? current.defaultWorkingHours.startTime,
      endTime: body?.defaultWorkingHours?.endTime ?? current.defaultWorkingHours.endTime,
      breakStart: body?.defaultWorkingHours?.breakStart ?? current.defaultWorkingHours.breakStart ?? null,
      breakEnd: body?.defaultWorkingHours?.breakEnd ?? current.defaultWorkingHours.breakEnd ?? null,
    },
    sms: {
      bulkgate: {
        enabled: Boolean(body?.sms?.bulkgate?.enabled ?? current.sms?.bulkgate?.enabled ?? false),
        applicationId: String(body?.sms?.bulkgate?.applicationId ?? current.sms?.bulkgate?.applicationId ?? ''),
        applicationToken: String(body?.sms?.bulkgate?.applicationToken ?? current.sms?.bulkgate?.applicationToken ?? ''),
        senderId: String(body?.sms?.bulkgate?.senderId ?? current.sms?.bulkgate?.senderId ?? 'InfoSMS'),
        senderType: (['number','alphanumeric','shortcode'].includes(String(body?.sms?.bulkgate?.senderType))
          ? String(body.sms.bulkgate.senderType)
          : (current.sms?.bulkgate?.senderType ?? 'alphanumeric')) as 'number' | 'alphanumeric' | 'shortcode',
        testRecipient: String(body?.sms?.bulkgate?.testRecipient ?? current.sms?.bulkgate?.testRecipient ?? ''),
        t1Enabled: Boolean(body?.sms?.bulkgate?.t1Enabled ?? current.sms?.bulkgate?.t1Enabled ?? true),
        t1Hour: Number(body?.sms?.bulkgate?.t1Hour ?? current.sms?.bulkgate?.t1Hour ?? 18),
        t0Enabled: Boolean(body?.sms?.bulkgate?.t0Enabled ?? current.sms?.bulkgate?.t0Enabled ?? false),
        templateT1: String(body?.sms?.bulkgate?.templateT1 ?? current.sms?.bulkgate?.templateT1 ?? 'Напомняне: {date} в {time} – {service}. Д-р Петров. Ако не можете да дойдете, моля обадете се.'),
        templateT0: String(body?.sms?.bulkgate?.templateT0 ?? current.sms?.bulkgate?.templateT0 ?? 'Днес в {time}: {service}. Д-р Петров.'),
        channelPriority: Array.isArray(body?.sms?.bulkgate?.channelPriority)
          ? (body.sms.bulkgate.channelPriority.filter((c: unknown)=> c==='viber' || c==='sms'))
          : (current.sms?.bulkgate?.channelPriority ?? ['viber','sms'])
      }
    }
  }
  saveSettings(next)
  return NextResponse.json({ success: true, settings: next })
}


