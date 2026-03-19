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
  textColor: string
  highlightColor: string
  bgColor: string
  bgOpacity: number
  bold: boolean
  position: 'bottom' | 'center' | 'top'
  outline: boolean
  colorStyle: 'uniform' | 'first' | 'random' | 'alternate'
  animation: 'none' | 'fade' | 'pop' | 'slide'
}

const FONTS = ['Impact', 'Arial', 'Verdana', 'Georgia', 'Trebuchet MS']

const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: 'Impact',
  fontSize: 30,
  textColor: '#ffffff',
  highlightColor: '#f9c22e',
  bgColor: '#000000',
  bgOpacity: 0.55,
  bold: true,
  position: 'bottom',
  outline: true,
  colorStyle: 'first',
  animation: 'none',
}

const PRESETS: { name: string; style: CaptionStyle }[] = [
  { name: '📱 TikTok Pill', style: { ...DEFAULT_STYLE, fontFamily: 'Roboto', bgColor: '#000000', bgOpacity: 0.55, outline: false, animation: 'pop', textColor: '#ffffff', highlightColor: '#f9c22e', fontSize: 26, bold: true, colorStyle: 'first', position: 'bottom' } },
  { name: '🔥 Hype Beast', style: { ...DEFAULT_STYLE, fontFamily: 'Impact', bgColor: '#000000', bgOpacity: 0, outline: true, animation: 'pop', textColor: '#ffffff', highlightColor: '#ffd700', fontSize: 44, bold: true, colorStyle: 'random', position: 'center' } },
  { name: '✨ LinkedIn Pro', style: { ...DEFAULT_STYLE, fontFamily: 'Arial', bgColor: '#000000', bgOpacity: 0, outline: true, animation: 'slide', textColor: '#ffffff', highlightColor: '#60a5fa', fontSize: 28, bold: true, colorStyle: 'first', position: 'bottom' } },
  { name: '🎬 Cinematic', style: { ...DEFAULT_STYLE, fontFamily: 'Georgia', bgColor: '#000000', bgOpacity: 0, outline: true, animation: 'fade', textColor: '#ffffff', highlightColor: '#ffffff', fontSize: 28, bold: false, colorStyle: 'uniform', position: 'bottom' } },
  { name: '💥 Blockbuster', style: { ...DEFAULT_STYLE, fontFamily: 'Impact', bgColor: '#000000', bgOpacity: 0, outline: true, animation: 'pop', textColor: '#ffffff', highlightColor: '#ff0000', fontSize: 38, bold: true, colorStyle: 'alternate', position: 'bottom' } },
  { name: '📺 Standard CC', style: { ...DEFAULT_STYLE, fontFamily: 'Arial', bgColor: '#000000', bgOpacity: 0.8, outline: false, animation: 'none', textColor: '#ffffff', highlightColor: '#ffffff', fontSize: 18, bold: false, colorStyle: 'uniform', position: 'bottom' } },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AutoCaption() {
  const [step, setStep] = useState<'upload' | 'extracting' | 'transcribing' | 'edit' | 'exporting'>('upload')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [captions, setCaptions] = useState<Caption[]>([])
  const [style, setStyle] = useState<CaptionStyle>(DEFAULT_STYLE)
  const [activeTab, setActiveTab] = useState<'captions' | 'styles'>('captions')
  const [exportProgress, setExportProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [])

  // ── Video timeupdate listener ──────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'edit') return
    const timer = setTimeout(() => {
      const video = videoRef.current
      if (!video) return
      const handleTime = () => setCurrentTime(video.currentTime)
      video.addEventListener('timeupdate', handleTime)
      return () => video.removeEventListener('timeupdate', handleTime)
    }, 150)
    return () => clearTimeout(timer)
  }, [step])

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = (f: File | null) => {
    if (!f) { setVideoFile(null); setVideoUrl(null); return }
    setError(null)
    setVideoFile(f)
    setVideoUrl(URL.createObjectURL(f))
    setDownloadUrl(null)
    setCaptions([])
  }

  // ── 1. Extract audio using decodeAudioData (reads entire file) ────────────
  const extractAudioWav = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer()
    const audioCtx = new AudioContext()
    const decoded = await audioCtx.decodeAudioData(arrayBuffer)
    await audioCtx.close()

    // Re-render as 16kHz mono for tiny file size (~2MB / 2 min)
    const sampleRate = 16000
    const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * sampleRate), sampleRate)
    const source = offlineCtx.createBufferSource()
    source.buffer = decoded
    source.connect(offlineCtx.destination)
    source.start(0)
    const rendered = await offlineCtx.startRendering()

    // Encode to WAV
    const samples = rendered.getChannelData(0)
    const buf = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buf)
    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
    ws(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true)
    ws(8, 'WAVE'); ws(12, 'fmt ')
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true); view.setUint16(34, 16, true)
    ws(36, 'data'); view.setUint32(40, samples.length * 2, true)
    let off = 44
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); off += 2
    }
    return new Blob([buf], { type: 'audio/wav' })
  }

  // ── 2. Transcribe with Whisper via Replicate ───────────────────────────────
  const transcribe = async () => {
    if (!videoFile) return
    setError(null)

    try {
      setStep('extracting')
      const audioBlob = await extractAudioWav(videoFile)

      setStep('transcribing')
      const fd = new FormData()
      fd.append('file', audioBlob, 'audio.wav')
      const res = await fetch('/api/whisper', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Transcription failed')

      const caps: Caption[] = data.captions.map((c: any, i: number) => ({
        id: `cap-${i}`, text: c.text, start: c.start, end: c.end
      }))
      setCaptions(caps)
      setStep('edit')
    } catch (e: any) {
      setError(e.message)
      setStep('upload')
    }
  }

  // ── Caption editing ────────────────────────────────────────────────────────
  const updateCaption = (id: string, text: string) =>
    setCaptions(prev => prev.map(c => c.id === id ? { ...c, text } : c))

  // ── Export with FFmpeg.wasm ────────────────────────────────────────────────
  const exportVideo = async () => {
    if (!videoFile || !captions.length) return
    setStep('exporting'); setExportProgress(5)
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      ffmpeg.on('progress', ({ progress }) => setExportProgress(Math.round(progress * 100)))
      const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      setExportProgress(20)
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))
      
      // Download a standard bold font so ffmpeg.wasm can render subtitles
      await ffmpeg.writeFile('Roboto-Bold.ttf', await fetchFile('https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf'))
      
      const assStyleOverride = { ...style, fontFamily: 'Roboto' }
      const assBlob = new Blob([buildASS(captions, assStyleOverride)], { type: 'text/plain' })
      await ffmpeg.writeFile('caps.ass', await fetchFile(assBlob))
      setExportProgress(40)
      
      const code = await ffmpeg.exec(['-i', 'input.mp4', '-vf', 'ass=caps.ass:fontsdir=.', '-c:a', 'copy', '-preset', 'ultrafast', 'output.mp4'])
      if (code !== 0) throw new Error('FFmpeg processing failed.')
      
      setExportProgress(90)
      const out = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([out as unknown as BlobPart], { type: 'video/mp4' })
      setDownloadUrl(URL.createObjectURL(blob))
      setExportProgress(100)
      setStep('edit')
    } catch (e: any) {
      setError('Export failed: ' + e.message); setStep('edit')
    }
  }

  // ── Active caption resolve ─────────────────────────────────────────────────
  const activeCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end) || null

  // ── Loading screens ────────────────────────────────────────────────────────
  if (step === 'upload') {
    return <UploadStep videoUrl={videoUrl} videoFile={videoFile} onUpload={handleUpload} onTranscribe={transcribe} error={error} />
  }
  if (step === 'extracting' || step === 'transcribing') {
    return <LoadingStep stage={step} />
  }

  // ── Edit View ──────────────────────────────────────────────────────────────
  return (
    <main style={{ padding: '1.5rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      <BackButton />
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
        ✨ AI Auto-Caption Editor
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Edit captions, style them, then export.
      </p>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</div>}

      {/* ── Main Layout: Video | Editor ── */}
      <div className="caption-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── LEFT: Video Preview ── */}
        <div>
          <div style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
            <video ref={videoRef} src={videoUrl!} controls style={{ width: '100%', display: 'block', maxHeight: '420px', objectFit: 'contain' }} />
            {/* Caption overlay */}
            {captions.length > 0 && activeCaption && (
              <CaptionOverlay caption={activeCaption} style={style} videoRef={videoRef} />
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Export Row */}
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
            {step !== 'exporting' && !downloadUrl && (
              <button onClick={exportVideo} className="btn-primary" style={{ flex: 1, height: '2.75rem', fontSize: '0.9rem' }}>
                🎬 Export with Captions
              </button>
            )}
            {step === 'exporting' && (
              <div style={{ flex: 1 }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: `${exportProgress}%`, transition: 'width 0.3s ease' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', textAlign: 'center' }}>Exporting… {exportProgress}%</p>
              </div>
            )}
            {downloadUrl && (
              <a href={downloadUrl} download={`captioned-${videoFile?.name}`} className="btn-primary"
                style={{ flex: 1, height: '2.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                ⬇️ Download Video
              </a>
            )}
            <button onClick={() => { setStep('upload'); setVideoFile(null); setVideoUrl(null); setDownloadUrl(null); setCaptions([]) }}
              style={{ padding: '0 1.25rem', height: '2.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              ↺ Start Over
            </button>
          </div>
        </div>

        {/* ── RIGHT: Editor Panel ── */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
            {(['captions', 'styles'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, height: '2.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                border: '1px solid var(--border-color)',
                background: activeTab === tab ? 'var(--accent)' : 'var(--bg-secondary)',
                color: activeTab === tab ? '#fff' : 'var(--text-primary)',
                transition: 'all 0.2s'
              }}>
                {tab === 'captions' ? '📝 Edit Captions' : '🎨 Edit Styles'}
              </button>
            ))}
          </div>

          {activeTab === 'captions' && (
            <CaptionCarousel
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

      <style>{`
        @media (max-width: 768px) {
          .caption-layout { grid-template-columns: 1fr !important; }
        }
        @keyframes capPop { 
          0% { transform: scale(0.4); opacity: 0; } 
          50% { transform: scale(1.15); opacity: 1; } 
          100% { transform: scale(1); opacity: 1; } 
        }
        @keyframes capFade { 
          0% { opacity: 0; transform: scale(0.92); } 
          100% { opacity: 1; transform: scale(1); } 
        }
        @keyframes capSlide { 
          0% { transform: translateY(25px); opacity: 0; } 
          100% { transform: translateY(0); opacity: 1; } 
        }
      `}</style>
    </main>
  )
}

// ─── Caption Overlay on Video ─────────────────────────────────────────────────
function CaptionOverlay({ caption, style, videoRef }: { caption: Caption; style: CaptionStyle; videoRef?: React.RefObject<HTMLVideoElement> }) {
  const [scale, setScale] = useState(1);
  const [vidRect, setVidRect] = useState({ top: 0, height: '100%' });

  // Calculate pixel-perfect scale matching FFmpeg PlayResY=720 mapping
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const updateScale = () => {
      const { videoWidth, videoHeight, offsetWidth, offsetHeight } = video;
      if (!videoWidth || !videoHeight || !offsetWidth) return;

      const videoRatio = videoWidth / videoHeight;
      const boxRatio = offsetWidth / offsetHeight;

      let actualHeight;
      // Is video letterboxed or pillarboxed?
      if (boxRatio > videoRatio) {
        // Pillarbox: touches top/bottom
        actualHeight = offsetHeight;
        setVidRect({ top: 0, height: `${offsetHeight}px` });
      } else {
        // Letterbox: touches sides, black bars top/bottom
        actualHeight = offsetWidth / videoRatio;
        setVidRect({ top: (offsetHeight - actualHeight) / 2, height: `${actualHeight}px` });
      }

      // In FFmpeg, PlayResY is 720 and ASS fontSize is (style.fontSize * 2).
      // Target screen size = (fontSize * 2) * (actualHeight / 720) = fontSize * (actualHeight / 360)
      setScale(actualHeight / 360);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    let observer: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      observer = new ResizeObserver(updateScale);
      observer.observe(video);
    }
    video.addEventListener('loadedmetadata', updateScale);

    return () => {
      window.removeEventListener('resize', updateScale);
      if (observer) observer.disconnect();
      video.removeEventListener('loadedmetadata', updateScale);
    };
  }, [videoRef]);

  const words = caption.text.split(' ')

  // Inner wrapper snapping exactly to the visible video area
  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    width: '100%',
    top: vidRect.top,
    height: vidRect.height,
    pointerEvents: 'none',
    zIndex: 20,
    overflow: 'hidden'
  };

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    ...(style.position === 'bottom' ? { bottom: `${40 * (scale / 2)}px` } :
       style.position === 'top' ? { top: `${40 * (scale / 2)}px` } :
       { top: '50%', transform: 'translate(-50%, -50%)' }),
    textAlign: 'center',
    maxWidth: '88%',
    padding: `${0.2 * scale}rem ${0.45 * scale}rem`,
    backgroundColor: `${style.bgColor}${Math.round(style.bgOpacity * 255).toString(16).padStart(2, '0')}`,
    borderRadius: `${8 * (scale / 2)}px`,
    fontFamily: style.fontFamily,
    fontSize: Math.max(8, style.fontSize * scale) + 'px',
    fontWeight: style.bold ? 800 : 400,
    textShadow: style.outline ? `${1.5 * scale}px ${1.5 * scale}px 0 #000, -${1.5 * scale}px -${1.5 * scale}px 0 #000, ${1.5 * scale}px -${1.5 * scale}px 0 #000, -${1.5 * scale}px ${1.5 * scale}px 0 #000` : 'none',
    lineHeight: 1.3,
    userSelect: 'none',
    whiteSpace: 'pre-wrap',
  }

  const animKeyframe = style.animation === 'pop' ? 'capPop' : style.animation === 'fade' ? 'capFade' : style.animation === 'slide' ? 'capSlide' : 'none'
  const animDur = style.animation === 'fade' ? '0.25s' : '0.2s'

  const renderText = () => {
    const cs = style.colorStyle || ((style as any).highlightFirst ? 'first' : 'uniform')
    if (cs === 'uniform' || words.length <= 1) return <span style={{ color: style.textColor }}>{caption.text}</span>
    if (cs === 'first') return <span><span style={{ color: style.highlightColor }}>{words[0]}</span>{' '}<span style={{ color: style.textColor }}>{words.slice(1).join(' ')}</span></span>
    if (cs === 'alternate') return <span>{words.map((w, i) => <span key={i} style={{ color: i % 2 === 0 ? style.highlightColor : style.textColor }}>{w}{i < words.length - 1 ? ' ' : ''}</span>)}</span>
    if (cs === 'random') {
      const hlIdx = caption.text.length % words.length
      return <span>{words.map((w, i) => <span key={i} style={{ color: i === hlIdx ? style.highlightColor : style.textColor }}>{w}{i < words.length - 1 ? ' ' : ''}</span>)}</span>
    }
  }

  return (
    <div style={wrapperStyle}>
      <div style={posStyle}>
        <div key={caption.id} style={{ animation: `${animKeyframe} ${animDur} ease-out forwards` }}>
          {renderText()}
        </div>
      </div>
    </div>
  )
}

// ─── 5-Bubble Caption Carousel ────────────────────────────────────────────────
function CaptionCarousel({ captions, currentTime, onUpdate, onSeek }: {
  captions: Caption[]
  currentTime: number
  onUpdate: (id: string, text: string) => void
  onSeek: (t: number) => void
}) {
  const activeIdx = captions.findIndex(c => currentTime >= c.start && currentTime <= c.end)
  
  let idx = activeIdx
  if (idx === -1) {
    let minDiff = Infinity
    captions.forEach((c, i) => {
      const diff = Math.min(Math.abs(currentTime - c.start), Math.abs(currentTime - c.end))
      if (diff < minDiff) { minDiff = diff; idx = i }
    })
    if (idx === -1 && captions.length > 0) idx = 0
  }

  // Get 5 items: [idx-2, idx-1, idx, idx+1, idx+2]
  const slots = [-2, -1, 0, 1, 2].map(offset => {
    const i = idx + offset
    return i >= 0 && i < captions.length ? { cap: captions[i], offset } : null
  })

  const bubbleStyle = (offset: number): React.CSSProperties => {
    const isActive = offset === 0
    const abs = Math.abs(offset)
    return {
      padding: isActive ? '0.85rem 1rem' : '0.6rem 1rem',
      borderRadius: '12px',
      border: isActive ? '2px solid var(--accent)' : '1px solid var(--border-color)',
      background: isActive ? 'var(--accent-light)' : 'var(--bg-secondary)',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      opacity: abs === 0 ? 1 : abs === 1 ? 0.65 : 0.35,
      transform: isActive ? 'scale(1.02)' : 'scale(1)',
      userSelect: 'none',
    }
  }

  if (captions.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>No captions yet.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {/* Scroll info */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.25rem' }}>
        {captions.length} captions · Click any to seek · Edit to change text
      </p>

      {slots.map((slot, i) => {
        if (!slot) return (
          <div key={i} style={{ height: slot === null && i === 0 || i === 4 ? '56px' : '48px', opacity: 0 }} />
        )
        const { cap, offset } = slot
        const isActive = offset === 0
        return (
          <div key={cap.id} onClick={() => onSeek(cap.start)} style={bubbleStyle(offset)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {fmt(cap.start)} → {fmt(cap.end)}
              </span>
              {isActive && (
                <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: '999px', fontWeight: 700 }}>
                  ● LIVE
                </span>
              )}
            </div>
            <textarea
              value={cap.text}
              onChange={e => { e.stopPropagation(); onUpdate(cap.id, e.target.value) }}
              onClick={e => e.stopPropagation()}
              rows={isActive ? 2 : 1}
              style={{
                width: '100%', resize: 'none', background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'inherit', fontSize: isActive ? '1rem' : '0.85rem',
                fontWeight: isActive ? 800 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                lineHeight: 1.35, cursor: 'text'
              }}
            />
          </div>
        )
      })}

      {/* Full scrollable list below */}
      <details style={{ marginTop: '0.75rem' }}>
        <summary style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none', padding: '0.4rem 0' }}>
          View all {captions.length} captions ▾
        </summary>
        <div style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {captions.map((cap, i) => {
            const isActive = currentTime >= cap.start && currentTime <= cap.end
            return (
              <div key={cap.id} onClick={() => onSeek(cap.start)} style={{
                padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-color)'}`,
                background: isActive ? 'var(--accent-light)' : 'transparent',
                fontSize: '0.82rem', fontWeight: isActive ? 700 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                display: 'flex', gap: '0.75rem', alignItems: 'center'
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', minWidth: '55px' }}>{fmt(cap.start)}</span>
                <span>{cap.text}</span>
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}

// ─── Upload Step ──────────────────────────────────────────────────────────────
function UploadStep({ videoUrl, videoFile, onUpload, onTranscribe, error }: any) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('video/')) onUpload(f)
  }
  return (
    <main className="container" style={{ padding: '4rem 0', maxWidth: '680px' }}>
      <BackButton />
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>✨🎬</div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-1.5px' }}>AI Auto-Caption</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
          Upload a video → AI transcribes every word → Edit styles → Download
        </p>
      </header>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</div>}

      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        {!videoFile ? (
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => document.getElementById('cap-input')?.click()}
            style={{ border: '2px dashed var(--border-color)', borderRadius: '14px', padding: '3rem 2rem', cursor: 'pointer' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📹</div>
            <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>Drop your video here or click to browse</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>MP4, MOV, WebM · Max 5 minutes</p>
            <input id="cap-input" type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
          </div>
        ) : (
          <div>
            <video src={videoUrl} controls style={{ width: '100%', borderRadius: '10px', maxHeight: '280px', background: '#000', marginBottom: '1.25rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.65rem 0.875rem', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <span style={{ fontSize: '1.25rem' }}>🎞️</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{videoFile.name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button onClick={() => onUpload(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>Change</button>
            </div>
            <button onClick={onTranscribe} className="btn-primary" style={{ width: '100%', height: '3.25rem', fontSize: '1rem' }}>
              ✨ Generate AI Captions
            </button>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.65rem' }}>
              Fast AI Transcription · Supports 30+ languages · ~1–2 min for long videos
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginTop: '1.5rem' }}>
        {[
          { icon: '🎙️', title: 'Smart Transcription', desc: 'Highly accurate speech-to-text engine' },
          { icon: '🎨', title: 'Style Editor', desc: 'Fonts, colors, multi-color captions' },
          { icon: '📤', title: 'Export Video', desc: 'Captions burned into final video' },
        ].map(f => (
          <div key={f.title} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{f.icon}</div>
            <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{f.title}</p>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

// ─── Loading Step ─────────────────────────────────────────────────────────────
function LoadingStep({ stage }: { stage: 'extracting' | 'transcribing' }) {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(i)
  }, [])

  return (
    <main className="container" style={{ padding: '6rem 0', maxWidth: '550px', textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>
        {stage === 'extracting' ? '🎵' : '🎙️'}
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
        {stage === 'extracting' ? `Reading audio${dots}` : `Transcribing every word${dots}`}
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.65rem', fontSize: '0.95rem' }}>
        {stage === 'extracting'
          ? 'Extracting audio from your video (this is fast!)…'
          : 'AI is processing your audio. This takes 30–90 seconds depending on video length.'}
      </p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: '7px', height: '28px', borderRadius: '4px', background: 'var(--accent)',
            animation: `wv 1.2s ease-in-out ${i * 0.12}s infinite`
          }} />
        ))}
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        {[
          { label: 'Extract Audio', done: true, active: stage === 'extracting' },
          { label: 'AI Transcribe', done: false, active: stage === 'transcribing' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', opacity: s.active || s.done ? 1 : 0.4 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem',
              background: s.active ? 'var(--accent)' : s.done ? '#22c55e' : 'var(--bg-secondary)',
              border: '2px solid var(--border-color)', color: s.active || s.done ? '#fff' : 'var(--text-secondary)' }}>
              {s.done && !s.active ? '✓' : i + 1}
            </div>
            <p style={{ fontSize: '0.75rem', fontWeight: s.active ? 700 : 400, color: s.active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.label}</p>
          </div>
        ))}
      </div>
      <style>{`@keyframes wv{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}`}</style>
    </main>
  )
}


// ─── Style Editor ────────────────────────────────────────────────────────────
function StyleEditor({ style, onChange }: { style: CaptionStyle; onChange: (s: CaptionStyle) => void }) {
  const set = (k: keyof CaptionStyle, v: any) => onChange({ ...style, [k]: v })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <Section label="One-Click Presets">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => onChange(p.style)} style={{
              padding: '0.6rem 0.25rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
            }}>{p.name}</button>
          ))}
        </div>
      </Section>
      <Section label="Animation Style">
        <select value={style.animation} onChange={e => set('animation', e.target.value as any)} style={sel}>
          <option value="none">None (Instant)</option>
          <option value="pop">Pop / Bounce</option>
          <option value="fade">Smooth Fade In</option>
          <option value="slide">Slide Up</option>
        </select>
      </Section>
      <Section label="Font">
        <select value={style.fontFamily} onChange={e => set('fontFamily', e.target.value)} style={sel}>
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Section>
      <Section label={`Size: ${style.fontSize}px`}>
        <input type="range" min={16} max={64} value={style.fontSize} onChange={e => set('fontSize', +e.target.value)} style={{ width: '100%' }} />
      </Section>
      <Section label="Highlight Style">
        <select value={style.colorStyle || 'first'} onChange={e => set('colorStyle', e.target.value as any)} style={sel}>
          <option value="uniform">Uniform Color</option>
          <option value="first">Highlight First Word</option>
          <option value="alternate">Alternating Colors</option>
          <option value="random">Random Mix</option>
        </select>
      </Section>
      <Section label="Text Color">
        <ColorRow color={style.textColor} onChange={v => set('textColor', v)} />
      </Section>
      <Section label="Highlight Color">
        <ColorRow color={style.highlightColor} onChange={v => set('highlightColor', v)} />
      </Section>
      <Section label="Background Style">
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <button onClick={() => set('bgOpacity', 0.55)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border-color)', background: style.bgOpacity > 0 ? 'var(--accent)' : 'var(--bg-secondary)', color: style.bgOpacity > 0 ? '#fff' : 'var(--text-primary)' }}>Solid Pill</button>
          <button onClick={() => set('bgOpacity', 0)} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border-color)', background: style.bgOpacity === 0 ? 'var(--accent)' : 'var(--bg-secondary)', color: style.bgOpacity === 0 ? '#fff' : 'var(--text-primary)' }}>Colorless</button>
        </div>
      </Section>
      
      {style.bgOpacity > 0 && (
        <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '-0.5rem' }}>
          <Section label="Pill Color">
            <ColorRow color={style.bgColor} onChange={v => set('bgColor', v)} />
          </Section>
          <Section label={`Pill Opacity: ${Math.round(style.bgOpacity * 100)}%`}>
            <input type="range" min={0.1} max={1} step={0.05} value={style.bgOpacity} onChange={e => set('bgOpacity', +e.target.value)} style={{ width: '100%' }} />
          </Section>
        </div>
      )}
      <Section label="Position">
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['top', 'center', 'bottom'] as const).map(p => (
            <button key={p} onClick={() => set('position', p)} style={{
              flex: 1, height: '1.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
              border: '1px solid var(--border-color)',
              background: style.position === p ? 'var(--accent)' : 'var(--bg-secondary)',
              color: style.position === p ? '#fff' : 'var(--text-primary)',
            }}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
      </Section>
      <Section label="Options">
        {[
          ['bold', 'Bold Text'],
          ['outline', 'Text Outline'],
        ].map(([k, label]) => (
          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.35rem' }}>
            <input type="checkbox" checked={style[k as keyof CaptionStyle] as boolean} onChange={e => set(k as keyof CaptionStyle, e.target.checked)} />
            {label}
          </label>
        ))}
      </Section>
      {/* Live preview */}
      <div style={{ padding: '0.875rem', background: '#111', borderRadius: '10px', textAlign: 'center' }}>
        <span style={{ backgroundColor: `${style.bgColor}${Math.round(style.bgOpacity * 255).toString(16).padStart(2, '0')}`, padding: '4px 12px', borderRadius: '6px', fontFamily: style.fontFamily, fontSize: `${Math.min(style.fontSize, 24)}px`, fontWeight: style.bold ? 800 : 400, textShadow: style.outline ? '1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000' : 'none' }}>
          {style.colorStyle === 'first' || (style as any).highlightFirst === true ? <><span style={{ color: style.highlightColor }}>Hello</span><span style={{ color: style.textColor }}> cool caption</span></>
            : style.colorStyle === 'alternate' ? <><span style={{ color: style.highlightColor }}>Hello</span> <span style={{ color: style.textColor }}>cool</span> <span style={{ color: style.highlightColor }}>caption</span></>
            : style.colorStyle === 'random' ? <><span style={{ color: style.textColor }}>Hello</span> <span style={{ color: style.highlightColor }}>cool</span> <span style={{ color: style.textColor }}>caption</span></>
            : <span style={{ color: style.textColor }}>Hello cool caption</span>}
        </span>
      </div>
    </div>
  )
}

function ColorRow({ color, onChange }: { color: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input type="color" value={color} onChange={e => onChange(e.target.value)} style={{ width: '36px', height: '28px', borderRadius: '5px', border: '1px solid var(--border-color)', cursor: 'pointer' }} />
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{color}</span>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s: number): string {
  const m = Math.floor(s / 60); const sec = (s % 60).toFixed(1)
  return `${m}:${sec.padStart(4, '0')}`
}

function buildASS(captions: Caption[], s: CaptionStyle): string {
  const bgr = (hex: string) => { 
    if (!hex) return 'FFFFFF'
    const r = hex.slice(1, 3), g = hex.slice(3, 5), b = hex.slice(5, 7)
    return `${b}${g}${r}`.toUpperCase() 
  }
  const pos = s.position === 'bottom' ? 2 : s.position === 'center' ? 5 : 8
  const alpha = Math.round((1 - s.bgOpacity) * 255).toString(16).padStart(2, '0').toUpperCase()
  
  // BorderStyle 3 = Opaque Box, 1 = Outline + Shadow
  const borderStyle = s.bgOpacity > 0 ? '3' : '1'
  const outline = s.bgOpacity > 0 ? '4' : (s.outline ? '2' : '0')

  const header = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,${s.fontFamily},${s.fontSize * 2},&H00${bgr(s.textColor)},&H000000FF,&H00000000,&H${alpha}${bgr(s.bgColor)},${s.bold ? '-1' : '0'},0,0,0,100,100,0,0,${borderStyle},${outline},0,${pos},60,60,40,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`
  
  const ft = (sec: number) => { 
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s2 = (sec % 60).toFixed(2)
    return `${h}:${String(m).padStart(2, '0')}:${String(s2).padStart(5, '0')}` 
  }

  const formatText = (text: string) => {
    let animTag = ''
    const anchorY = s.position === 'bottom' ? 680 : s.position === 'center' ? 360 : 40
    
    if (s.animation === 'fade') animTag = '{\\fad(250,0)\\fscx92\\fscy92\\t(0,250,\\fscx100\\fscy100)}' // Cinematic zoom fade
    else if (s.animation === 'pop') animTag = '{\\fscx40\\fscy40\\t(0,100,\\fscx115\\fscy115)\\t(100,200,\\fscx100\\fscy100)}' // Aggressive pop
    else if (s.animation === 'slide') animTag = `{\\move(640,${anchorY + 25},640,${anchorY},0,200)\\fad(150,0)}` // True literal slide up

    const cs = s.colorStyle || ((s as any).highlightFirst ? 'first' : 'uniform')
    if (cs === 'uniform') return animTag + text
    
    const words = text.split(' ')
    if (words.length <= 1) return `${animTag}{\\c&H${bgr(s.highlightColor)}&}${text}`
    
    if (cs === 'first') return `${animTag}{\\c&H${bgr(s.highlightColor)}&}${words[0]}{\\c&H${bgr(s.textColor)}&} ${words.slice(1).join(' ')}`
    if (cs === 'alternate') return animTag + words.map((w, i) => `{\\c&H${bgr(i % 2 === 0 ? s.highlightColor : s.textColor)}&}${w}`).join(' ')
    if (cs === 'random') {
      const hlIdx = text.length % words.length
      return animTag + words.map((w, i) => `{\\c&H${bgr(i === hlIdx ? s.highlightColor : s.textColor)}&}${w}`).join(' ')
    }
    return animTag + text
  }

  return header + captions.map(c => `Dialogue: 0,${ft(c.start)},${ft(c.end)},Default,,0,0,0,,${formatText(c.text)}`).join('\n')
}

const sel: React.CSSProperties = {
  width: '100%', padding: '0.45rem 0.5rem', borderRadius: '7px', border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem'
}
