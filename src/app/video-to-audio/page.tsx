'use client'

import { useState, useRef } from 'react'
import BackButton from '@/components/BackButton'

export default function VideoToAudio() {
  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setDownloadUrl(null)
    }
  }

  const extract = async () => {
    if (!file || !videoRef.current) return
    setExtracting(true)
    
    const video = videoRef.current
    video.src = URL.createObjectURL(file)
    
    // Create Audio Context to capture the stream
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const dest = audioCtx.createMediaStreamDestination()
    const source = audioCtx.createMediaElementSource(video)
    source.connect(dest)
    
    const recorder = new MediaRecorder(dest.stream)
    const chunks: Blob[] = []
    
    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/mp3' })
      setDownloadUrl(URL.createObjectURL(blob))
      setExtracting(false)
    }
    
    // Play the video at 10x speed to extract faster (if browser allows)
    video.playbackRate = 8 
    video.muted = true
    
    recorder.start()
    video.play()
    
    video.onended = () => {
      recorder.stop()
      audioCtx.close()
    }
  }

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "800px" }}>
      <BackButton />
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Video to Audio Extractor</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>High-quality instant audio extraction. Works locally in your browser.</p>
      </header>

      <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
        {!file ? (
          <div 
            onClick={() => document.getElementById('video-input')?.click()}
            style={{ 
              height: "200px", 
              border: "2px dashed var(--border-color)", 
              borderRadius: "16px", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer",
              backgroundColor: "var(--bg-secondary)"
            }}
          >
            <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎞️</span>
            <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Drop a Video File Here</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>MP4, MOV, MKV supported</p>
            <input id="video-input" type="file" accept="video/*" style={{ display: "none" }} onChange={handleUpload} />
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "2rem", padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "1rem" }}>
               <span style={{ fontSize: "1.5rem" }}>📄</span>
               <div style={{ textAlign: "left" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>{file.name}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{(file.size / (1024*1024)).toFixed(2)} MB</p>
               </div>
               <button onClick={() => setFile(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "red", cursor: "pointer" }}>Change</button>
            </div>

            {!downloadUrl ? (
              <button 
                onClick={extract} 
                disabled={extracting}
                className="btn-primary" 
                style={{ width: "100%", height: "3.5rem" }}
              >
                {extracting ? 'Extracting High-Quality Audio...' : 'Start Extraction'}
              </button>
            ) : (
              <div style={{ display: "flex", gap: "1rem" }}>
                <a 
                  href={downloadUrl} 
                  download={`${file.name.split('.')[0]}.mp3`}
                  className="btn-primary" 
                  style={{ flex: 1, height: "3.5rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  Download .MP3
                </a>
                <button onClick={() => { setFile(null); setDownloadUrl(null); }} className="hover-bg" style={{ flex: 1, height: "3.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "none", cursor: "pointer", fontWeight: 700 }}>
                  Extract Another
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <video ref={videoRef} style={{ display: "none" }} />

      <article style={{ marginTop: "4rem", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>About Video to Audio</h2>
        <p>Upload any video file and download just the audio track. Your video never leaves your device.</p>
      </article>
    </main>
  )
}
