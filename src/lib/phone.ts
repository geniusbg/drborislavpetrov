export function normalizePhoneE164(raw: string, defaultCountry: 'BG' | string = process.env.DEFAULT_COUNTRY || 'BG'): string | null {
  if (!raw) return null
  let value = String(raw).trim()
  // Replace leading 00 with +
  if (value.startsWith('00')) value = '+' + value.slice(2)
  // Remove all except digits and leading +
  value = value.replace(/[^+\d]/g, '')
  if (value.startsWith('+')) {
    // Already in international form; minimal validation: at least 8 digits after +
    const digits = value.replace(/\D/g, '')
    if (digits.length < 8) return null
    return '+' + digits
  }
  // Local format without +; fallback by default country
  const digits = value.replace(/\D/g, '')
  if (defaultCountry.toUpperCase() === 'BG') {
    // Bulgarian local: allow leading 0; build +359
    const local = digits.replace(/^0+/, '')
    if (local.length < 8) return null
    return '+359' + local
  }
  // Generic fallback: require caller to provide +country; otherwise return null
  return null
}

export function sanitizePhoneDigits(raw: string): string {
  return (raw || '').replace(/\D/g, '')
}

export function formatPhoneInternational(e164: string): string {
  if (!e164 || !e164.startsWith('+')) return e164 || ''
  // Very basic spacing: +CCC XXX XXX XXX
  const digits = e164.slice(1)
  if (digits.length <= 3) return e164
  const parts: string[] = []
  parts.push('+' + digits.slice(0, 3))
  let rest = digits.slice(3)
  while (rest.length > 0) {
    parts.push(rest.slice(0, 3))
    rest = rest.slice(3)
  }
  return parts.join(' ')
}


