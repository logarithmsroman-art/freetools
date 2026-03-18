'use client'

import { useState, useRef, useEffect } from 'react'
import WaveSurfer from 'wavesurfer.js'
import BackButton from '@/components/BackButton'

interface Segment {
  index: number
  startTime: number
  endTime: number
}

export default function AudioSplitter() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [splitPoints, setSplitPoints] = useState<number[]>([])
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [exporting, setExporting] = useState<number | null>(null)
  const audioBuffer = useRef<AudioBuffer | null>(null)

  useEffect(() => {
    if (!file || !waveformRef.current) return
    setLoading(true)
    setSplitPoints([])

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#15803d',
      progressColor: '#052e16',
      cursorColor: '#166534',
      barWidth: 2,
      barGap: 3,
      height: 120,
    })

    const url = URL.createObjectURL(file)
    wavesurfer.current.load(url)

    wavesurfer.current.on('ready', async () => {
      setLoading(false)
      setDuration(wavesurfer.current!.getDuration())
      // Decode buffer for export
      const resp = await fetch(url)
      const ab = await resp.arrayBuffer()
      const ctx = new AudioContext()
      audioBuffer.current = await ctx.decodeAudioData(ab)
    })
    wavesurfer.current.on('audioprocess', (t: number) => setCurrentTime(t))
    wavesurfer.current.on('play', () => setIsPlaying(true))
    wavesurfer.current.on('pause', () => setIsPlaying(false))

    return () => { wavesurfer.current?.destroy(); URL.revokeObjectURL(url) }
  }, [file])

  const addSplit = () => {
    if (!wavesurfer.current || !duration) return
    const t = wavesurfer.current.getCurrentTime()
    if (splitPoints.includes(t)) return
    setSplitPoints(prev => [...prev, t].sort((a, b) => a - b))
  }

  const removeSplit = (t: number) => setSplitPoints(p => p.filter(x => x !== t))

  const segments: Segment[] = [0, ...splitPoints, duration].reduce((acc: Segment[], t, i, arr) => {
    if (i < arr.length - 1) acc.push({ index: i + 1, startTime: arr[i], endTime: arr[i + 1] })
    return acc
  }, [])

  const downloadSegment = async (seg: Segment) => {
    if (!audioBuffer.current) return
    setExporting(seg.index)
    const buf = audioBuffer.current
    const sampleRate = buf.sampleRate
    const channels = buf.numberOfChannels
    const startSample = Math.floor(seg.startTime * sampleRate)
    const endSample = Math.floor(seg.endTime * sampleRate)
    const length = endSample - startSample

    const ctx = new OfflineAudioContext(channels, length, sampleRate)
    const newBuf = ctx.createBuffer(channels, length, sampleRate)
    for (let c = 0; c < channels; c++) {
      newBuf.getChannelData(c).set(buf.getChannelData(c).subarray(startSample, endSample))
    }

    // Encode as WAV
    const wav = audioBufferToWav(newBuf)
    const blob = new Blob([wav], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name?.split('.')[0] || 'audio'}_segment${seg.index}.wav`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(null)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "1000px" }}>
      <BackButton />

      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Audio Splitter</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Split any audio into segments and download each part separately.</p>
      </header>

      <div className="card" style={{ padding: "2rem" }}>
        {!file ? (
          <div
            onClick={() => document.getElementById('audio-input-split')?.click()}
            style={{ height: "200px", border: "2px dashed var(--border-color)", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "var(--bg-secondary)" }}
          >
            <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎵</span>
            <p style={{ fontWeight: 600 }}>Click to upload an audio file</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>MP3, WAV, OGG, AAC supported</p>
            <input id="audio-input-split" type="file" accept="audio/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setSplitPoints([]); }}} />
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontWeight: 700 }}>{file.name}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  Duration: {fmt(duration)} · Current: {fmt(currentTime)} · {splitPoints.length} split{splitPoints.length !== 1 ? 's' : ''} → {segments.length} segment{segments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => { setFile(null); wavesurfer.current?.destroy(); }} style={{ border: "1px solid var(--border-color)", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", background: "none", fontSize: "0.9rem" }}>Change File</button>
            </div>

            {/* Waveform */}
            <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "1rem 1rem 0.5rem", border: "1px solid var(--border-color)", position: "relative", marginBottom: "1.5rem" }}>
              {loading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, backgroundColor: "var(--bg-secondary)", borderRadius: "12px" }}>Rendering waveform...</div>}
              <div ref={waveformRef} style={{ position: "relative" }} />

              {/* Split Markers */}
              {!loading && duration > 0 && splitPoints.map((sp, i) => (
                <div key={i} title={`Split at ${fmt(sp)} — click to remove`} onClick={() => removeSplit(sp)} style={{ position: "absolute", left: `calc(${(sp / duration) * 100}% + 1rem)`, top: "1rem", bottom: "0.5rem", width: "2px", backgroundColor: "#ef4444", cursor: "pointer", zIndex: 3 }}>
                  <div style={{ position: "absolute", top: "-8px", left: "50%", transform: "translateX(-50%)", fontSize: "0.6rem", backgroundColor: "#ef4444", color: "#fff", padding: "1px 5px", borderRadius: "4px", whiteSpace: "nowrap" }}>{fmt(sp)}</div>
                </div>
              ))}

              {/* Segment numbers between markers */}
              {!loading && duration > 0 && segments.map(seg => (
                <div key={seg.index} style={{ position: "absolute", left: `calc(${(seg.startTime / duration) * 100}% + 1rem + 4px)`, top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "var(--text-secondary)", pointerEvents: "none", zIndex: 2, backgroundColor: "var(--bg-secondary)", padding: "2px 5px", borderRadius: "4px" }}>
                  {seg.index}
                </div>
              ))}

              {/* Ruler */}
              <div style={{ display: "flex", marginTop: "0.5rem", paddingTop: "0.25rem", borderTop: "1px solid var(--border-color)" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, fontSize: "0.65rem", color: "var(--text-secondary)" }}>{fmt((duration / 8) * i)}</div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
              <button onClick={() => wavesurfer.current?.playPause()} style={{ width: "56px", height: "56px", borderRadius: "50%", border: "none", backgroundColor: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: "1.2rem", flexShrink: 0 }}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={addSplit} disabled={loading} style={{ padding: "0.85rem 2rem", borderRadius: "50px", border: "2px solid var(--accent)", backgroundColor: "transparent", color: "var(--accent)", cursor: "pointer", fontWeight: 800, fontSize: "1rem" }}>
                ✂️ Split Here ({fmt(currentTime)})
              </button>
            </div>

            {/* Segments */}
            {segments.length > 0 && (
              <div>
                <h4 style={{ marginBottom: "1rem", fontWeight: 700 }}>Segments</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                  {segments.map(seg => (
                    <div key={seg.index} className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.9rem" }}>Segment {seg.index}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{fmt(seg.startTime)} → {fmt(seg.endTime)}</p>
                      </div>
                      <button
                        onClick={() => downloadSegment(seg)}
                        disabled={exporting === seg.index}
                        className="btn-primary"
                        style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
                      >
                        {exporting === seg.index ? '...' : '⬇'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numCh = buffer.numberOfChannels, sr = buffer.sampleRate
  const len = buffer.length, depth = 16, bps = depth / 8
  const wav = new ArrayBuffer(44 + len * numCh * bps)
  const v = new DataView(wav)
  const s = (o: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)) }
  s(0, 'RIFF'); v.setUint32(4, 36 + len * numCh * bps, true)
  s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true)
  v.setUint16(20, 1, true); v.setUint16(22, numCh, true)
  v.setUint32(24, sr, true); v.setUint32(28, sr * numCh * bps, true)
  v.setUint16(32, numCh * bps, true); v.setUint16(34, depth, true)
  s(36, 'data'); v.setUint32(40, len * numCh * bps, true)
  const ch = Array.from({ length: numCh }, (_, c) => buffer.getChannelData(c))
  let offset = 44
  for (let i = 0; i < len; i++) for (let c = 0; c < numCh; c++) {
    const s = Math.max(-1, Math.min(1, ch[c][i]))
    v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); offset += 2
  }
  return wav
}
