'use client'

import { useState, useRef } from 'react'
import Tesseract from 'tesseract.js'
import BackButton from '@/components/BackButton'

export default function ImageToText() {
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result as string)
        extractText(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const extractText = (imgSrc: string) => {
    setLoading(true)
    setProgress(0)
    Tesseract.recognize(imgSrc, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100))
        }
      },
    }).then(({ data: { text } }) => {
      setText(text)
      setLoading(false)
    })
  }

  const copyText = () => {
    navigator.clipboard.writeText(text)
    alert('Extracted text copied!')
  }

  return (
    <main style={{ padding: "4rem 0", maxWidth: "800px" }}>
      <BackButton />
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.5px" }}>Image to Text (OCR)</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Extract text from any photo instantly using powerful Optical Character Recognition.
        </p>
      </header>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
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
            <span style={{ fontSize: "2rem" }}>📷</span>
            <p style={{ marginTop: "1rem", fontWeight: "500" }}>Click or drag a photo to begin</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept="image/*" 
              onChange={handleUpload} 
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <div style={{ width: "100%", height: "8px", backgroundColor: "var(--border-color)", borderRadius: "4px", overflow: "hidden", marginBottom: "1rem" }}>
                  <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "var(--text-primary)", transition: "width 0.3s ease" }}></div>
                </div>
                <p style={{ color: "var(--text-secondary)" }}>Analyzing image... {progress}%</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <textarea
                  value={text}
                  readOnly
                  style={{
                    width: "100%",
                    minHeight: "250px",
                    padding: "1.5rem",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "monospace"
                  }}
                />
                <div className="responsive-grid-2" style={{ gap: "1rem" }}>
                  <button onClick={copyText} className="btn-primary" style={{ padding: "1rem" }}>Copy Text</button>
                  <button 
                    onClick={() => { setImage(null); setText(''); }} 
                    style={{ 
                      padding: "1rem",
                      background: "var(--bg-secondary)", 
                      border: "1px solid var(--border-color)", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontWeight: "700",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    className="hover-bg"
                  >
                    Extract Another Image
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <article style={{ marginTop: "4rem", color: "var(--text-secondary)", lineHeight: "1.8" }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>About Image to Text</h2>
        <p>Upload any image — a screenshot, photo of a document, or scanned page — and get all the readable text out of it instantly.</p>
      </article>
    </main>
  )
}
