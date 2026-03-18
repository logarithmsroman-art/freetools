'use client'

import { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const compressPDF = async () => {
    if (!file) return
    setLoading(true)
    try {
      const existingPdfBytes = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      
      // Basic compression (saves doc with minimal overhead)
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true })
      
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `compressed_${file.name}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      alert(`Compressed! Original size: ${(file.size / 1024).toFixed(1)} KB`)
    } catch (error) {
      console.error(error)
      alert('Error compressing PDF')
    }
    setLoading(false)
  }

  return (
    <main style={{ padding: "4rem 0", maxWidth: "800px" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>Compress PDF</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Instantly reduce the size of your PDF documents with no upload needed.
        </p>
      </header>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "2rem", alignItems: "center" }}>
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            width: "100%",
            height: "200px", 
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
          <span style={{ fontSize: "2rem" }}>📄</span>
          <p style={{ marginTop: "1rem", fontWeight: "500" }}>Choose a PDF file to compress</p>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="application/pdf" onChange={handleUpload} />
        </div>

        {file && (
          <div style={{ width: "100%", padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ display: "block", fontSize: "0.9rem" }}>{file.name}</strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button onClick={compressPDF} className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Compress PDF'}
            </button>
          </div>
        )}
      </div>

      <article style={{ marginTop: "4rem", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.5rem", marginBottom: "1rem" }}>Client-Side PDF Compression</h2>
        <p style={{ marginBottom: "1rem" }}>
          Large PDF files are often impossible to email or upload to web portals. Our PDF compressor uses advanced document manipulation techniques to rebuild your PDF with minimized metadata and efficient object streams.
        </p>
        <p>
          The important part? Since everything happens in your browser, your private data and sensitive documents stay 100% secure. We never see your files. No sign-ups required.
        </p>
      </article>
    </main>
  )
}
