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
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set())
  const [exporting, setExporting] = useState<number | null>(null)
  const [exportingAll, setExportingAll] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [seekInput, setSeekInput] = useState('')
  const [previewingClip, setPreviewingClip] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const previewEndTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setSplitPoints([])
      setSelectedClips(new Set())
      setCurrentTime(0)
      return () => URL.revokeObjectURL(url)
    } else {
      setVideoUrl(null)
    }
  }, [file])

  useEffect(() => {
    if (!videoRef.current) return
    const v = videoRef.current
    let animationFrameId: number

    const frameLoop = () => {
      if (v && !v.paused) {
        setCurrentTime(v.currentTime)
        // Auto-stop clip preview at end time
        if (previewEndTimeRef.current !== null && v.currentTime >= previewEndTimeRef.current) {
          v.pause()
          v.currentTime = previewEndTimeRef.current
          previewEndTimeRef.current = null
          setPreviewingClip(null)
        }
      }
      animationFrameId = requestAnimationFrame(frameLoop)
    }

    const handleLoadedMetadata = () => { setDuration(v.duration); setCurrentTime(v.currentTime) }
    const handleSeeked = () => setCurrentTime(v.currentTime)

    v.addEventListener('loadedmetadata', handleLoadedMetadata)
    v.addEventListener('seeked', handleSeeked)
    v.addEventListener('play', () => { setIsPlaying(true); frameLoop() })
    v.addEventListener('pause', () => { setIsPlaying(false); cancelAnimationFrame(animationFrameId) })

    return () => {
      v.removeEventListener('loadedmetadata', handleLoadedMetadata)
      v.removeEventListener('seeked', handleSeeked)
      cancelAnimationFrame(animationFrameId)
    }
  }, [videoUrl])

  const addSplit = () => {
    if (!duration || !videoRef.current) return
    const t = videoRef.current.currentTime
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

  // Parse "1:30" or "1:30:05" into seconds
  const parseTime = (str: string): number | null => {
    const parts = str.trim().split(':').map(Number)
    if (parts.some(isNaN) || parts.length < 2 || parts.length > 3) return null
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  const handleSeekSubmit = () => {
    if (!videoRef.current || !duration) return
    const t = parseTime(seekInput)
    if (t === null) return
    const clamped = Math.max(0, Math.min(t, duration))
    videoRef.current.currentTime = clamped
    setCurrentTime(clamped)
    setSeekInput('')
  }

  const previewClip = (seg: Segment) => {
    if (!videoRef.current) return
    setPreviewingClip(seg.index)
    previewEndTimeRef.current = seg.endTime
    videoRef.current.currentTime = seg.startTime
    videoRef.current.play()
  }

  const stopPreview = () => {
    setPreviewingClip(null)
    previewEndTimeRef.current = null
    videoRef.current?.pause()
  }

  const toggleClipSelection = (index: number) => {
    setSelectedClips(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const selectAll = () => setSelectedClips(new Set(segments.map(s => s.index)))
  const deselectAll = () => setSelectedClips(new Set())

  const segments: Segment[] = [0, ...splitPoints, duration].reduce((acc: Segment[], t, i, arr) => {
    if (i < arr.length - 1) acc.push({ index: i + 1, startTime: arr[i], endTime: arr[i + 1] })
    return acc
  }, [])

  const CLIP_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#8b5cf6','#14b8a6','#f97316','#84cc16']

  const trimSegment = async (seg: Segment, ffmpeg: any, fetchFile: any, ext: string): Promise<Blob> => {
    const inputName = `input.${ext}`
    await ffmpeg.writeFile(inputName, await fetchFile(file!))
    const segDuration = seg.endTime - seg.startTime
    const code = await ffmpeg.exec([
      '-ss', String(seg.startTime.toFixed(3)),
      '-i', inputName,
      '-t', String(segDuration.toFixed(3)),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-movflags', '+faststart',
      'output.mp4'
    ])
    if (code !== 0) throw new Error('FFmpeg trimming failed')
    const out = await ffmpeg.readFile('output.mp4')
    return new Blob([out as unknown as BlobPart], { type: 'video/mp4' })
  }

  const downloadSegment = async (seg: Segment) => {
    if (!file) return
    trackToolUsage('Video Clip Exported')
    setExporting(seg.index)
    setExportProgress(0)
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      ffmpeg.on('progress', ({ progress }: { progress: number }) => setExportProgress(Math.round(progress * 100)))
      const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'mp4'
      const blob = await trimSegment(seg, ffmpeg, fetchFile, ext)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${file.name.split('.')[0]}_clip${seg.index}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert('Error trimming video: ' + e.message)
    } finally {
      setExporting(null)
      setExportProgress(0)
    }
  }

  const downloadSelected = async () => {
    if (!file || selectedClips.size === 0) return
    const toExport = segments.filter(s => selectedClips.has(s.index))
    setExportingAll(true)
    setExportProgress(0)
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'mp4'
      for (let i = 0; i < toExport.length; i++) {
        const seg = toExport[i]
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          const base = (i / toExport.length) * 100
          setExportProgress(Math.round(base + (progress * 100) / toExport.length))
        })
        trackToolUsage('Video Clip Exported')
        const blob = await trimSegment(seg, ffmpeg, fetchFile, ext)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${file.name.split('.')[0]}_clip${seg.index}.mp4`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        await new Promise(r => setTimeout(r, 300))
      }
    } catch (e: any) {
      alert('Error exporting clips: ' + e.message)
    } finally {
      setExportingAll(false)
      setExportProgress(0)
    }
  }

  const fmt = (s: number) => {
    if (isNaN(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <main className="container" style={{ padding: '4rem 0', maxWidth: '1000px' }}>
      <BackButton />

      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', letterSpacing: '-1.5px', fontWeight: 800 }}>Video Trimmer</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Split videos into clips and export only the ones you want.</p>
      </header>

      <div className="card" style={{ padding: '1.5rem' }}>
        {!file ? (
          <div
            onClick={() => document.getElementById('video-input-split')?.click()}
            style={{ height: '220px', border: '2px dashed var(--border-color)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', transition: 'all 0.2s ease' }}
          >
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎞️</span>
            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Click to upload a video file</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>MP4, WebM, MOV supported</p>
            <input id="video-input-split" type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{file.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {splitPoints.length} cut{splitPoints.length !== 1 ? 's' : ''} → {segments.length} clip{segments.length !== 1 ? 's' : ''}
                  {selectedClips.size > 0 && <span style={{ color: 'var(--accent)', marginLeft: '0.5rem' }}>· {selectedClips.size} selected</span>}
                </p>
              </div>
              <button onClick={() => setFile(null)} style={{ border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>Change Video</button>
            </div>

            {/* Editor */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>

              {/* Video Player */}
              <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <video
                  ref={videoRef}
                  src={videoUrl!}
                  onClick={togglePlay}
                  style={{ maxHeight: '450px', width: '100%', objectFit: 'contain', cursor: 'pointer' }}
                />
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Play/Pause */}
                  <button onClick={togglePlay} style={{ width: '42px', height: '42px', background: 'var(--text-primary)', color: 'var(--bg-primary)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    {isPlaying ? '⏸' : '▶'}
                  </button>

                  {/* Current time display */}
                  <div style={{ fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums', minWidth: '90px' }}>
                    {fmt(currentTime)} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/ {fmt(duration)}</span>
                  </div>

                  {/* Jump to time input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="text"
                      value={seekInput}
                      onChange={e => setSeekInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSeekSubmit() }}
                      placeholder="Jump to 1:30"
                      style={{ width: '110px', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'monospace' }}
                    />
                    <button
                      onClick={handleSeekSubmit}
                      style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      Go
                    </button>
                  </div>
                </div>

                {/* Split + Preview stop */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {previewingClip !== null && (
                    <button
                      onClick={stopPreview}
                      style={{ padding: '0.65rem 1rem', background: '#ef4444', color: '#fff', borderRadius: '50px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      ⏹ Stop Preview
                    </button>
                  )}
                  <button
                    onClick={addSplit}
                    style={{ padding: '0.65rem 1.25rem', background: 'var(--accent)', color: '#fff', borderRadius: '50px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                  >
                    ✂️ Split Here
                  </button>
                </div>
              </div>

              {/* Timeline — colored clip blocks */}
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                style={{ position: 'relative', width: '100%', height: '72px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', overflow: 'hidden' }}
              >
                {/* Colored segment blocks */}
                {duration > 0 && segments.map((seg, i) => {
                  const color = CLIP_COLORS[i % CLIP_COLORS.length]
                  const isSelected = selectedClips.has(seg.index)
                  const isPreviewing = previewingClip === seg.index
                  return (
                    <div
                      key={seg.index}
                      style={{
                        position: 'absolute',
                        top: 0, bottom: 0,
                        left: `${(seg.startTime / duration) * 100}%`,
                        width: `${((seg.endTime - seg.startTime) / duration) * 100}%`,
                        background: isSelected ? color : `${color}44`,
                        borderLeft: `2px solid ${color}`,
                        borderRight: `2px solid ${color}`,
                        opacity: isPreviewing ? 1 : isSelected ? 0.85 : 0.4,
                        transition: 'opacity 0.15s, background 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                        outline: isPreviewing ? `2px solid #fff` : 'none',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>
                        {isPreviewing ? '▶' : `Clip ${seg.index}`}
                      </span>
                    </div>
                  )
                })}

                {/* Split point markers (thin, subtle) */}
                {splitPoints.map((sp, i) => (
                  <div
                    key={i}
                    onClick={(e) => { e.stopPropagation(); removeSplit(sp) }}
                    title="Click to remove cut"
                    style={{ position: 'absolute', top: 0, bottom: 0, left: `${(sp / duration) * 100}%`, width: '3px', background: 'rgba(255,255,255,0.9)', zIndex: 15, cursor: 'pointer', transform: 'translateX(-1.5px)' }}
                  />
                ))}

                {/* Playhead */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(currentTime / (duration || 1)) * 100}%`, width: '2px', background: '#fff', zIndex: 20, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translate(-50%, 0)', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                </div>
              </div>

              {/* Timeline hint */}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                Click white markers to remove cuts · Click clip blocks to seek
              </p>
            </div>

            {/* Clips List */}
            {segments.length > 0 && (
              <div style={{ marginTop: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>
                    Clips
                    <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      — tick the ones you want to download
                    </span>
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={selectAll} style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Select All</button>
                    <button onClick={deselectAll} style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Deselect All</button>
                    {selectedClips.size > 0 && (
                      <button
                        onClick={downloadSelected}
                        disabled={exportingAll}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 700 }}
                      >
                        {exportingAll ? `Exporting… ${exportProgress}%` : `⬇ Download Selected (${selectedClips.size})`}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {segments.map((seg, i) => {
                    const color = CLIP_COLORS[i % CLIP_COLORS.length]
                    const isSelected = selectedClips.has(seg.index)
                    const isPreviewing = previewingClip === seg.index
                    return (
                      <div
                        key={seg.index}
                        className="card"
                        style={{
                          padding: '1.25rem',
                          borderLeft: `4px solid ${color}`,
                          opacity: isSelected ? 1 : 0.65,
                          transition: 'opacity 0.15s, box-shadow 0.15s',
                          boxShadow: isSelected ? `0 0 0 1px ${color}44` : 'none',
                        }}
                      >
                        {/* Top row: checkbox + title + time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClipSelection(seg.index)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: color, flexShrink: 0 }}
                          />
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.15rem' }}>Clip {seg.index}</h4>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                              {fmt(seg.startTime)} → {fmt(seg.endTime)}
                              <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>({fmt(seg.endTime - seg.startTime)})</span>
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => isPreviewing ? stopPreview() : previewClip(seg)}
                            style={{
                              flex: 1, padding: '0.55rem 0', borderRadius: '8px',
                              border: `1px solid ${color}`,
                              background: isPreviewing ? color : 'transparent',
                              color: isPreviewing ? '#fff' : color,
                              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                              transition: 'all 0.15s'
                            }}
                          >
                            {isPreviewing ? '⏹ Stop' : '▶ Preview'}
                          </button>
                          <button
                            onClick={() => downloadSegment(seg)}
                            disabled={exporting !== null || exportingAll}
                            className="btn-primary"
                            style={{ flex: 1, padding: '0.55rem 0', fontSize: '0.82rem', opacity: exporting === seg.index ? 1 : (exporting !== null || exportingAll) ? 0.45 : 1 }}
                          >
                            {exporting === seg.index ? `${exportProgress}%` : '⬇ Export'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
