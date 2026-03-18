'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioTrack {
  id: number
  file: File
  url: string
  duration: number
  color: string
}

const COLORS = ['#15803d', '#2563eb', '#9333ea', '#f59e0b', '#ef4444', '#06b6d4']

export default function AudioJoiner() {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [playing, setPlaying] = useState<number | null>(null)
  const [merging, setMerging] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      const audio = new Audio(url)
      audio.onloadedmetadata = () => {
        setTracks(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          url,
          duration: audio.duration,
          color: COLORS[prev.length % COLORS.length]
        }])
      }
    })
    // reset input
    e.target.value = ''
  }

  const removeTrack = (id: number) => {
    setTracks(prev => prev.filter(t => t.id !== id))
  }

  const playTrack = (id: number) => {
    // Stop everything else
    Object.values(audioRefs.current).forEach(a => a.pause())
    if (playing === id) {
      setPlaying(null)
      return
    }
    const a = audioRefs.current[id]
    if (a) {
      a.currentTime = 0
      a.play()
      setPlaying(id)
      a.onended = () => setPlaying(null)
    }
  }

  const merge = async () => {
    if (tracks.length < 2) return
    setMerging(true)
    setDownloadUrl(null)

    const ctx = new AudioContext()
    const buffers: AudioBuffer[] = []

    for (const track of tracks) {
      const resp = await fetch(track.url)
      const ab = await resp.arrayBuffer()
      const buf = await ctx.decodeAudioData(ab)
      buffers.push(buf)
    }

    const totalLength = buffers.reduce((s, b) => s + b.length, 0)
    const channels = buffers[0].numberOfChannels
    const merged = ctx.createBuffer(channels, totalLength, ctx.sampleRate)

    let offset = 0
    buffers.forEach(buf => {
      for (let c = 0; c < channels; c++) {
        merged.getChannelData(c).set(buf.getChannelData(c), offset)
      }
      offset += buf.length
    })

    // Encode to WAV
    const wav = audioBufferToWav(merged)
    const blob = new Blob([wav], { type: 'audio/wav' })
    setDownloadUrl(URL.createObjectURL(blob))
    setMerging(false)
  }

  const totalDuration = tracks.reduce((s, t) => s + t.duration, 0)

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "1000px" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Audio Joiner</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Merge multiple audio tracks on a visual timeline — CapCut-style, no upload needed.</p>
      </header>

      {/* CapCut-style dark editor area */}
      <div style={{ backgroundColor: "#0f0f0f", borderRadius: "16px", overflow: "hidden", marginBottom: "2rem" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", borderBottom: "1px solid #2a2a2a" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#fff", padding: "0.6rem 1.25rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            <span>+</span> Add Track
            <input type="file" accept="audio/*" multiple style={{ display: "none" }} onChange={handleUpload} />
          </label>
          <span style={{ color: "#555", fontSize: "0.85rem" }}>
            {tracks.length} tracks • {totalDuration.toFixed(1)}s total
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
            {downloadUrl ? (
              <a href={downloadUrl} download="merged.wav" style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#15803d", color: "#fff", padding: "0.6rem 1.25rem", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem" }}>
                ⬇ Download Merged
              </a>
            ) : (
              <button onClick={merge} disabled={tracks.length < 2 || merging} style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: tracks.length < 2 ? "#1a1a1a" : "#15803d", color: tracks.length < 2 ? "#555" : "#fff", border: "none", padding: "0.6rem 1.25rem", borderRadius: "8px", cursor: tracks.length < 2 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
                {merging ? '⏳ Merging...' : '🔀 Merge All'}
              </button>
            )}
          </div>
        </div>

        {/* Track lanes */}
        <div style={{ padding: "1.5rem", minHeight: "250px" }}>
          {tracks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "220px", color: "#555" }}>
              <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎵</span>
              <p style={{ fontWeight: 500 }}>Add audio tracks above to get started</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}>Supports MP3, WAV, AAC, OGG</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tracks.map((track, i) => (
                <div key={track.id} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {/* Track side label */}
                  <div style={{ width: "120px", flexShrink: 0 }}>
                    <p style={{ fontSize: "0.75rem", color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.file.name}</p>
                  </div>
                  {/* Waveform Placeholder (visual timeline bar) */}
                  <div style={{ flex: 1, position: "relative", height: "56px", backgroundColor: "#1a1a1a", borderRadius: "8px", overflow: "hidden", border: `1px solid ${track.color}40` }}>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: "1rem" }}>
                      {/* Mini waveform simulation */}
                      <div style={{ display: "flex", gap: "2px", alignItems: "center", height: "100%", overflow: "hidden", width: "100%", padding: "0 1rem" }}>
                        {Array.from({ length: 100 }).map((_, j) => (
                          <div key={j} style={{ flexShrink: 0, width: "3px", height: `${20 + Math.abs(Math.sin(j * 0.5 + i) * 30)}px`, backgroundColor: `${track.color}aa`, borderRadius: "2px" }} />
                        ))}
                      </div>
                    </div>
                    {/* Duration label */}
                    <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "#aaa" }}>{track.duration.toFixed(1)}s</span>
                  </div>
                  {/* Controls */}
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button onClick={() => playTrack(track.id)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: playing === track.id ? track.color : "#2a2a2a", color: "#fff", cursor: "pointer", fontSize: "0.9rem" }}>
                      {playing === track.id ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => removeTrack(track.id)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#2a2a2a", color: "#ef4444", cursor: "pointer", fontSize: "0.9rem" }}>
                      ✕
                    </button>
                  </div>
                  <audio ref={el => { if (el) audioRefs.current[track.id] = el }} src={track.url} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom timeline ruler */}
        {tracks.length > 0 && (
          <div style={{ display: "flex", padding: "0.5rem 1.5rem 0.75rem calc(120px + 2rem + 1.5rem)", gap: 0, borderTop: "1px solid #1a1a1a" }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ flex: 1, fontSize: "0.65rem", color: "#555", textAlign: "left", borderLeft: "1px solid #222", paddingLeft: "3px" }}>
                {((totalDuration / 10) * i).toFixed(1)}s
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

// Simple WAV encoder
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numCh = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numCh * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataLength = buffer.length * blockAlign
  const wav = new ArrayBuffer(44 + dataLength)
  const view = new DataView(wav)

  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
  const u16 = (o: number, v: number) => view.setUint16(o, v, true)
  const u32 = (o: number, v: number) => view.setUint32(o, v, true)

  w(0, 'RIFF')
  u32(4, 36 + dataLength)
  w(8, 'WAVE')
  w(12, 'fmt ')
  u32(16, 16)
  u16(20, format)
  u16(22, numCh)
  u32(24, sampleRate)
  u32(28, byteRate)
  u16(32, blockAlign)
  u16(34, bitDepth)
  w(36, 'data')
  u32(40, dataLength)

  const channels = []
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c))

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      offset += 2
    }
  }
  return wav
}
