'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<{ id: string, message: string } | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data, error } = await supabase
        .from('site_announcements')
        .select('id, message')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        
      if (data && !error) {
        // Check if user already dismissed this specific announcement
        if (!localStorage.getItem(`announcement_dismissed_${data.id}`)) {
          setAnnouncement(data)
        }
      }
    }
    fetchAnnouncement()
  }, [])
  
  if (!announcement) return null

  const dismiss = () => {
    localStorage.setItem(`announcement_dismissed_${announcement.id}`, 'true')
    setAnnouncement(null)
  }

  return (
    <div className="no-print" style={{ 
      backgroundColor: "var(--accent)", 
      color: "#fff", 
      padding: "0.75rem 1rem", 
      textAlign: "center", 
      fontSize: "0.9rem", 
      fontWeight: 500,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ flex: 1, textAlign: "center" }}>
        {announcement.message}
      </div>
      <button 
        onClick={dismiss}
        style={{ 
          background: "none", 
          border: "none", 
          color: "#fff", 
          cursor: "pointer", 
          fontSize: "1.2rem", 
          padding: "0 0.5rem",
          opacity: 0.8
        }}
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
