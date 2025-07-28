import { NextRequest, NextResponse } from 'next/server'
import { validateContact } from '@/lib/validation'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'
// import { validateCSRFToken } from '@/lib/csrf' // временно изключено

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const identifier = getClientIdentifier(clientIP, userAgent)
    
    const rateLimit = checkRateLimit(identifier)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Твърде много заявки. Моля опитайте по-късно.' },
        { status: 429 }
      )
    }

    // CSRF protection - временно изключено за тестване
    // const csrfToken = request.headers.get('x-csrf-token')
    // const sessionToken = request.cookies.get('csrf')?.value
    
    // if (!csrfToken || !sessionToken || !validateCSRFToken(csrfToken, sessionToken)) {
    //   return NextResponse.json(
    //     { error: 'Невалидна заявка' },
    //     { status: 403 }
    //   )
    // }

    // Validate form data
    const body = await request.json()
    const validation = validateContact(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Невалидни данни', details: validation.error.issues },
        { status: 400 }
      )
    }

    // TODO: Send email notification
    // For now, just log the contact
    console.log('Contact form received:', validation.data)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Съобщението е изпратено успешно! Ще се свържем с вас скоро.',
        remaining: rateLimit.remaining
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка. Моля опитайте отново.' },
      { status: 500 }
    )
  }
} 