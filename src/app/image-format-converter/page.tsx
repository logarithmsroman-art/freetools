'use client'

import { useState, useRef } from 'react'
import BackButton from '@/components/BackButton'
import { trackToolUsage } from '@/components/AnalyticsTracker'

export default function ImageFormatConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState('image/jpeg')
  const [quality, setQuality] = useState(90)
  const [loading, setLoading] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setDownloadUrl(null)
    }
  }

  const convertImage = async () => {
    if (!file || !canvasRef.current) return
    trackToolUsage(`Image Converted to ${targetFormat.split('/')[1]}`)
    setLoading(true)
    
    const img = new Image()
    img.src = URL.createObjectURL(file)
    
    img.onload = () => {
      const canvas = canvasRef.current!
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')!
      
      // If converting transparent PNG/WEBP to JPEG, we need a white background
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      ctx.drawImage(img, 0, 0)
      
      // Convert
      const dataUrl = canvas.toDataURL(targetFormat, quality / 100)
      setDownloadUrl(dataUrl)
      setLoading(false)
    }
  }

  const getExt = () => targetFormat.split('/')[1].replace('jpeg', 'jpg')

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "800px" }}>
      <BackButton />

      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Image Format Converter</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Convert PNGs, JPGs, or WebP images instantly inside your browser.</p>
      </header>

      <div className="card" style={{ padding: "2.5rem" }}>
        {!file ? (
          <div 
            onClick={() => document.getElementById('image-upload')?.click()}
            style={{ 
              height: "220px", border: "2px dashed var(--border-color)", borderRadius: "12px", 
              backgroundColor: "var(--bg-secondary)", display: "flex", flexDirection: "column", 
              alignItems: "center", justifyContent: "center", cursor: "pointer" 
            }}
          >
            <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>🖼️</span>
            <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>Click or drop an image here</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>Supports JPG, PNG, WEBP, GIF</p>
            <input id="image-upload" type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundImage: `url(${URL.createObjectURL(file)})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div>
                  <h4 style={{ fontWeight: 700, margin: 0 }}>{file.name}</h4>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <button onClick={() => { setFile(null); setDownloadUrl(null); }} style={{ background: "none", border: "none", color: "red", cursor: "pointer", fontWeight: 600 }}>Change File</button>
            </div>

            {!downloadUrl ? (
              <div className="responsive-grid-2" style={{ gap: "2rem", marginBottom: "2rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Convert To</label>
                  <select value={targetFormat} onChange={e => setTargetFormat(e.target.value)} style={{ width: "100%", padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    <option value="image/jpeg">JPEG (.jpg)</option>
                    <option value="image/png">PNG (.png)</option>
                    <option value="image/webp">WebP (.webp)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Quality ({quality}%)</label>
                  <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} disabled={targetFormat === 'image/png'} style={{ width: "100%", accentColor: "var(--accent)" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{targetFormat === 'image/png' ? 'Quality slider inactive for PNG' : 'Affects output file size'}</span>
                </div>
              </div>
            ) : null}

            {downloadUrl ? (
              <div style={{ display: "flex", gap: "1rem" }}>
                <a href={downloadUrl} download={`converted_image.${getExt()}`} className="btn-primary" style={{ flex: 1, padding: "1rem", textAlign: "center", textDecoration: "none" }}>
                  Download .{getExt().toUpperCase()}
                </a>
                <button onClick={() => setDownloadUrl(null)} style={{ padding: "1rem 2rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "none", cursor: "pointer", fontWeight: 600 }}>Convert Another Format</button>
              </div>
            ) : (
              <button onClick={convertImage} disabled={loading} className="btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}>
                {loading ? 'Converting...' : 'Convert Image'}
              </button>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}
      </div>
    </main>
  )
}
