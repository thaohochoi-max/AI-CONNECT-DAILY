import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { checkVideoStatus } from '@/lib/fal'
import { sendDailyDigest } from '@/lib/email'
import type { Subscriber } from '@/lib/supabase'

function authorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

// Runs at 15:30 VN (8:30 UTC) — checks video status and sends emails
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const log: string[] = []

  try {
    const { data: digest } = await db
      .from('digests')
      .select('*, videos(id, luma_generation_id, video_url, status)')
      .eq('date', today)
      .single()

    if (!digest) return NextResponse.json({ message: 'No digest found for today', log })
    if (digest.status === 'sent') return NextResponse.json({ message: 'Already sent today', log })

    // Check Luma video status
    let videoUrl: string | null = null
    const video = digest.videos?.[0]

    if (video?.luma_generation_id && video.status === 'generating') {
      log.push(`Checking Luma job: ${video.luma_generation_id}`)
      const gen = await checkVideoStatus(video.luma_generation_id)
      log.push(`Luma status: ${gen.state}`)

      if (gen.state === 'completed' && gen.assets?.video) {
        videoUrl = gen.assets.video
        await db.from('videos').update({ video_url: videoUrl, thumbnail_url: gen.assets.thumbnail, status: 'ready' }).eq('id', video.id)
        await db.from('digests').update({ status: 'video_ready' }).eq('id', digest.id)
        log.push(`Video ready: ${videoUrl}`)
      } else if (gen.state === 'failed') {
        log.push('Video failed, sending without video')
        await db.from('digests').update({ status: 'scripted' }).eq('id', digest.id)
      } else {
        log.push(`Video still ${gen.state} — sending without video (will try next run)`)
      }
    } else if (video?.video_url) {
      videoUrl = video.video_url
    }

    // Send emails
    const { data: subscribers } = await db.from('subscribers').select('*').eq('status', 'active')
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers', log })
    }

    const emailHtml = digest.email_html || '<p>Xem nội dung đầy đủ trên website.</p>'
    const dateStr = new Date(today).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })

    log.push(`Sending to ${subscribers.length} subscribers...`)
    const { sent, failed } = await sendDailyDigest(subscribers as Subscriber[], emailHtml, videoUrl, dateStr)

    const logs = subscribers.map((sub: Subscriber) => ({ digest_id: digest.id, subscriber_id: sub.id, status: 'sent' }))
    await db.from('send_logs').insert(logs)
    await db.from('digests').update({ status: 'sent' }).eq('id', digest.id)

    log.push(`Done! Sent: ${sent}, Failed: ${failed}`)
    return NextResponse.json({ success: true, sent, failed, log })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.push(`ERROR: ${message}`)
    return NextResponse.json({ success: false, log, error: message }, { status: 500 })
  }
}
