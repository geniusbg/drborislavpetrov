import fs from 'fs'
import path from 'path'

type SenderType = 'number' | 'alphanumeric' | 'shortcode'

type BulkGateSettings = {
  enabled: boolean
  applicationId: string
  applicationToken: string
  senderId: string
  senderType: SenderType
  channelPriority?: ('viber' | 'sms')[]
}

type AppSettings = {
  sms?: {
    bulkgate?: BulkGateSettings & {
      testRecipient?: string
      t1Enabled?: boolean
      t1Hour?: number
      t0Enabled?: boolean
      templateT1?: string
      templateT0?: string
    }
  }
}

function loadSettings(): AppSettings {
  try {
    const SETTINGS_FILE = path.join(process.cwd(), 'app-settings.json')
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) as AppSettings
    }
  } catch {
    // ignore
  }
  return {}
}

export function getBulkGateConfig(): BulkGateSettings | null {
  const settings = loadSettings()
  const cfg = settings.sms?.bulkgate
  if (!cfg) return null
  if (!cfg.enabled) return null
  if (!cfg.applicationId || !cfg.applicationToken) return null
  return {
    enabled: true,
    applicationId: cfg.applicationId,
    applicationToken: cfg.applicationToken,
    senderId: cfg.senderId || 'InfoSMS',
    senderType: (cfg.senderType || 'alphanumeric') as SenderType,
    channelPriority: (cfg.channelPriority && cfg.channelPriority.length > 0)
      ? (cfg.channelPriority as ('viber'|'sms')[])
      : ['viber','sms']
  }
}

async function callBulkgateTransactional(payload: Record<string, unknown>) {
  const endpoint = 'https://portal.bulkgate.com/api/1.0/simple/transactional'
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

export async function sendSmsViaBulkGate(phoneE164: string, text: string) {
  const cfg = getBulkGateConfig()
  if (!cfg) {
    return { ok: false, error: 'BulkGate не е конфигуриран или е изключен' }
  }

  const body = {
    application_id: cfg.applicationId,
    application_token: cfg.applicationToken,
    number: phoneE164,
    text,
    sender_id: cfg.senderId,
    sender_type: cfg.senderType,
  }

  try {
    const { res, data } = await callBulkgateTransactional(body)
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, data }
    return { ok: true, data: data }
  } catch (error) {
    const err = error as Partial<{ message: string }>
    return { ok: false, error: err.message || 'Грешка при изпращане на SMS' }
  }
}

export async function sendViberViaBulkGate(phoneE164: string, text: string) {
  const cfg = getBulkGateConfig()
  if (!cfg) {
    return { ok: false, error: 'BulkGate не е конфигуриран или е изключен' }
  }
  const body = {
    application_id: cfg.applicationId,
    application_token: cfg.applicationToken,
    number: phoneE164,
    text,
    sender_id: cfg.senderId,
    sender_type: cfg.senderType,
    channel: 'viber'
  }
  try {
    const { res, data } = await callBulkgateTransactional(body)
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, data }
    return { ok: true, data }
  } catch (error) {
    const err = error as Partial<{ message: string }>
    return { ok: false, error: err.message || 'Грешка при изпращане на Viber' }
  }
}

export async function sendWithChannelPriority(phoneE164: string, text: string) {
  const cfg = getBulkGateConfig()
  if (!cfg) return { ok: false, error: 'BulkGate не е конфигуриран' }
  const order = cfg.channelPriority && cfg.channelPriority.length > 0 ? cfg.channelPriority : ['viber','sms']
  for (const ch of order) {
    const result = ch === 'viber' ? await sendViberViaBulkGate(phoneE164, text) : await sendSmsViaBulkGate(phoneE164, text)
    if (result.ok) return { ok: true, channel: ch, data: result.data }
  }
  return { ok: false, error: 'Неуспешно изпращане по всички канали' }
}

export function renderSmsTemplate(template: string, params: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '')
}


