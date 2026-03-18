'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'

export default function ToolWrapper({ children }: { children: React.ReactNode }) {
  const [lockedData, setLockedData] = useState<{ is_locked: boolean, reason: string | null } | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkLock = async () => {
      const { data, error } = await supabase
        .from('tool_configs')
        .select('is_locked, lock_reason')
        .eq('id', pathname)
        .single()
      
      if (data && !error && data.is_locked) {
        setLockedData({ is_locked: true, reason: data.lock_reason })
      } else {
        setLockedData({ is_locked: false, reason: null })
      }
    }
    checkLock()
  }, [pathname])

  if (lockedData?.is_locked) {
    return (
      <div className="container" style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "8rem 2rem",
        textAlign: "center"
      }}>
        <div style={{ 
          fontSize: "5rem", 
          marginBottom: "1.5rem",
          animation: "pulse 2s infinite" 
        }}>🔒</div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem" }}>Tool Temporarily Secured</h1>
        <div className="card" style={{ 
          maxWidth: "500px", 
          padding: "2rem", 
          backgroundColor: "var(--bg-secondary)",
          border: "2px solid var(--accent)",
          borderRadius: "15px"
        }}>
          <p style={{ fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "1rem" }}>
            Admin Message:
          </p>
          <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
            {lockedData.reason || "This tool is currently undergoing maintenance. Please check back later!"}
          </p>
        </div>
        <a href="/" className="btn-primary" style={{ marginTop: "2.5rem" }}>
          Return to Home
        </a>

        <style jsx>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return <>{children}</>
}
