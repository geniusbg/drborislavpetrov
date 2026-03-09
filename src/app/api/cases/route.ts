import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'app-settings.json')

function loadCasesSectionTitle(): string {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const json = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
      return typeof json?.casesSectionTitle === 'string' && json.casesSectionTitle.trim()
        ? json.casesSectionTitle.trim()
        : 'Клинични случаи'
    }
  } catch (_) {}
  return 'Клинични случаи'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const homepageOnly = searchParams.get('homepage') === '1' || searchParams.get('homepage') === 'true'

    const db = await getDatabase()
    try {
      const query = homepageOnly
        ? `SELECT id, title, short_description, main_image_path, body, gallery, order_index, homepage_order, created_at
           FROM cases
           WHERE show_on_homepage = true
           ORDER BY created_at DESC, id DESC`
        : `SELECT id, title, short_description, main_image_path, body, gallery, order_index, created_at
           FROM cases
           ORDER BY created_at DESC, id DESC`
      const result = await db.query(query)
      const cases = result.rows.map((row: { gallery?: string | null; [k: string]: unknown }) => {
        let gallery: { path: string; caption: string }[] = []
        if (typeof row.gallery === 'string' && row.gallery) {
          try {
            gallery = JSON.parse(row.gallery) as { path: string; caption: string }[]
          } catch {}
        }
        return { ...row, gallery }
      })
      const sectionTitle = loadCasesSectionTitle()
      return NextResponse.json({
        cases,
        sectionTitle,
      })
    } finally {
      db.release()
    }
  } catch (error) {
    console.error('GET /api/cases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
