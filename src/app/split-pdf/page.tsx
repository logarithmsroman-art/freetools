'use client'

import { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import { trackToolUsage } from '@/components/AnalyticsTracker'

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [range, setRange] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      const bytes = await f.arrayBuffer()
      const doc = await PDFDocument.load(bytes)
      setPageCount(doc.getPageCount())
    }
  }

  const splitPDF = async () => {
    if (!file || !range) return
    trackToolUsage('PDF Split')
    setLoading(true)
    try {
      const bytes = await file.arrayBuffer()
      const sourcePdf = await PDFDocument.load(bytes)
      const targetPdf = await PDFDocument.create()

      // Simple range parser (e.g., 1-3, 5, 7)
      const pages = range.split(',').flatMap(r => {
        if (r.includes('-')) {
          const [start, end] = r.split('-').map(Number)
          return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1)
        }
        return [Number(r) - 1]
      })

      const copiedPages = await targetPdf.copyPages(sourcePdf, pages)
      copiedPages.forEach(p => targetPdf.addPage(p))

      const outputBytes = await targetPdf.save()
      const blob = new Blob([outputBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `split_${file.name}`
      link.click()
    } catch (error) {
      console.error(error)
      alert('Error splitting PDF. Check range format (e.g., 1-2, 5).')
    }
    setLoading(false)
  }

  return (
    <main style={{ padding: "4rem 0", maxWidth: "800px" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>Split PDF</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Extract specific pages or ranges from your PDF instantly.
        </p>
      </header>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
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
          <span style={{ fontSize: "1.5rem" }}>✂️</span>
          <p style={{ marginTop: "0.5rem", fontWeight: "500" }}>Upload PDF to Split</p>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="application/pdf" onChange={handleUpload} />
        </div>

        {file && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span>{file.name} ({pageCount} pages)</span>
              <button onClick={() => { setFile(null); setRange(''); }} style={{ color: "#ef4444", background: "none", border: "none" }}>Remove</button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Enter Page Range (e.g., 1-2, 5)</label>
              <input 
                type="text" 
                value={range} 
                onChange={(e) => setRange(e.target.value)}
                placeholder="Ex: 1-3, 5, 8"
                style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "1.1rem", outline: "none", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
              />
            </div>
            
            <button onClick={splitPDF} className="btn-primary" disabled={loading || !range} style={{ height: "3.5rem" }}>
              {loading ? 'Splitting...' : 'Extract Pages'}
            </button>
          </div>
        )}
      </div>

      <article style={{ marginTop: "4rem", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.5rem", marginBottom: "1rem" }}>Precise PDF Splitting</h2>
        <p style={{ marginBottom: "1rem" }}>
          Sometimes you only need a single page or a small chapter from a large PDF document. Our tool allows you to extract exactly what you need without expensive software. 
        </p>
        <p>
          Whether splitting a large textbook or extracting a single receipt from a month-long log, stay efficient and keep your document size low. All processing happens locally for maximum security.
        </p>
      </article>
    </main>
  )
}
