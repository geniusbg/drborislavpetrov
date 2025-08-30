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
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.startsWith('audio/') && !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Неподдържан content-type. Очаквам аудио.' }, { status: 400 })
    }

    // Read raw audio (frontend изпраща Blob с audio/webm)
    const arrayBuffer = await req.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    if (!bytes || bytes.length < 10) {
      return NextResponse.json({ error: 'Празен аудио вход.' }, { status: 400 })
    }

    // Write to temp file
    const tmpDir = os.tmpdir()
    const id = randomUUID()
    const ext = guessExtensionFromContentType(contentType)
    const audioPath = path.join(tmpDir, `${id}.${ext}`)
    await fs.writeFile(audioPath, bytes)

    try {
      // Run Whisper CLI (Python openai-whisper). Requires it to be installed locally.
      const cli = resolveWhisperCommand()
      if (!cli) {
        return NextResponse.json({ error: 'Whisper не е наличен на сървъра. Инсталирайте го локално.' }, { status: 501 })
      }

      const model = process.env.WHISPER_MODEL || 'small'
      const args = buildWhisperArgs(cli, audioPath, model)

      const { code, stderr } = await execWithPromise(cli.cmd, args, { timeoutMs: 60_000 })
      if (code !== 0) {
        return NextResponse.json({ error: `Грешка при транскрипция: ${stderr || 'неизвестна грешка'}` }, { status: 500 })
      }

      // Whisper CLI създава .txt до аудио файла
      const transcriptPath = `${audioPath}.txt`
      const transcript = await fs.readFile(transcriptPath, 'utf8').catch(() => '')
      if (!transcript.trim()) {
        return NextResponse.json({ error: 'Няма разпознат текст.' }, { status: 422 })
      }

      return NextResponse.json({ text: transcript.trim() })
    } finally {
      // Cleanup temp files
      await safeUnlink(`${audioPath}.txt`)
      await safeUnlink(audioPath)
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Грешка при STT'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
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
    return ['-m', 'whisper', audioPath, '--model', model, '--language', 'bg', '--output_format', 'txt', '--fp16', 'False']
  }
  // openai-whisper CLI
  return [audioPath, '--model', model, '--language', 'bg', '--output_format', 'txt', '--fp16', 'False']
}

function execWithPromise(cmd: string, args: string[], opts?: { timeoutMs?: number }): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: process.platform === 'win32' })
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

