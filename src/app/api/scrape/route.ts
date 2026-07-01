import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { scrapeAllSources } from '@/lib/scraper'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await db
    .from('digests')
    .select('id')
    .eq('date', today)
    .single()

  if (existing) {
    return NextResponse.json({ message: 'Digest already exists for today', id: existing.id })
  }

  const items = await scrapeAllSources()

  if (items.length === 0) {
    return NextResponse.json({ error: 'No items scraped' }, { status: 500 })
  }

  const { data, error } = await db
    .from('digests')
    .insert({ date: today, items, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, digest: data, itemCount: items.length })
}
