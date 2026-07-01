import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { scrapeAllSources } from '@/lib/scraper'
import { generateVideoScript, generateEmailSummary } from '@/lib/ai-writer'
import { createVideoFromScript } from '@/lib/luma'
import type { ToolItem } from '@/lib/supabase'

function authorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

// Vercel calls GET with Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const log: string[] = []

  try {
    // Step 1: Check if already done today
    const { data: existing } = await db.from('digests').select('id, status').eq('date', today).single()
    if (existing?.status === 'sent') {
      return NextResponse.json({ message: 'Already sent today', log: ['Already sent today'] })
    }

    let digestId = existing?.id

    // Step 2: Scrape (if not done)
    if (!existing) {
      log.push('Scraping sources...')
      const items = await scrapeAllSources()
      log.push(`Scraped ${items.length} items`)

      const { data: digest, error } = await db
        .from('digests')
        .insert({ date: today, items, status: 'pending' })
        .select()
        .single()

      if (error) throw new Error(`DB insert failed: ${error.message}`)
      digestId = digest.id
      log.push(`Created digest: ${digestId}`)
    }

    // Step 3: Generate script + email (if not done)
    if (!existing || existing.status === 'pending') {
      log.push('Generating AI script...')
      const { data: digest } = await db.from('digests').select('items, date').eq('id', digestId).single()
      const items = (digest?.items || []) as ToolItem[]
      const dateStr = new Date(today).toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
      const [script, emailHtml] = await Promise.all([
        generateVideoScript(items, dateStr),
        generateEmailSummary(items, dateStr),
      ])
      await db.from('digests').update({ script, email_html: emailHtml, status: 'scripted' }).eq('id', digestId)
      log.push(`Script generated (${script.length} chars)`)
    }

    // Step 4: Start Luma video (if not done)
    if (!existing || ['pending', 'scripted'].includes(existing.status)) {
      log.push('Starting Luma video generation...')
      const { data: digest } = await db.from('digests').select('script, date').eq('id', digestId).single()
      if (digest?.script) {
        const lumaId = await createVideoFromScript(digest.script, digest.date)
        await db.from('videos').insert({ digest_id: digestId, luma_generation_id: lumaId, status: 'generating' })
        await db.from('digests').update({ status: 'video_generating' }).eq('id', digestId)
        log.push(`Luma job started: ${lumaId}`)
      }
    }

    log.push('Pipeline started. /api/cron/send will check video + send at 15:30.')
    return NextResponse.json({ success: true, digestId, log })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.push(`ERROR: ${message}`)
    return NextResponse.json({ success: false, log, error: message }, { status: 500 })
  }
}
