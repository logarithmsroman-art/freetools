'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateToolSettings(path: string, isPop: boolean, rank: number, isEnabled: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tool_configs')
    .upsert({ 
      id: path, 
      is_popular: isPop, 
      order_rank: rank,
      is_enabled: isEnabled 
    })

  if (error) {
    console.error('Update Error:', error)
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/control-panel')
  revalidatePath(path)
  return { success: true }
}

export async function updateToolLock(path: string, isLocked: boolean, reason: string = '') {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tool_configs')
    .upsert({ id: path, is_locked: isLocked, lock_reason: reason })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/control-panel')
  revalidatePath(path)
  return { success: true }
}

export async function saveAnnouncement(message: string, isActive: boolean) {
  const supabase = await createClient()

  // First, deactivate all others if this is active
  if (isActive) {
    await supabase.from('site_announcements').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { error } = await supabase
    .from('site_announcements')
    .insert({ message, is_active: isActive })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/control-panel')
  return { success: true }
}

export async function toggleAnnouncement(id: string, active: boolean) {
  const supabase = await createClient()
  
  if (active) {
    await supabase.from('site_announcements').update({ is_active: false }).neq('id', id)
  }

  await supabase.from('site_announcements').update({ is_active: active }).eq('id', id)
  
  revalidatePath('/')
  return { success: true }
}
