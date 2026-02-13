import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'cases')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

function safeFilename(original: string): string {
  const ext = path.extname(original).toLowerCase() || '.jpg'
  const base = Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
  return base + (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg')
}

type GalleryItem = { path: string; caption: string }

async function processGalleryFromFormData(formData: FormData): Promise<GalleryItem[]> {
  const galleryStr = formData.get('gallery') as string | null
  if (!galleryStr) return []
  let arr: { path: string | null; caption: string }[] = []
  try {
    arr = JSON.parse(galleryStr) as { path: string | null; caption: string }[]
  } catch {
    return []
  }
  ensureUploadDir()
  const result: GalleryItem[] = []
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    const caption = (item?.caption ?? '').trim()
    let finalPath: string | null = item?.path ?? null
    const file = formData.get(`gallery_${i}_file`) as File | null
    if (file && file.size > 0 && file.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(file.type)) {
      const filename = safeFilename(file.name)
      const filepath = path.join(UPLOAD_DIR, filename)
      const buf = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filepath, buf)
      finalPath = `/uploads/cases/${filename}`
    }
    if (finalPath) result.push({ path: finalPath, caption })
  }
  return result
}

export async function GET(_request: NextRequest) {
  try {
    const db = await getDatabase()
    try {
      const result = await db.query(`
        SELECT id, title, short_description, main_image_path, body, gallery, order_index,
               show_on_homepage, homepage_order, created_at, updated_at
        FROM cases
        ORDER BY order_index ASC, id ASC
      `)
      const cases = result.rows.map((row: { gallery?: string | null; [k: string]: unknown }) => {
        let gallery: GalleryItem[] = []
        if (typeof row.gallery === 'string' && row.gallery) {
          try {
            gallery = JSON.parse(row.gallery) as GalleryItem[]
          } catch {}
        }
        return { ...row, gallery }
      })
      return NextResponse.json({ cases })
    } finally {
      db.release()
    }
  } catch (error) {
    console.error('GET /api/admin/cases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let title = ''
    let short_description = ''
    let body: string | null = null
    let order_index = 0
    let show_on_homepage = false
    let homepage_order = 0
    let main_image_path: string | null = null
    let gallery: GalleryItem[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      title = (formData.get('title') as string)?.trim() || ''
      short_description = (formData.get('short_description') as string)?.trim() || ''
      body = (formData.get('body') as string)?.trim() || null
      order_index = parseInt(String(formData.get('order_index') || '0'), 10) || 0
      show_on_homepage = formData.get('show_on_homepage') === 'true' || formData.get('show_on_homepage') === '1'
      homepage_order = parseInt(String(formData.get('homepage_order') || '0'), 10) || 0
      const file = formData.get('main_image') as File | null
      if (file && file.size > 0 && file.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(file.type)) {
        ensureUploadDir()
        const filename = safeFilename(file.name)
        const filepath = path.join(UPLOAD_DIR, filename)
        const buf = Buffer.from(await file.arrayBuffer())
        fs.writeFileSync(filepath, buf)
        main_image_path = `/uploads/cases/${filename}`
      }
      gallery = await processGalleryFromFormData(formData)
    } else {
      const bodyJson = await request.json()
      title = (bodyJson.title || '').trim()
      short_description = (bodyJson.short_description || '').trim()
      body = (bodyJson.body || '').trim() || null
      order_index = parseInt(bodyJson.order_index, 10) || 0
      show_on_homepage = Boolean(bodyJson.show_on_homepage)
      homepage_order = parseInt(bodyJson.homepage_order, 10) || 0
      if (Array.isArray(bodyJson.gallery)) {
        gallery = bodyJson.gallery.filter((x: { path?: string; caption?: string }) => x && typeof x.path === 'string').map((x: { path: string; caption?: string }) => ({ path: x.path, caption: String(x.caption ?? '').trim() }))
      }
    }

    if (!title || !short_description) {
      return NextResponse.json(
        { error: 'Липсват заглавие или кратко описание' },
        { status: 400 }
      )
    }

    const galleryJson = JSON.stringify(gallery)
    const db = await getDatabase()
    try {
      const result = await db.query(`
        INSERT INTO cases (title, short_description, main_image_path, body, gallery, order_index, show_on_homepage, homepage_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title, short_description, main_image_path, body, gallery, order_index, show_on_homepage, homepage_order, created_at, updated_at
      `, [title, short_description, main_image_path, body, galleryJson, order_index, show_on_homepage, homepage_order])
      const row = result.rows[0]
      if (typeof row.gallery === 'string' && row.gallery) {
        try {
          row.gallery = JSON.parse(row.gallery)
        } catch {
          row.gallery = []
        }
      } else if (row.gallery == null) row.gallery = []
      return NextResponse.json({ success: true, case: row })
    } finally {
      db.release()
    }
  } catch (error) {
    console.error('POST /api/admin/cases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let id: number
    let title = ''
    let short_description = ''
    let body: string | null = null
    let order_index = 0
    let show_on_homepage = false
    let homepage_order = 0
    let main_image_path: string | null | undefined = undefined
    let gallery: GalleryItem[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const idParam = formData.get('id')
      id = typeof idParam === 'string' ? parseInt(idParam, 10) : Number(idParam)
      if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
      }
      title = (formData.get('title') as string)?.trim() || ''
      short_description = (formData.get('short_description') as string)?.trim() || ''
      body = (formData.get('body') as string)?.trim() || null
      order_index = parseInt(String(formData.get('order_index') || '0'), 10) || 0
      show_on_homepage = formData.get('show_on_homepage') === 'true' || formData.get('show_on_homepage') === '1'
      homepage_order = parseInt(String(formData.get('homepage_order') || '0'), 10) || 0
      const file = formData.get('main_image') as File | null
      if (file && file.size > 0 && file.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(file.type)) {
        ensureUploadDir()
        const filename = safeFilename(file.name)
        const filepath = path.join(UPLOAD_DIR, filename)
        const buf = Buffer.from(await file.arrayBuffer())
        fs.writeFileSync(filepath, buf)
        main_image_path = `/uploads/cases/${filename}`
      }
      gallery = await processGalleryFromFormData(formData)
    } else {
      const bodyJson = await request.json()
      id = typeof bodyJson.id === 'number' ? bodyJson.id : parseInt(bodyJson.id, 10)
      if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
      }
      title = (bodyJson.title || '').trim()
      short_description = (bodyJson.short_description || '').trim()
      body = (bodyJson.body || '').trim() || null
      order_index = parseInt(bodyJson.order_index, 10) || 0
      show_on_homepage = Boolean(bodyJson.show_on_homepage)
      homepage_order = parseInt(bodyJson.homepage_order, 10) || 0
      if (bodyJson.main_image_path !== undefined) main_image_path = bodyJson.main_image_path
      if (Array.isArray(bodyJson.gallery)) {
        gallery = bodyJson.gallery.filter((x: { path?: string }) => x && typeof x.path === 'string').map((x: { path: string; caption?: string }) => ({ path: x.path, caption: String(x.caption ?? '').trim() }))
      }
    }

    if (!title || !short_description) {
      return NextResponse.json(
        { error: 'Липсват заглавие или кратко описание' },
        { status: 400 }
      )
    }

    const galleryJson = JSON.stringify(gallery)
    const db = await getDatabase()
    try {
      if (main_image_path !== undefined) {
        await db.query(`
          UPDATE cases
          SET title = $1, short_description = $2, main_image_path = $3, body = $4, gallery = $5, order_index = $6, show_on_homepage = $7, homepage_order = $8, updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
        `, [title, short_description, main_image_path, body, galleryJson, order_index, show_on_homepage, homepage_order, id])
      } else {
        await db.query(`
          UPDATE cases
          SET title = $1, short_description = $2, body = $3, gallery = $4, order_index = $5, show_on_homepage = $6, homepage_order = $7, updated_at = CURRENT_TIMESTAMP
          WHERE id = $8
        `, [title, short_description, body, galleryJson, order_index, show_on_homepage, homepage_order, id])
      }
      const sel = await db.query(`
        SELECT id, title, short_description, main_image_path, body, gallery, order_index, show_on_homepage, homepage_order, created_at, updated_at FROM cases WHERE id = $1
      `, [id])
      if (sel.rows.length === 0) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      const row = sel.rows[0]
      if (typeof row.gallery === 'string' && row.gallery) {
        try {
          row.gallery = JSON.parse(row.gallery)
        } catch {
          row.gallery = []
        }
      } else if (row.gallery == null) row.gallery = []
      return NextResponse.json({ success: true, case: row })
    } finally {
      db.release()
    }
  } catch (error) {
    console.error('PUT /api/admin/cases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = body?.id ?? new URL(request.url).searchParams.get('id')
    const idNum = typeof id === 'number' ? id : parseInt(String(id), 10)
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const db = await getDatabase()
    try {
      const row = await db.query('SELECT main_image_path, gallery FROM cases WHERE id = $1', [idNum])
      if (row.rows.length === 0) {
        db.release()
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      const main_image_path = row.rows[0].main_image_path
      if (main_image_path && typeof main_image_path === 'string') {
        const filepath = path.join(process.cwd(), 'public', main_image_path.replace(/^\//, ''))
        if (fs.existsSync(filepath)) {
          try {
            fs.unlinkSync(filepath)
          } catch (_) {}
        }
      }
      const galleryStr = row.rows[0].gallery
      if (typeof galleryStr === 'string' && galleryStr) {
        try {
          const galleryArr = JSON.parse(galleryStr) as GalleryItem[]
          for (const g of galleryArr) {
            if (g?.path) {
              const filepath = path.join(process.cwd(), 'public', g.path.replace(/^\//, ''))
              if (fs.existsSync(filepath)) {
                try {
                  fs.unlinkSync(filepath)
                } catch (_) {}
              }
            }
          }
        } catch (_) {}
      }
      await db.query('DELETE FROM cases WHERE id = $1', [idNum])
      return NextResponse.json({ success: true })
    } finally {
      db.release()
    }
  } catch (error) {
    console.error('DELETE /api/admin/cases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
