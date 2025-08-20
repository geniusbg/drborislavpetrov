import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'app-settings.json')

export function getSiteDomain(): string {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const json = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) as { site?: { domain?: string } }
      const fromSettings = json?.site?.domain
      if (fromSettings && typeof fromSettings === 'string' && fromSettings.trim() !== '') {
        return normalizeDomain(fromSettings)
      }
    }
  } catch {
    // ignore read errors and fall back
  }
  const fromEnv = process.env.SITE_DOMAIN
  return normalizeDomain(fromEnv || 'http://localhost:3000')
}

function normalizeDomain(value: string): string {
  let domain = value.trim()
  if (!/^https?:\/\//i.test(domain)) {
    domain = `https://${domain}`
  }
  // remove trailing slash
  domain = domain.replace(/\/$/, '')
  return domain
}

export function withBase(pathname: string): string {
  const base = getSiteDomain()
  if (!pathname.startsWith('/')) return `${base}/${pathname}`
  return `${base}${pathname}`
}


