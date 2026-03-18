'use client'

import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'

export default function FileSizeReducer() {
  const [file, setFile] = useState<File | null>(null)
  const [targetSizeKB, setTargetSizeKB] = useState(100)
  const [outputFile, setOutputFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setOutputFile(null)
    }
  }

  const compressImage = async () => {
    if (!file) return
    setLoading(true)
    try {
      const options = {
        maxSizeMB: targetSizeKB / 1024,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)
      setOutputFile(compressedFile)
    } catch (error) {
      console.error(error)
      alert('Error compressing image')
    }
    setLoading(false)
  }

  const downloadFile = () => {
    if (!outputFile) return
    const url = URL.createObjectURL(outputFile)
    const link = document.createElement('a')
    link.href = url
    link.download = `compressed_${outputFile.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <main style={{ padding: "4rem 0", maxWidth: "800px" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>File Size Reducer</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Target your specific file size (KB) and compress images instantly. 
        </p>
      </header>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div className="responsive-grid-2" style={{ gap: "1rem" }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              height: "150px", 
              border: "2px dashed var(--border-color)", 
              borderRadius: "12px", 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-secondary)"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>📁</span>
            <p style={{ marginTop: "0.5rem", fontWeight: "500", fontSize: "0.9rem" }}>Upload Image</p>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleUpload} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", justifyContent: "center" }}>
            <label style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Target size (KB)</label>
            <input 
              type="number" 
              value={targetSizeKB} 
              onChange={(e) => setTargetSizeKB(Number(e.target.value))}
              style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "1rem" }}
            />
          </div>
        </div>

        {file && (
          <div style={{ padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ display: "block", fontSize: "0.9rem" }}>{file.name}</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Current size: {(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button onClick={compressImage} className="btn-primary" disabled={loading}>
              {loading ? 'Compressing...' : 'Compress Now'}
            </button>
          </div>
        )}

        {outputFile && (
          <div style={{ padding: "1rem", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ display: "block", fontSize: "0.9rem" }}>Ready to download</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>New size: {(outputFile.size / 1024).toFixed(1)} KB</span>
            </div>
            <button onClick={downloadFile} className="btn-primary">Download</button>
          </div>
        )}
      </div>

      <article style={{ marginTop: "4rem", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.5rem", marginBottom: "1rem" }}>How Target-Based Compression Works</h2>
        <p style={{ marginBottom: "1rem" }}>
          Upload your files, set your target size in KB (e.g. 50KB or 100KB), and our tool intelligently adjusts quality and dimensions to hit that mark. 
        </p>
        <p>
          This is especially useful for online forms or job applications that have strict file size requirements. We use advanced client-side libraries to handle the logic, ensuring your private photos never hit a server. 
        </p>
      </article>
    </main>
  )
}
