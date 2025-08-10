import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'app-settings.json')

type AppSettings = {
  defaultWorkingHours: {
    workingDays: number[] // 0=Sun..6=Sat
    startTime: string // HH:MM
    endTime: string // HH:MM
    breakStart?: string | null
    breakEnd?: string | null
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
    defaultWorkingHours: {
      workingDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    },
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
    defaultWorkingHours: {
      workingDays: Array.isArray(body?.defaultWorkingHours?.workingDays)
        ? body.defaultWorkingHours.workingDays.map((n: unknown) => Number(n)).filter((n: number) => n >= 0 && n <= 6)
        : current.defaultWorkingHours.workingDays,
      startTime: body?.defaultWorkingHours?.startTime ?? current.defaultWorkingHours.startTime,
      endTime: body?.defaultWorkingHours?.endTime ?? current.defaultWorkingHours.endTime,
      breakStart: body?.defaultWorkingHours?.breakStart ?? current.defaultWorkingHours.breakStart ?? null,
      breakEnd: body?.defaultWorkingHours?.breakEnd ?? current.defaultWorkingHours.breakEnd ?? null,
    },
  }
  saveSettings(next)
  return NextResponse.json({ success: true, settings: next })
}


