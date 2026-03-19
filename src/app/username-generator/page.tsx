'use client'

import { useState } from 'react'
import BackButton from '@/components/BackButton'
import { trackToolUsage } from '@/components/AnalyticsTracker'

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', hint: 'Short, punchy, trending' },
  { id: 'instagram', label: 'Instagram', emoji: '📸', hint: 'Aesthetic, personal brand' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️', hint: 'Channel names, memorable' },
  { id: 'twitter', label: 'X / Twitter', emoji: '🐦', hint: 'Handle-friendly, concise' },
  { id: 'twitch', label: 'Twitch', emoji: '🎮', hint: 'Gaming, streamer vibe' },
  { id: 'discord', label: 'Discord', emoji: '💬', hint: 'Community handles' },
  { id: 'snapchat', label: 'Snapchat', emoji: '👻', hint: 'Casual, playful' },
  { id: 'pinterest', label: 'Pinterest', emoji: '📌', hint: 'Creative, lifestyle' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼', hint: 'Professional, clean' },
  { id: 'gaming', label: 'Gaming (General)', emoji: '🕹️', hint: 'Gamer tags' },
  { id: 'business', label: 'Business', emoji: '🏢', hint: 'Brand names, companies' },
  { id: 'onlyfans', label: 'Creator', emoji: '⭐', hint: 'Unique, bold persona' },
]

export default function UsernameGenerator() {
  const [keyword, setKeyword] = useState('')
  const [platform, setPlatform] = useState('tiktok')
  const [usernames, setUsernames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [mode, setMode] = useState<'ai' | 'quick'>('ai')

  const selectedPlatform = PLATFORMS.find(p => p.id === platform)!

  const generateAI = async () => {
    trackToolUsage('AI Usernames Generated')
    setLoading(true)
    setUsernames([])
    const prompt = `Generate 15 unique, creative usernames for ${selectedPlatform.label} (${selectedPlatform.hint}).
${keyword ? `The username should relate to or include the word/theme: "${keyword}".` : 'Make them diverse and creative.'}
Rules:
- No spaces (use underscores or camelCase if needed)
- No offensive words
- Mix of styles: some short, some with numbers, some with symbols like _ or .
- Make them feel native to ${selectedPlatform.label} culture
- Return ONLY the usernames, one per line, no numbering, no explanations`

    const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
    const data = await res.json()
    const list = data.text?.split('\n').map((s: string) => s.trim()).filter((s: string) => s && !s.includes(' ') || s.includes('_') || s.includes('.')) || []
    setUsernames(list.slice(0, 15))
    setLoading(false)
  }

  const generateQuick = () => {
    trackToolUsage('Quick Usernames Generated')
    const PREFIXES: Record<string, string[]> = {
      tiktok: ['vibe_', 'real', 'its', 'the', 'just', 'not', 'ur'],
      instagram: ['', 'the.', 'its.', 'simply.', 'life.with.'],
      youtube: ['', 'The', 'Real', 'Daily', 'Watch'],
      twitter: ['', 'The', 'Real', 'Official', 'Im'],
      twitch: ['', 'xX', 'Pro', 'Epic', 'Shadow'],
      discord: ['', 'Dark', 'Neo', 'Void', 'Glitch'],
      gaming: ['Pro', 'Shadow', 'Ghost', 'Turbo', 'Epic', 'Apex'],
      business: ['', 'The', 'Alpha', 'Prime', 'Core'],
      default: ['Cool', 'Real', 'The', 'Pro', 'Super']
    }
    const SUFFIXES: Record<string, string[]> = {
      tiktok: ['creator', 'daily', 'vibes', 'world', 'life', 'era', 'mode'],
      instagram: ['diary', 'world', 'life', 'corner', 'studio', 'collective'],
      gaming: ['GG', 'Pro', 'X', 'Hunter', 'Slayer', 'Boss', 'King'],
      default: ['Hub', 'Zone', 'Pro', 'World', 'HQ', 'Media']
    }
    const px = PREFIXES[platform] || PREFIXES.default
    const sx = SUFFIXES[platform] || SUFFIXES.default
    const base = keyword || ['wave', 'nova', 'fire', 'echo', 'pulse', 'drift', 'flux'][Math.floor(Math.random() * 7)]
    const list: string[] = []
    for (let i = 0; i < 15; i++) {
      const p = px[Math.floor(Math.random() * px.length)]
      const s = sx[Math.floor(Math.random() * sx.length)]
      const n = Math.random() > 0.5 ? Math.floor(Math.random() * 999) : ''
      const formats = [`${p}${base}${s}${n}`, `${base}_${s}${n}`, `${p}${base}${n}`, `${base}.${s}`]
      list.push(formats[Math.floor(Math.random() * formats.length)])
    }
    setUsernames([...new Set(list)].slice(0, 15))
  }

  const copyOne = (u: string) => {
    navigator.clipboard.writeText(u)
    setCopied(u)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "900px" }}>
      <BackButton />
      <header style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Username Generator</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Get the perfect handle for any platform, powered by AI.</p>
      </header>

      <div className="card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", backgroundColor: "var(--bg-primary)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border-color)", width: "fit-content" }}>
          <button onClick={() => setMode('ai')} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: mode === 'ai' ? "var(--accent)" : "transparent", color: mode === 'ai' ? "#fff" : "var(--text-secondary)", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
            ✨ AI Powered
          </button>
          <button onClick={() => setMode('quick')} style={{ padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none", backgroundColor: mode === 'quick' ? "var(--text-primary)" : "transparent", color: mode === 'quick' ? "var(--bg-primary)" : "var(--text-secondary)", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
            ⚡ Quick
          </button>
        </div>

        {/* Platform Grid */}
        <label style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "0.75rem", fontWeight: 600 }}>Platform</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.5rem", marginBottom: "2rem" }}>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)} style={{ padding: "0.6rem 0.5rem", borderRadius: "8px", border: `1.5px solid ${platform === p.id ? "var(--accent)" : "var(--border-color)"}`, backgroundColor: platform === p.id ? "var(--accent-light)" : "var(--bg-secondary)", color: platform === p.id ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", marginBottom: "2px" }}>{p.emoji}</div>
              {p.label}
            </button>
          ))}
        </div>

        {/* Dynamic Input based on Mode */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
            {mode === 'ai' ? (
              <>Brief Explanation / Vibe <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></>
            ) : (
              <>Core Keyword <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(one word only)</span></>
            )}
          </label>
          
          <input 
            type="text" 
            value={keyword} 
            onChange={e => setKeyword(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && (mode === 'ai' ? generateAI() : generateQuick())} 
            maxLength={mode === 'ai' ? 150 : 30}
            placeholder={mode === 'ai' 
              ? 'e.g., I review tech gadgets and my name is Alex' 
              : 'e.g., tech, wolf, studio'} 
            style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "1rem", outline: "none", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} 
          />
          
          {mode === 'ai' && (
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
              {keyword.length}/150
            </div>
          )}
        </div>

        <button onClick={mode === 'ai' ? generateAI : generateQuick} disabled={loading} className="btn-primary" style={{ width: "100%", height: "3.5rem", fontSize: "1rem" }}>
          {loading ? 'AI is thinking...' : `Generate ${selectedPlatform.emoji} ${selectedPlatform.label} Usernames`}
        </button>
      </div>

      {/* Results */}
      {usernames.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700 }}>Results — click any to copy</h3>
            <button onClick={mode === 'ai' ? generateAI : generateQuick} disabled={loading} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>Regenerate</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {usernames.map((u, i) => (
              <div key={i} onClick={() => copyOne(u)} style={{ padding: "0.85rem 1rem", backgroundColor: "var(--bg-secondary)", border: `1px solid ${copied === u ? "var(--accent)" : "var(--border-color)"}`, borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", color: copied === u ? "var(--accent)" : "var(--text-primary)", transition: "all 0.15s", textAlign: "center" }}>
                {copied === u ? '✓ Copied!' : u}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
