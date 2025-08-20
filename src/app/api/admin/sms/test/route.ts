import { NextRequest, NextResponse } from 'next/server'
import { getBulkGateConfig, renderSmsTemplate, sendSmsViaBulkGate, sendViberViaBulkGate, sendWithChannelPriority } from '@/lib/sms'
import { normalizePhoneE164 } from '@/lib/phone'

function isAuthorized(request: NextRequest) {
  const token = request.headers.get('x-admin-token')
  return token === 'mock-token' || token === 'test'
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const phoneRaw = body?.phone as string | undefined
    const textRaw = (body?.text as string | undefined) || 'Тест съобщение от Д-р Петров.'
    const channel = (body?.channel as 'sms' | 'viber' | 'auto' | undefined) || 'auto'

    const cfg = getBulkGateConfig()
    if (!cfg) return NextResponse.json({ success: false, error: 'BulkGate не е конфигуриран или е изключен' }, { status: 400 })

    const phone = normalizePhoneE164(phoneRaw || '')
    if (!phone) return NextResponse.json({ success: false, error: 'Невалиден телефон' }, { status: 400 })

    const text = renderSmsTemplate(textRaw, {})
    const result = channel === 'viber'
      ? await sendViberViaBulkGate(phone, text)
      : channel === 'sms'
        ? await sendSmsViaBulkGate(phone, text)
        : await sendWithChannelPriority(phone, text)
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, data: result.data }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    const err = error as Partial<{ message: string }>
    return NextResponse.json({ success: false, error: err.message || 'Грешка при тестово изпращане' }, { status: 500 })
  }
}


