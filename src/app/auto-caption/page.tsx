'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import BackButton from '@/components/BackButton'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Caption {
  id: string
  text: string
  start: number
  end: number
}

interface CaptionStyle {
  fontFamily: string
  fontSize: number
  color: string
  bgColor: string
  bgOpacity: number
  bold: boolean
  position: 'bottom' | 'center' | 'top'
  animation: 'none' | 'bounce' | 'fade'
  highlightColor: string
  outline: boolean
}

type Platform = 'none' | 'youtube' | 'instagram' | 'tiktok'

const PLATFORMS = [
  { key: 'none', label: 'None', icon: '🎬', ratio: null },
  { key: 'youtube', label: 'YouTube', icon: '▶', ratio: '16/9' },
  { key: 'instagram', label: 'Instagram', icon: '📸', ratio: '1/1' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', ratio: '9/16' },
] as const

const FONTS = [
  'Arial', 'Impact', 'Georgia', 'Courier New', 'Trebuchet MS', 'Verdana'
]

const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: 'Impact',
  fontSize: 28,
  color: '#ffffff',
  bgColor: '#000000',
  bgOpacity: 0.6,
  bold: true,
  position: 'bottom',
  animation: 'none',
  highlightColor: '#f9c22e',
  outline: true,
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AutoCaption() {
  const [step, setStep] = useState<'upload' | 'transcribing' | 'edit' | 'exporting'>('upload')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [captions, setCaptions] = useState<Caption[]>([])
  const [style, setStyle] = useState<CaptionStyle>(DEFAULT_STYLE)
  const [platform, setPlatform] = useState<Platform>('none')
  const [activeCaption, setActiveCaption] = useState<Caption | null>(null)
  const [activeTab, setActiveTab] = useState<'captions' | 'styles'>('captions')
  const [exportProgress, setExportProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // ── Canvas preview loop ────────────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const t = video.currentTime
    const active = captions.find(c => t >= c.start && t <= c.end)
    if (active) {
      drawCaption(ctx, active.text, canvas.width, canvas.height, style)
    }

    animFrameRef.current = requestAnimationFrame(drawFrame)
  }, [captions, style])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const start = () => {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = requestAnimationFrame(drawFrame)
    }
    const stop = () => cancelAnimationFrame(animFrameRef.current)
    video.addEventListener('play', start)
    video.addEventListener('pause', stop)
    video.addEventListener('ended', stop)
    video.addEventListener('timeupdate', () => setCurrentTime(video.currentTime))
    return () => {
      video.removeEventListener('play', start)
      video.removeEventListener('pause', stop)
      video.removeEventListener('ended', stop)
    }
  }, [drawFrame])

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = (f: File) => {
    const maxBytes = 500 * 1024 * 1024 // 500MB client-side
    if (f.size > maxBytes) { setError('File too large. Max 500MB.'); return }
    setError(null)
    setVideoFile(f)
    setVideoUrl(URL.createObjectURL(f))
    setDownloadUrl(null)
    setCaptions([])
    setStep('upload')
  }

  // ── Transcribe ─────────────────────────────────────────────────────────────
  const transcribe = async () => {
    if (!videoFile) return
    setStep('transcribing')
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', videoFile)
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Transcription failed')

      const caps: Caption[] = data.captions.map((c: any, i: number) => ({
        id: `cap-${i}`,
        text: c.text,
        start: c.start,
        end: c.end,
      }))
      setCaptions(caps)
      setStep('edit')
    } catch (e: any) {
      setError(e.message)
      setStep('upload')
    }
  }

  // ── Caption editing ────────────────────────────────────────────────────────
  const updateCaption = (id: string, text: string) => {
    setCaptions(prev => prev.map(c => c.id === id ? { ...c, text } : c))
  }

  // ── Export with FFmpeg.wasm ────────────────────────────────────────────────
  const exportVideo = async () => {
    if (!videoFile || !captions.length) return
    setStep('exporting')
    setExportProgress(5)

    try {
      // Dynamically load ffmpeg to keep bundle small
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

      const ffmpeg = new FFmpeg()
      ffmpeg.on('progress', ({ progress }) => setExportProgress(Math.round(progress * 100)))

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      setExportProgress(20)

      // Write the input video
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))

      // Build ASS subtitle file for styled captions
      const assContent = buildASSFile(captions, style)
      const assBlob = new Blob([assContent], { type: 'text/plain' })
      await ffmpeg.writeFile('captions.ass', await fetchFile(assBlob))

      setExportProgress(40)

      // Burn captions into video
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'ass=captions.ass',
        '-c:a', 'copy',
        '-preset', 'ultrafast',
        'output.mp4'
      ])

      setExportProgress(90)

      const outputData = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([outputData], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setExportProgress(100)
    } catch (e: any) {
      setError('Export failed: ' + e.message)
      setStep('edit')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (step === 'upload') {
    return <UploadStep
      videoUrl={videoUrl}
      videoFile={videoFile}
      onUpload={handleUpload}
      onTranscribe={transcribe}
      error={error}
    />
  }

  if (step === 'transcribing') {
    return <TranscribingStep />
  }

  return (
    <main style={{ padding: '2rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      <BackButton />
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-1px' }}>
        ✨ AI Auto-Caption Editor
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Edit captions, style them, preview on platforms, and export.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        {/* ── LEFT: Preview ── */}
        <div>
          <PlatformPicker platform={platform} onChange={setPlatform} />
          <VideoPreview
            videoUrl={videoUrl!}
            videoRef={videoRef}
            canvasRef={canvasRef}
            captions={captions}
            style={style}
            platform={platform}
            currentTime={currentTime}
          />

          {/* Export bar */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            {step !== 'exporting' && !downloadUrl && (
              <button onClick={exportVideo} className="btn-primary" style={{ flex: 1, height: '3rem' }}>
                🎬 Export Video with Captions
              </button>
            )}
            {step === 'exporting' && (
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: `${exportProgress}%`, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                  Exporting… {exportProgress}%
                </p>
              </div>
            )}
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`captioned-${videoFile?.name}`}
                className="btn-primary"
                style={{ flex: 1, height: '3rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ⬇️ Download Captioned Video
              </a>
            )}
            <button
              onClick={() => { setStep('upload'); setVideoFile(null); setVideoUrl(null); setDownloadUrl(null); setCaptions([]) }}
              style={{ padding: '0 1.5rem', height: '3rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Start Over
            </button>
          </div>
        </div>

        {/* ── RIGHT: Editor Panel ── */}
        <div>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {(['captions', 'styles'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, height: '2.5rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', border: '1px solid var(--border-color)',
                background: activeTab === tab ? 'var(--accent)' : 'var(--bg-secondary)',
                color: activeTab === tab ? '#fff' : 'var(--text-primary)',
                transition: 'all 0.2s'
              }}>
                {tab === 'captions' ? '📝 Edit Captions' : '🎨 Edit Styles'}
              </button>
            ))}
          </div>

          {activeTab === 'captions' && (
            <CaptionList
              captions={captions}
              currentTime={currentTime}
              onUpdate={updateCaption}
              onSeek={t => { if (videoRef.current) videoRef.current.currentTime = t }}
            />
          )}

          {activeTab === 'styles' && (
            <StyleEditor style={style} onChange={setStyle} />
          )}
        </div>
      </div>
    </main>
  )
}

// ─── Upload Step ──────────────────────────────────────────────────────────────
function UploadStep({ videoUrl, videoFile, onUpload, onTranscribe, error }: any) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) onUpload(f)
  }

  return (
    <main className="container" style={{ padding: '4rem 0', maxWidth: '700px' }}>
      <BackButton />
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨🎬</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px' }}>AI Auto-Caption</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
          Upload a video → AI generates captions → Edit styles → Download
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
          {['🎵 TikTok', '📸 Instagram', '▶ YouTube'].map(p => (
            <span key={p} style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '0.3rem 0.9rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600 }}>{p}</span>
          ))}
        </div>
      </header>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
        {!videoFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => document.getElementById('caption-video-input')?.click()}
            style={{ border: '2px dashed var(--border-color)', borderRadius: '16px', padding: '3rem 2rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Drop your video here or click to browse</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>MP4, MOV, WebM · Max 5 minutes for free</p>
            <input id="caption-video-input" type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
          </div>
        ) : (
          <div>
            <video src={videoUrl} controls style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', background: '#000', marginBottom: '1.5rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🎞️</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{videoFile.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button onClick={() => onUpload(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Change</button>
            </div>
            <button onClick={onTranscribe} className="btn-primary" style={{ width: '100%', height: '3.5rem', fontSize: '1rem' }}>
              ✨ Generate AI Captions
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
              Powered by Google Gemini · Supports 30+ languages
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        {[
          { icon: '🎙️', title: 'AI Transcription', desc: 'Google Gemini reads your video audio' },
          { icon: '🎨', title: 'Style Editor', desc: 'Fonts, colors, animations, positioning' },
          { icon: '📤', title: 'Export & Download', desc: 'Captions burned into the final video' },
        ].map(f => (
          <div key={f.title} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{f.icon}</div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.title}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

// ─── Transcribing Step ────────────────────────────────────────────────────────
function TranscribingStep() {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(i)
  }, [])

  return (
    <main className="container" style={{ padding: '6rem 0', maxWidth: '600px', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>🎙️</div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>AI is Listening{dots}</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '1rem' }}>
        Google Gemini is transcribing your video. This can take 30–60 seconds.
      </p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: '8px', height: '32px', borderRadius: '4px', background: 'var(--accent)',
            animation: `wave 1.2s ease-in-out ${i * 0.1}s infinite`
          }} />
        ))}
      </div>
      <style>{`
        @keyframes wave { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  )
}

// ─── Platform Picker ──────────────────────────────────────────────────────────
function PlatformPicker({ platform, onChange }: { platform: Platform, onChange: (p: Platform) => void }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
      {PLATFORMS.map(p => (
        <button key={p.key} onClick={() => onChange(p.key as Platform)} style={{
          flex: 1, padding: '0.5rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
          border: '1px solid var(--border-color)',
          background: platform === p.key ? 'var(--accent)' : 'var(--bg-secondary)',
          color: platform === p.key ? '#fff' : 'var(--text-primary)',
          transition: 'all 0.2s'
        }}>
          {p.icon} {p.label}
        </button>
      ))}
    </div>
  )
}

// ─── Video Preview ────────────────────────────────────────────────────────────
function VideoPreview({ videoUrl, videoRef, canvasRef, captions, style, platform, currentTime }: any) {
  const platformConfig = PLATFORMS.find(p => p.key === platform)
  const activeCaption = captions.find((c: Caption) => currentTime >= c.start && currentTime <= c.end)

  return (
    <div style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Platform overlay frame */}
      {platform !== 'none' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          <PlatformFrame platform={platform} />
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        controls
        style={{ width: '100%', display: 'block', maxHeight: '420px', objectFit: 'contain' }}
      />

      {/* Caption overlay on video */}
      {activeCaption && (
        <div style={{
          position: 'absolute',
          bottom: style.position === 'bottom' ? '60px' : style.position === 'center' ? '50%' : 'auto',
          top: style.position === 'top' ? '20px' : 'auto',
          left: '50%',
          transform: style.position === 'center' ? 'translate(-50%, 50%)' : 'translateX(-50%)',
          zIndex: 20,
          textAlign: 'center',
          maxWidth: '90%',
          padding: '0.4rem 0.8rem',
          backgroundColor: `${style.bgColor}${Math.round(style.bgOpacity * 255).toString(16).padStart(2, '0')}`,
          borderRadius: '6px',
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize}px`,
          fontWeight: style.bold ? 800 : 400,
          color: style.color,
          textShadow: style.outline ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' : 'none',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {activeCaption.text}
        </div>
      )}

      {/* Hidden canvas for export reference */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

// ─── Platform frame overlays ──────────────────────────────────────────────────
function PlatformFrame({ platform }: { platform: Platform }) {
  if (platform === 'tiktok') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.3) 100%)' }}>
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          {[['❤️', '1.2M'], ['💬', '1.2K'], ['↗️', '150K']].map(([icon, count]) => (
            <div key={count} style={{ textAlign: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
              <div style={{ fontSize: '1.5rem' }}>{icon}</div>
              <div>{count}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '60px', left: '10px', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
          <div>@yourchannel</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Original Audio ♫</div>
        </div>
        <div style={{ position: 'absolute', bottom: '0', left: 0, right: 0, background: '#000', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', color: '#fff', fontSize: '0.65rem' }}>
          {['🏠', '🔍', '➕', '💬', '👤'].map(icon => <span key={icon} style={{ fontSize: '1.2rem' }}>{icon}</span>)}
        </div>
      </div>
    )
  }

  if (platform === 'instagram') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#888' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>yourchannel</span>
        </div>
        <div style={{ position: 'absolute', bottom: '0', left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '8px 12px', display: 'flex', gap: '1.5rem', color: '#fff' }}>
          {['❤️', '💬', '✈️'].map(icon => <span key={icon} style={{ fontSize: '1.3rem' }}>{icon}</span>)}
          <span style={{ marginLeft: 'auto', fontSize: '1.3rem' }}>🔖</span>
        </div>
      </div>
    )
  }

  if (platform === 'youtube') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', bottom: '35px', left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.3)' }}>
          <div style={{ width: '45%', height: '100%', background: '#ff0000' }} />
        </div>
        <div style={{ position: 'absolute', bottom: '0', left: 0, right: 0, background: 'rgba(0,0,0,0.8)', height: '32px', display: 'flex', alignItems: 'center', padding: '0 8px', gap: '8px', color: '#fff', fontSize: '0.75rem' }}>
          <span>▶</span><span>1:10</span>
          <div style={{ flex: 1 }} />
          <span>CC</span><span>⚙️</span><span style={{ fontSize: '0.9rem' }}>⛶</span>
        </div>
        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
          <span style={{ background: '#ff0000', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>LIVE</span>
        </div>
      </div>
    )
  }

  return null
}

