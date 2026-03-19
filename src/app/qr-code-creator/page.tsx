'use client'

import { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import BackButton from '@/components/BackButton'
import { trackToolUsage } from '@/components/AnalyticsTracker'

export default function QRCodeCreator() {
  const [value, setValue] = useState('https://freetool.com')
  const [size, setSize] = useState(256)
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const qrRef = useRef<HTMLDivElement>(null)

  const downloadQR = () => {
    if (!qrRef.current) return
    trackToolUsage('QR Code Downloaded')
    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    const a = document.createElement('a')
    a.download = `qrcode_${Date.now()}.png`
    a.href = url
    a.click()
  }

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "900px" }}>
      <BackButton />

      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>QR Code Creator</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Generate, customize, and download high-resolution QR codes instantly.</p>
      </header>

      <div className="responsive-grid-2" style={{ gap: "2.5rem", alignItems: "start" }}>
        
        {/* Editor Settings */}
        <div className="card" style={{ padding: "2rem" }}>
          <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Content & Styles</h3>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Website URL or Text</label>
            <textarea 
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="https://yourwebsite.com"
              style={{ width: "100%", height: "80px", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", resize: "none" }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Size (pixels): {size}x{size}</label>
            <input 
              type="range" 
              min="128" max="1024" step="32" 
              value={size} 
              onChange={e => setSize(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
          </div>

          <div className="responsive-grid-2" style={{ gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Foreground Color</label>
              <input type="color" value={fg} onChange={e => setFg(e.target.value)} style={{ width: "100%", height: "40px", cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "6px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>Background Color</label>
              <input type="color" value={bg} onChange={e => setBg(e.target.value)} style={{ width: "100%", height: "40px", cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "6px" }} />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "450px" }}>
          
          <div ref={qrRef} style={{ padding: "1rem", backgroundColor: bg, borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <QRCodeCanvas 
              value={value || 'https://freetool.com'} 
              size={Math.min(size, 300)} // Preview max size visually
              fgColor={fg}
              bgColor={bg}
              level="H" 
              includeMargin={true}
            />
          </div>
          
          <p style={{ marginTop: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "center" }}>
            Your download will be exported at the full <strong>{size}x{size}</strong> resolution.
          </p>

          <button onClick={downloadQR} className="btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "2rem" }}>
            Download PNG
          </button>
        </div>

      </div>
    </main>
  )
}
