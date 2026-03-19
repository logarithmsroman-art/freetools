'use client'

import { useState, useRef, useEffect } from 'react'
import BackButton from '@/components/BackButton'
import { trackToolUsage } from '@/components/AnalyticsTracker'

interface Segment {
  index: number
  startTime: number
  endTime: number
}

export default function VideoTrimmer() {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [splitPoints, setSplitPoints] = useState<number[]>([])
  const [exporting, setExporting] = useState<number | null>(null)
  const [exportProgress, setExportProgress] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Load video file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setSplitPoints([])
      setCurrentTime(0)
      return () => URL.revokeObjectURL(url)
    } else {
      setVideoUrl(null)
    }
  }, [file])

  // Track video time & metadata
  useEffect(() => {
    if (!videoRef.current) return
    const v = videoRef.current
    
    let animationFrameId: number
    const frameLoop = () => {
      if (v && !v.paused) {
        setCurrentTime(v.currentTime)
      }
      animationFrameId = requestAnimationFrame(frameLoop)
    }
    
    const handleLoadedMetadata = () => {
      setDuration(v.duration)
      setCurrentTime(v.currentTime)
    }
    
    // Fallback for manual seeks or paused state
    const handleSeeked = () => setCurrentTime(v.currentTime)
    
    v.addEventListener('loadedmetadata', handleLoadedMetadata)
    v.addEventListener('seeked', handleSeeked)
    v.addEventListener('play', () => {
      setIsPlaying(true)
      frameLoop()
    })
    v.addEventListener('pause', () => {
      setIsPlaying(false)
      cancelAnimationFrame(animationFrameId)
    })
    
    return () => {
      v.removeEventListener('loadedmetadata', handleLoadedMetadata)
      v.removeEventListener('seeked', handleSeeked)
      cancelAnimationFrame(animationFrameId)
    }
  }, [videoUrl])

  const addSplit = () => {
    if (!duration || !videoRef.current) return
    const t = videoRef.current.currentTime
    // Don't duplicate and don't add at exactly start/end
    if (splitPoints.includes(t) || t === 0 || t === duration) return
    setSplitPoints(prev => [...prev, t].sort((a, b) => a - b))
  }

  const removeSplit = (t: number) => {
    setSplitPoints(p => p.filter(x => x !== t))
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration || !videoRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const t = percentage * duration
    videoRef.current.currentTime = t
    setCurrentTime(t)
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play()
      else videoRef.current.pause()
    }
  }

  const segments: Segment[] = [0, ...splitPoints, duration].reduce((acc: Segment[], t, i, arr) => {
    if (i < arr.length - 1) acc.push({ index: i + 1, startTime: arr[i], endTime: arr[i + 1] })
    return acc
  }, [])

  const downloadSegment = async (seg: Segment) => {
    if (!file) return
    trackToolUsage('Video Clip Exported')
    setExporting(seg.index)
    setExportProgress(0)
    
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      
      ffmpeg.on('progress', ({ progress }) => {
        setExportProgress(Math.round(progress * 100))
      })

      const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      await ffmpeg.writeFile('input.mp4', await fetchFile(file))
      
      // Fast trim using `-c copy`. 
      // Accuracy is tied to keyframes. If they want exact frame accuracy, we'd remove `-c copy`, 
      // but re-encoding in WASM is extremely slow. We provide the fast cut version.
      const code = await ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', String(seg.startTime.toFixed(3)),
        '-to', String(seg.endTime.toFixed(3)),
        '-c', 'copy',
        'output.mp4'
      ])

      if (code !== 0) throw new Error('FFmpeg trimming failed')

      const out = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([out as unknown as BlobPart], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${file.name.split('.')[0]}_clip${seg.index}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert("Error trimming video: " + e.message)
    } finally {
      setExporting(null)
      setExportProgress(0)
    }
  }

  const fmt = (s: number) => {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "1000px" }}>
      <BackButton />
      
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Video Trimmer</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Split videos into clips and export them instantly.</p>
      </header>

      <div className="card" style={{ padding: "1.5rem" }}>
        {!file ? (
          <div
            onClick={() => document.getElementById('video-input-split')?.click()}
            style={{ height: "220px", border: "2px dashed var(--border-color)", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "var(--bg-secondary)", transition: "all 0.2s ease" }}
          >
            <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎞️</span>
            <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>Click to upload a video file</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>MP4, WebM, MOV supported</p>
            <input id="video-input-split" type="file" accept="video/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]) }}} />
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>{file.name}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  {splitPoints.length} cut{splitPoints.length !== 1 ? 's' : ''} → {segments.length} segment{segments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={() => setFile(null)} style={{ border: "1px solid var(--border-color)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600 }}>Change Video</button>
            </div>

            {/* Editor Layout: Player + Controls */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              
              {/* Video Player Box */}
              <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <video 
                  ref={videoRef} 
                  src={videoUrl!} 
                  onClick={togglePlay}
                  style={{ maxHeight: '450px', width: '100%', objectFit: 'contain', cursor: 'pointer' }} 
                />
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={togglePlay} style={{ width: '42px', height: '42px', background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', transition: 'transform 0.1s' }}>
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <div style={{ fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(currentTime)} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/ {fmt(duration)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={addSplit} 
                  style={{ padding: '0.65rem 1.25rem', background: 'var(--accent)', color: '#fff', borderRadius: '50px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                >
                  ✂️ Split Here
                </button>
              </div>

              {/* CapCut style timeline */}
              <div 
                ref={timelineRef}
                onClick={handleTimelineClick}
                style={{ position: 'relative', width: '100%', height: '72px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', overflow: 'hidden' }}
              >
                {/* Simulated filmstrip track */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.03)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0))' }} />
                  ))}
                </div>

                {/* Left/Right bounds darkeners? Optional, but skipping for simplicity */}

                {/* Segments Indicator Texts */}
                {duration > 0 && segments.map(seg => (
                  <div key={seg.index} style={{ 
                    position: 'absolute', 
                    top: 0, bottom: 0,
                    left: `${(seg.startTime / duration) * 100}%`, 
                    width: `${((seg.endTime - seg.startTime) / duration) * 100}%`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', zIndex: 1,
                    borderLeft: '1px solid rgba(255,255,255,0.05)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    Clip {seg.index}
                  </div>
                ))}

                {/* Split Points */}
                {splitPoints.map((sp, i) => (
                  <div 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); removeSplit(sp) }}
                    title="Click to remove cut"
                    style={{ position: 'absolute', top: 0, bottom: 0, left: `${(sp / duration) * 100}%`, width: '4px', background: '#ef4444', zIndex: 15, cursor: 'pointer', transform: 'translateX(-2px)' }}
                  />
                ))}

                {/* Playhead */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(currentTime / (duration || 1)) * 100}%`, width: '2px', background: '#fff', zIndex: 20, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translate(-50%, 0)', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                </div>
              </div>
            </div>

            {/* Segments Export List */}
            {segments.length > 0 && (
              <div style={{ marginTop: '2.5rem' }}>
                <h3 style={{ marginBottom: '1.25rem', fontWeight: 800, fontSize: '1.25rem' }}>Export Clips</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {segments.map(seg => (
                    <div key={seg.index} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>Clip {seg.index}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {fmt(seg.startTime)} <span style={{ color: 'var(--border-color)', margin: '0 4px' }}>→</span> {fmt(seg.endTime)}
                        </span>
                      </div>
                      <button 
                        onClick={() => downloadSegment(seg)} 
                        disabled={exporting !== null}
                        className="btn-primary" 
                        style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', minWidth: '100px', opacity: exporting === seg.index ? 1 : exporting !== null ? 0.5 : 1 }}
                      >
                        {exporting === seg.index ? `${exportProgress}%` : '⬇ Download'}
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