// ─── Caption List ─────────────────────────────────────────────────────────────
function CaptionList({ captions, currentTime, onUpdate, onSeek }: {
  captions: Caption[]
  currentTime: number
  onUpdate: (id: string, text: string) => void
  onSeek: (t: number) => void
}) {
  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {captions.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No captions generated yet.</p>
      )}
      {captions.map(cap => {
        const isActive = currentTime >= cap.start && currentTime <= cap.end
        return (
          <div
            key={cap.id}
            onClick={() => onSeek(cap.start)}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-color)'}`,
              background: isActive ? 'var(--accent-light)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {formatTime(cap.start)} → {formatTime(cap.end)}
              </span>
              {isActive && <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>● LIVE</span>}
            </div>
            <textarea
              value={cap.text}
              onChange={e => { e.stopPropagation(); onUpdate(cap.id, e.target.value) }}
              onClick={e => e.stopPropagation()}
              rows={2}
              style={{
                width: '100%', resize: 'none', background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Style Editor ────────────────────────────────────────────────────────────
function StyleEditor({ style, onChange }: { style: CaptionStyle, onChange: (s: CaptionStyle) => void }) {
  const set = (key: keyof CaptionStyle, val: any) => onChange({ ...style, [key]: val })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Section label="Font">
        <select value={style.fontFamily} onChange={e => set('fontFamily', e.target.value)} style={selectStyle}>
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Section>

      <Section label={`Font Size: ${style.fontSize}px`}>
        <input type="range" min={16} max={60} value={style.fontSize} onChange={e => set('fontSize', +e.target.value)} style={{ width: '100%' }} />
      </Section>

      <Section label="Text Color">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="color" value={style.color} onChange={e => set('color', e.target.value)} style={{ width: '40px', height: '32px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{style.color}</span>
        </div>
      </Section>

      <Section label="Background Color">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="color" value={style.bgColor} onChange={e => set('bgColor', e.target.value)} style={{ width: '40px', height: '32px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{style.bgColor}</span>
        </div>
      </Section>

      <Section label={`Background Opacity: ${Math.round(style.bgOpacity * 100)}%`}>
        <input type="range" min={0} max={1} step={0.05} value={style.bgOpacity} onChange={e => set('bgOpacity', +e.target.value)} style={{ width: '100%' }} />
      </Section>

      <Section label="Position">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['top', 'center', 'bottom'].map(pos => (
            <button key={pos} onClick={() => set('position', pos)} style={{
              flex: 1, height: '2rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              border: '1px solid var(--border-color)',
              background: style.position === pos ? 'var(--accent)' : 'var(--bg-secondary)',
              color: style.position === pos ? '#fff' : 'var(--text-primary)',
            }}>
              {pos.charAt(0).toUpperCase() + pos.slice(1)}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Options">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={style.bold} onChange={e => set('bold', e.target.checked)} /> Bold Text
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          <input type="checkbox" checked={style.outline} onChange={e => set('outline', e.target.checked)} /> Text Outline (Shadow)
        </label>
      </Section>

      {/* Preview */}
      <div style={{ padding: '1rem', background: '#000', borderRadius: '8px', textAlign: 'center' }}>
        <span style={{
          fontFamily: style.fontFamily,
          fontSize: `${Math.min(style.fontSize, 28)}px`,
          fontWeight: style.bold ? 800 : 400,
          color: style.color,
          backgroundColor: `${style.bgColor}${Math.round(style.bgOpacity * 255).toString(16).padStart(2, '0')}`,
          padding: '4px 10px',
          borderRadius: '4px',
          textShadow: style.outline ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' : 'none',
        }}>
          Sample Caption Text
        </span>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = (s % 60).toFixed(1)
  return `${m}:${sec.padStart(4, '0')}`
}

function drawCaption(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, style: CaptionStyle) {
  const fSize = style.fontSize * (w / 640)
  ctx.font = `${style.bold ? 800 : 400} ${fSize}px ${style.fontFamily}`
  ctx.textAlign = 'center'

  const y = style.position === 'bottom' ? h - 60 : style.position === 'center' ? h / 2 : 60
  const metrics = ctx.measureText(text)
  const padding = 12

  // Background
  const hex = style.bgColor
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  ctx.fillStyle = `rgba(${r},${g},${b},${style.bgOpacity})`
  ctx.fillRect(w / 2 - metrics.width / 2 - padding, y - fSize - padding / 2, metrics.width + padding * 2, fSize + padding)

  // Text
  if (style.outline) {
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3
    ctx.strokeText(text, w / 2, y)
  }
  ctx.fillStyle = style.color
  ctx.fillText(text, w / 2, y)
}

// Build a basic ASS subtitle file
function buildASSFile(captions: Caption[], style: CaptionStyle): string {
  const hexToDecBGR = (hex: string) => {
    const r = hex.slice(1, 3); const g = hex.slice(3, 5); const b = hex.slice(5, 7)
    return `00${b}${g}${r}`.toUpperCase()
  }

  const pos = style.position === 'bottom' ? 2 : style.position === 'center' ? 5 : 8
  const alpha = Math.round((1 - style.bgOpacity) * 255).toString(16).padStart(2, '0').toUpperCase()

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize * 2},&H00${hexToDecBGR(style.color)},&H000000FF,&H00000000,&H${alpha}${hexToDecBGR(style.bgColor)},${style.bold ? '-1' : '0'},0,0,0,100,100,0,0,1,${style.outline ? '2' : '0'},1,${pos},60,60,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = (s % 60).toFixed(2)
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(5, '0')}`
  }

  const events = captions.map(c =>
    `Dialogue: 0,${fmtTime(c.start)},${fmtTime(c.end)},Default,,0,0,0,,${c.text}`
  ).join('\n')

  return header + events
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem'
}
