import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 min

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const language = (formData.get('language') as string | null) || null // null = auto-detect
    const chunkSize = parseInt((formData.get('chunkSize') as string) || '4', 10)

    if (!file) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

    // Convert to base64 data URL for Replicate
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = file.type || 'audio/wav'
    const dataUrl = `data:${mimeType};base64,${base64}`

    const replicateInput: Record<string, unknown> = {
      audio: dataUrl,
      model: 'large-v3',
      word_timestamps: true,
      transcript_output_format: 'segments_only',
    }
    // Only pass language if explicitly set (omitting triggers auto-detect)
    if (language && language !== 'auto') {
      replicateInput.language = language
    }

    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e',
        input: replicateInput,
      })
    })

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      const msg = err?.detail || err?.error || `Replicate API error (${createRes.status})`
      console.error('Replicate create error:', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    let prediction = await createRes.json()
    console.log('Prediction created:', prediction.id, prediction.status)

    // Poll until done (max ~4 minutes, polling every 3s)
    let polls = 0
    const maxPolls = 80
    while (
      prediction.status !== 'succeeded' &&
      prediction.status !== 'failed' &&
      prediction.status !== 'canceled' &&
      polls < maxPolls
    ) {
      await new Promise(r => setTimeout(r, 3000))
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}` }
      })
      if (!pollRes.ok) break
      prediction = await pollRes.json()
      polls++
      console.log(`Poll ${polls}: ${prediction.status}`)
    }

    if (prediction.status !== 'succeeded') {
      const errMsg = prediction.error || `Transcription ${prediction.status} after ${polls} polls`
      return NextResponse.json({ error: errMsg }, { status: 500 })
    }

    const output = prediction.output
    const rawSegments: Array<{ start: number; end: number; text: string; words?: Array<{word: string; start: number; end: number}> }> =
      output?.segments || []

    // Use flat word list if available (accurate timing), else fall back to equal distribution
    const wordList: Array<{word: string; start: number; end: number}> =
      output?.words || rawSegments.flatMap(seg => seg.words || [])

    const captions: Array<{ text: string; start: number; end: number; words?: Array<{word: string; start: number; end: number}> }> = []

    if (wordList.length > 0) {
      // Word-timestamp-based chunking — accurate timing per caption bubble
      for (let i = 0; i < wordList.length; i += chunkSize) {
        const chunk = wordList.slice(i, i + chunkSize)
        captions.push({
          text: chunk.map(w => w.word).join(' ').trim(),
          start: parseFloat(chunk[0].start.toFixed(2)),
          end: parseFloat(chunk[chunk.length - 1].end.toFixed(2)),
          words: chunk.map(w => ({ word: w.word, start: parseFloat(w.start.toFixed(3)), end: parseFloat(w.end.toFixed(3)) })),
        })
      }
    } else {
      // Fallback: equal distribution within each segment
      for (const seg of rawSegments) {
        const words = seg.text.trim().split(/\s+/).filter(Boolean)
        if (!words.length) continue

        const chunks: string[] = []
        for (let i = 0; i < words.length; i += chunkSize) {
          chunks.push(words.slice(i, i + chunkSize).join(' '))
        }

        const duration = seg.end - seg.start
        const chunkDur = duration / chunks.length

        chunks.forEach((text, idx) => {
          captions.push({
            text,
            start: parseFloat((seg.start + idx * chunkDur).toFixed(2)),
            end: parseFloat((seg.start + (idx + 1) * chunkDur).toFixed(2)),
          })
        })
      }
    }

    return NextResponse.json({ captions })
  } catch (err: any) {
    console.error('Whisper route error:', err)
    return NextResponse.json({ error: err.message || 'Unknown server error' }, { status: 500 })
  }
}
