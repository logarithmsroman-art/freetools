'use client'

import { useState } from 'react'
import BackButton from '@/components/BackButton'
import { trackToolUsage } from '@/components/AnalyticsTracker'

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok Post', icon: '📱' },
  { id: 'twitter', label: 'Twitter / X', icon: '🐦' },
  { id: 'whatsapp', label: 'WhatsApp Status', icon: '💬' },
  { id: 'linkedin', label: 'LinkedIn Post', icon: '💼' },
  { id: 'instagram', label: 'Instagram Caption', icon: '📸' },
  { id: 'youtube', label: 'YouTube Community', icon: '▶️' },
]

export default function ContentCreator() {
  const [input, setInput] = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [tone, setTone] = useState('engaging')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    if (!input.trim()) return
    trackToolUsage('AI Content Generated')
    setLoading(true)
    setResult('')
    setCopied(false)

    const selectedPlatform = PLATFORMS.find(p => p.id === platform)?.label

    const prompt = `Turn the following raw thought/idea into a high-quality ${selectedPlatform}.
    
    Tone: ${tone}
    
    Input:
    "${input}"
    
    Rules:
    - Format it perfectly for ${selectedPlatform} (use appropriate emojis, spacing, and hashtags if normal for that platform).
    - If it's a TikTok post, write it as a text hook + caption.
    - If it's a WhatsApp status, make it punchy and casual.
    - If it's LinkedIn, make it sound professional and insightful.
    - Return ONLY the generated content, no explanations or conversational intro text. Do not use quotes around the output unless it's a quote.`

    try {
      const res = await fetch('/api/gemini', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ prompt }) 
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.text)
    } catch (e: any) {
      setResult(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "900px" }}>
      <BackButton />
      
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>AI Content Creator</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Turn any random thought, chat, or idea into tailored social media content instantly.</p>
      </header>

      <div className="responsive-grid-2" style={{ gap: "2rem", alignItems: "stretch" }}>
        
        {/* Input Form */}
        <div className="card" style={{ display: "flex", flexDirection: "column", padding: "2rem" }}>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>1. Paste your raw thought</label>
            <textarea 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g., Just realized that coffee is basically bean soup and my whole life is a lie..."
              style={{ width: "100%", height: "150px", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", resize: "none", fontSize: "1rem" }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>2. Choose Format</label>
            <div className="responsive-grid-2" style={{ gap: "0.5rem" }}>
              {PLATFORMS.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => setPlatform(p.id)}
                  style={{ 
                    padding: "0.75rem", 
                    borderRadius: "6px", 
                    border: `1.5px solid ${platform === p.id ? "var(--accent)" : "var(--border-color)"}`, 
                    backgroundColor: platform === p.id ? "var(--accent-light)" : "transparent",
                    color: platform === p.id ? "var(--accent)" : "var(--text-primary)",
                    cursor: "pointer", 
                    fontWeight: 600,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>3. Tone</label>
            <select 
              value={tone} 
              onChange={e => setTone(e.target.value)}
              style={{ width: "100%", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.95rem" }}
            >
              <option value="engaging">🔥 Engaging & Viral</option>
              <option value="funny">😂 Funny & Witty</option>
              <option value="professional">💼 Professional & Clean</option>
              <option value="casual">☕ Casual & Conversational</option>
              <option value="controversial">🌶️ Spicy & Controversial</option>
            </select>
          </div>

          <button 
            onClick={generate} 
            disabled={loading || !input.trim()}
            className="btn-primary" 
            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "auto" }}
          >
            {loading ? '✨ AI is writing...' : 'Generate Content'}
          </button>
        </div>

        {/* Output Area */}
        <div className="card" style={{ display: "flex", flexDirection: "column", padding: "2rem", backgroundColor: "var(--bg-secondary)" }}>
          <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1rem" }}>Result</h3>
          
          <div style={{ 
            flex: 1, 
            backgroundColor: "var(--bg-primary)", 
            border: "1px solid var(--border-color)", 
            borderRadius: "8px", 
            padding: "1.5rem",
            whiteSpace: "pre-wrap",
            fontSize: "1.05rem",
            lineHeight: 1.6,
            overflowY: "auto"
          }}>
            {result ? result : <span style={{ color: "var(--text-secondary)", opacity: 0.6 }}>Your formatted post will appear here...</span>}
          </div>

          <button 
            onClick={copyResult}
            disabled={!result || loading}
            style={{ 
              width: "100%", 
              padding: "1rem", 
              marginTop: "1rem", 
              borderRadius: "8px", 
              border: "1px solid var(--border-color)",
              backgroundColor: copied ? "var(--accent-light)" : "var(--bg-primary)",
              color: copied ? "var(--accent)" : "var(--text-primary)",
              cursor: (!result || loading) ? "not-allowed" : "pointer",
              fontWeight: 700,
              transition: "all 0.2s"
            }}
          >
            {copied ? '✓ Copied to Clipboard' : 'Copy Content'}
          </button>
        </div>

      </div>

    </main>
  )
}
