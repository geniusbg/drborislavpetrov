import { NextResponse } from 'next/server'
import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'

// Ensure Node.js runtime for child_process usage
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  console.log('🎤 STT API called')
  try {
    const contentType = req.headers.get('content-type') || ''
    console.log('📄 Content-Type:', contentType)
    
    if (!contentType.startsWith('audio/') && !contentType.includes('multipart/form-data')) {
      console.log('❌ Unsupported content-type:', contentType)
      return NextResponse.json({ error: 'Неподдържан content-type. Очаквам аудио.' }, { status: 400 })
    }

    // Read raw audio (frontend изпраща Blob с audio/webm)
    const arrayBuffer = await req.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    console.log('📊 Audio size:', bytes.length, 'bytes')
    
    if (!bytes || bytes.length < 10) {
      console.log('❌ Empty audio input')
      return NextResponse.json({ error: 'Празен аудио вход.' }, { status: 400 })
    }

    // Write to temp file
    const tmpDir = process.env.TEMP_DIR || os.tmpdir()
    const id = randomUUID()
    const ext = guessExtensionFromContentType(contentType)
    const audioPath = path.join(tmpDir, `${id}.${ext}`)
    
    console.log('💾 Writing to temp file:', audioPath)
    console.log('📁 Temp dir permissions:', await checkDirPermissions(tmpDir))
    
    await fs.writeFile(audioPath, bytes)
    console.log('✅ Audio file written successfully')

    try {
      // Run Whisper CLI (Python openai-whisper). Requires it to be installed locally.
      const cli = resolveWhisperCommand()
      console.log('🔧 Whisper CLI config:', cli)
      
      if (!cli) {
        console.log('❌ Whisper CLI not found')
        return NextResponse.json({ error: 'Whisper не е наличен на сървъра. Инсталирайте го локално.' }, { status: 501 })
      }

      // Use tiny model for better CPU compatibility
      const model = process.env.WHISPER_MODEL || 'tiny'
      const args = buildWhisperArgs(cli, audioPath, model)
      
      console.log('🚀 Running Whisper command:', cli.cmd, args.join(' '))
      console.log('⏱️ Model:', model, '| Timeout: 60s')

      // Set environment variables to force CPU usage
      const env = {
        ...process.env,
        CUDA_VISIBLE_DEVICES: '',
        OMP_NUM_THREADS: '4',
        PYTORCH_CUDA_ALLOC_CONF: 'max_split_size_mb:128'
      }
      
      const { code, stdout, stderr } = await execWithPromise(cli.cmd, args, { timeoutMs: 60_000, env })
      
      console.log('📤 Whisper stdout:', stdout)
      console.log('📤 Whisper stderr:', stderr)
      console.log('📤 Whisper exit code:', code)
      
      if (code !== 0) {
        console.log('❌ Whisper failed with code:', code)
        return NextResponse.json({ 
          error: `Грешка при транскрипция (код ${code}): ${stderr || 'неизвестна грешка'}` 
        }, { status: 500 })
      }

      // Whisper CLI създава .txt до аудио файла
      const transcriptPath = `${audioPath}.txt`
      console.log('📖 Reading transcript from:', transcriptPath)
      
      const transcript = await fs.readFile(transcriptPath, 'utf8').catch((err) => {
        console.log('❌ Failed to read transcript file:', err.message)
        return ''
      })
      
      console.log('📝 Raw transcript:', transcript)
      
      if (!transcript.trim()) {
        console.log('❌ Empty transcript')
        return NextResponse.json({ error: 'Няма разпознат текст.' }, { status: 422 })
      }

      const cleanTranscript = transcript.trim()
      console.log('✅ Final transcript:', cleanTranscript)
      return NextResponse.json({ text: cleanTranscript })
    } finally {
      // Cleanup temp files
      await safeUnlink(`${audioPath}.txt`)
      await safeUnlink(audioPath)
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Грешка при STT'
    console.log('💥 STT API error:', errorMessage)
    console.log('💥 Error stack:', e instanceof Error ? e.stack : 'No stack trace')
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Helper function to check directory permissions
async function checkDirPermissions(dirPath: string): Promise<string> {
  try {
    await fs.access(dirPath, fs.constants.W_OK)
    return 'WRITABLE'
  } catch (error) {
    return `NOT_WRITABLE: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

function guessExtensionFromContentType(contentType: string): string {
  if (contentType.includes('webm')) return 'webm'
  if (contentType.includes('wav')) return 'wav'
  if (contentType.includes('mpeg') || contentType.includes('mp3')) return 'mp3'
  if (contentType.includes('ogg')) return 'ogg'
  return 'webm'
}

async function safeUnlink(filePath: string) {
  try { await fs.unlink(filePath) } catch {}
}

function resolveWhisperCommand(): { cmd: string; mode: 'cli' | 'python' } | null {
  // Priority: explicit env > whisper cli > python -m whisper
  const explicit = process.env.WHISPER_CLI?.trim()
  if (explicit) return { cmd: explicit, mode: 'cli' }
  // We will optimistically try `whisper` command; if it fails, caller handles non-zero code
  return { cmd: 'whisper', mode: 'cli' }
}

function buildWhisperArgs(cli: { cmd: string; mode: 'cli' | 'python' }, audioPath: string, model: string): string[] {
  if (cli.mode === 'python') {
    return ['-m', 'whisper', audioPath, '--model', model, '--language', 'bg', '--output_format', 'txt', '--device', 'cpu']
  }
  // openai-whisper CLI - минимални аргументи за CPU
  return [audioPath, '--model', model, '--language', 'bg', '--output_format', 'txt', '--device', 'cpu']
}

function execWithPromise(cmd: string, args: string[], opts?: { timeoutMs?: number; env?: any }): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { 
      shell: process.platform === 'win32',
      env: opts?.env || process.env
    })
    const timer = opts?.timeoutMs ? setTimeout(() => { try { child.kill('SIGKILL') } catch {} }, opts.timeoutMs) : null
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => {
      if (timer) clearTimeout(timer)
      resolve({ code: code ?? 0, stdout, stderr })
    })
  })
}

