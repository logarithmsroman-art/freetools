'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let shadowId = localStorage.getItem('freetool_shadow_id')
    if (!shadowId) {
      shadowId = 'usr_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('freetool_shadow_id', shadowId)
    }

    const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    const device = isMobile ? 'Mobile' : 'Desktop'

    const track = async () => {
      if (!pathname || pathname.includes('/control-panel')) return

      const tool_name = pathname === '/' ? 'Home Page' : pathname.replace('/', '')
      
      await supabase.from('analytics_events').insert({
        shadow_user_id: shadowId,
        action: 'Page View',
        tool_name: tool_name,
        referrer: document.referrer || 'Direct',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
        device: device
      })
    }

    track()
  }, [pathname])

  return null
}

export const trackToolUsage = async (actionName: string) => {
  const supabase = createClient()
  const shadowId = localStorage.getItem('freetool_shadow_id')
  
  await supabase.from('analytics_events').insert({
    shadow_user_id: shadowId,
    action: actionName, // e.g., 'Video Exported', 'ID Generated', 'PDF Compressed'
    tool_name: window.location.pathname.replace('/', '') || 'Home Page',
    referrer: document.referrer || 'Direct',
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
  })
}
