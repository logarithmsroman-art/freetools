'use client'

import { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || [])
    if (f.length > 0) setFiles([...files, ...f])
  }

  const mergePDFs = async () => {
    if (files.length < 2) return
    setLoading(true)
    try {
      const mergedPdf = await PDFDocument.create()

      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const pdf = await PDFDocument.load(bytes)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }

      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = "merged.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error(error)
      alert('Error merging PDFs')
    }
    setLoading(false)
  }

  return (
    <main style={{ padding: "4rem 0", maxWidth: "800px" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>Merge PDF</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Combine multiple PDF documents into one single file instantly.
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
          <span style={{ fontSize: "1.5rem" }}>➕</span>
          <p style={{ marginTop: "0.5rem", fontWeight: "500" }}>Click to Add PDFs</p>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="application/pdf" multiple onChange={handleUpload} />
          <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Upload 2 or more files to merge</p>
        </div>

        {files.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              {files.map((f, i) => (
                <div key={i} style={{ padding: "0.75rem", borderBottom: i < files.length - 1 ? "1px solid var(--border-color)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                  <span>{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                  <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ color: "#ef4444", background: "none", border: "none" }}>Remove</button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={mergePDFs} 
              className="btn-primary" 
              disabled={loading || files.length < 2}
              style={{ padding: "1rem", fontSize: "1rem" }}
            >
              {loading ? 'Merging...' : `Merge ${files.length} PDFs`}
            </button>
          </div>
        )}
      </div>

      <article style={{ marginTop: "4rem", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.5rem", marginBottom: "1rem" }}>Combine PDFs Effortlessly</h2>
        <p style={{ marginBottom: "1rem" }}>
          Managing multiple PDF documents can be a nightmare. Our merge PDF tool simplifies the process, allowing you to drag and drop files to combine them into a single, cohesive document. 
        </p>
        <p>
          Perfect for combining reports, receipts, and school assignments into one tidy file for easier sharing and storage. No data leaves your machine, ensuring total document privacy at all times.
        </p>
      </article>
    </main>
  )
}
