'use client'

import { useState } from 'react'
import BackButton from '@/components/BackButton'
import { trackToolUsage } from '@/components/AnalyticsTracker'

interface PlatformCheck {
  id: string
  name: string
  status: 'pending' | 'loading' | 'available' | 'taken' | 'unverified' | 'invalid'
  reason?: string
}

const INITIAL_PLATFORMS: PlatformCheck[] = [
  { id: 'instagram', name: 'Instagram', status: 'pending' },
  { id: 'facebook', name: 'Facebook', status: 'pending' },
  { id: 'twitter', name: 'X (Twitter)', status: 'pending' },
  { id: 'github', name: 'GitHub', status: 'pending' },
  { id: 'reddit', name: 'Reddit', status: 'pending' },
  { id: 'twitch', name: 'Twitch', status: 'pending' },
  { id: 'youtube', name: 'YouTube', status: 'pending' },
  { id: 'pinterest', name: 'Pinterest', status: 'pending' },
  { id: 'medium', name: 'Medium', status: 'pending' },
  { id: 'dribbble', name: 'Dribbble', status: 'pending' },
  { id: 'onlyfans', name: 'OnlyFans', status: 'pending' }
]

export default function UsernameChecker() {
  const [username, setUsername] = useState('')
  const [platforms, setPlatforms] = useState<PlatformCheck[]>(INITIAL_PLATFORMS)
  const [isChecking, setIsChecking] = useState(false)

  const checkAvailability = async () => {
    trackToolUsage('Username Scan Started')
    const cleanUsername = username.trim()
    if (!cleanUsername) return

    setIsChecking(true)
    setPlatforms(platforms.map(p => ({ ...p, status: 'loading', reason: undefined })))

    // Execute concurrently
    await Promise.allSettled(
      platforms.map(async (p) => {
        try {
          const res = await fetch('/api/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: cleanUsername, platformId: p.id })
          })

          const data = await res.json()
          
          setPlatforms(prev => 
            prev.map(item => item.id === p.id ? { 
              ...item, 
              status: data.status || 'unverified',
              reason: data.reason || data.details || (data.status === 'unverified' ? 'Scan Error' : undefined)
            } : item)
          )
        } catch (e) {
          setPlatforms(prev => 
            prev.map(item => item.id === p.id ? { ...item, status: 'unverified', reason: 'Network error' } : item)
          )
        }
      })
    )

    setIsChecking(false)
  }

  const completedChecks = platforms.filter(p => p.status !== 'pending' && p.status !== 'loading').length
  const progressPercent = Math.round((completedChecks / platforms.length) * 100)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10b981' // emerald
      case 'taken': return '#ef4444'     // red
      case 'unverified': return '#f59e0b'// amber
      case 'invalid': return '#6b7280'   // gray
      case 'loading': return '#3b82f6'   // blue
      default: return 'var(--text-secondary)'
    }
  }

  const getStatusLabel = (p: PlatformCheck) => {
    switch (p.status) {
      case 'available': return '✓ Available'
      case 'taken': return '✕ Taken'
      case 'unverified': return p.reason === 'blocked' ? '⚠ Blocked' : '⚠ Error'
      case 'invalid': return '✕ Invalid'
      case 'loading': return 'Checking...'
      default: return 'Waiting'
    }
  }

  return (
    <main className="container" style={{ padding: "4rem 0", maxWidth: "900px" }}>
      <BackButton />

      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "-1.5px", fontWeight: 800 }}>Username Availability Checker</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Check if your handle is taken across 10+ major networks.</p>
      </header>

      {/* Input Section */}
      <div className="card" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontWeight: 700, fontSize: "1.2rem" }}>@</span>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkAvailability()}
              placeholder="brand_name_123"
              style={{ width: "100%", height: "3.5rem", padding: "0 1rem 0 2.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "1.1rem", outline: "none", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", fontWeight: 600 }}
            />
          </div>
          <button 
            onClick={checkAvailability}
            disabled={isChecking || !username.trim()}
            className="btn-primary"
            style={{ padding: "0 2rem", fontSize: "1.1rem" }}
          >
            {isChecking ? 'Checking...' : 'Check Availability'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {(isChecking || completedChecks > 0) && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
            <span>Scan Progress</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div style={{ width: "100%", height: "8px", backgroundColor: "var(--border-color)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: "var(--accent)", transition: "width 0.3s ease-out" }} />
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {platforms.map(p => (
          <div key={p.id} className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", borderLeft: `6px solid ${getStatusColor(p.status)}`, backgroundColor: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>{p.name}</span>
              <span style={{ 
                color: getStatusColor(p.status), 
                fontSize: "0.85rem", 
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {getStatusLabel(p)}
              </span>
            </div>
            {p.reason && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                {p.reason}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <article style={{ marginTop: "3rem", padding: "1.5rem", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        <strong>Refined Verification:</strong> We now use intelligent scanning to detect "shadow-ban" pages and login walls. If a platform blocks our request due to rate limits, we label it as "Blocked" rather than giving you a false "Taken" result.
      </article>

    </main>
  )
}
