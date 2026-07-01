import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendDailyDigest } from '@/lib/email'
import type { Subscriber } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { digestId } = await req.json()
  const db = getSupabaseAdmin()

  const { data: digest } = await db
    .from('digests')
    .select('*, videos(video_url)')
    .eq('id', digestId)
    .single()

  if (!digest) return NextResponse.json({ error: 'Digest not found' }, { status: 404 })

  const emailHtml = digest.email_html || '<p>Xem nội dung đầy đủ trên website.</p>'
  const videoUrl = digest.videos?.[0]?.video_url || null

  const { data: subscribers } = await db
    .from('subscribers')
    .select('*')
    .eq('status', 'active')

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: 'No active subscribers' })
  }

  const dateStr = new Date(digest.date).toLocaleDateString('vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const { sent, failed } = await sendDailyDigest(
    subscribers as Subscriber[],
    emailHtml,
    videoUrl,
    dateStr
  )

  const logs = subscribers.map((sub: Subscriber) => ({
    digest_id: digestId,
    subscriber_id: sub.id,
    status: 'sent',
  }))
  await db.from('send_logs').insert(logs)
  await db.from('digests').update({ status: 'sent' }).eq('id', digestId)

  return NextResponse.json({ success: true, sent, failed, total: subscribers.length })
}
