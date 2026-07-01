import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

// Convenience aliases — call these inside request handlers, not at module scope
export const supabase = { get: getSupabase }
export const supabaseAdmin = { get: getSupabaseAdmin }

export type Subscriber = {
  id: string
  email: string
  name: string | null
  status: 'active' | 'unsubscribed'
  subscribed_at: string
}

export type Digest = {
  id: string
  date: string
  items: ToolItem[]
  script: string | null
  email_html: string | null
  status: 'pending' | 'scripted' | 'video_generating' | 'video_ready' | 'sent'
  created_at: string
  updated_at: string
}

export type ToolItem = {
  title: string
  description: string
  url: string
  source: string
  category: string
  imageUrl?: string
}

export type Video = {
  id: string
  digest_id: string
  luma_generation_id: string | null
  video_url: string | null
  thumbnail_url: string | null
  status: 'generating' | 'ready' | 'failed'
}
