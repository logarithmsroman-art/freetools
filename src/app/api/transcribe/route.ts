import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check duration via file size proxy — 5 min at ~1MB/min for audio = 5MB rough limit
    // We'll enforce this on the client too.
    const maxBytes = 25 * 1024 * 1024 // 25MB limit for audio
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Audio too large. Please use a shorter video (max 5 mins).' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    // Accept audio/webm from client-side extraction, or fallback to video
    const mimeType = file.type && file.type !== 'application/octet-stream' ? file.type : 'audio/webm'

    const prompt = `You are a professional video transcription engine.
Transcribe ALL spoken words from this video/audio file.
Return ONLY a JSON array of caption segments. Each segment should be 3-7 words max for readability.
Format: [{"text": "Hello everyone welcome back", "start": 0.0, "end": 1.8}, ...]
- "start" and "end" are timestamps in seconds.
- Cover the ENTIRE audio from beginning to end.
- Do NOT include any other text, markdown, or explanation. Just the raw JSON array.`

    const body = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            },
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192
      }
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    )

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || 'Gemini error' }, { status: 500 })
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

    // Extract JSON from the response (strip any markdown fences)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse transcription', raw: rawText }, { status: 500 })
    }

    const captions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ captions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
