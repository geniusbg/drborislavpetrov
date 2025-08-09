import { NextResponse } from 'next/server'

// Minimal server-side STT stub – replace with real provider (Whisper/Deepgram/etc.)
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.startsWith('audio/') && !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Unsupported content-type' }, { status: 400 })
    }

    // Read raw audio
    const arrayBuffer = await req.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    if (!bytes || bytes.length < 10) {
      return NextResponse.json({ error: 'Empty audio' }, { status: 400 })
    }

    // TODO: forward to STT provider here. For now return dummy transcript.
    // Example: const text = await transcribeWithWhisper(bytes)
    const text = 'примерна команда' // placeholder

    return NextResponse.json({ text })
     } catch (e: unknown) {
     const errorMessage = e instanceof Error ? e.message : 'STT error'
     return NextResponse.json({ error: errorMessage }, { status: 500 })
   }
}

