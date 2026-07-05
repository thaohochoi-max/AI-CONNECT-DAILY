import { getSupabaseAdmin } from '@/lib/supabase'
import { sendDailyDigest } from '@/lib/email'
import { checkVideoStatus } from '@/lib/fal'
import type { Subscriber } from '@/lib/supabase'

export type SendResult = {
  success: boolean
  message?: string
  sent?: number
  failed?: number
  log: string[]
}

export async function sendDigestNow(
  digestId: string,
  opts: { requireApproval: boolean }
): Promise<SendResult> {
  const db = getSupabaseAdmin()
  const log: string[] = []

  const { data: digest } = await db
    .from('digests')
    .select('*, videos(id, luma_generation_id, video_url, status)')
    .eq('id', digestId)
    .single()

  if (!digest) return { success: false, message: 'Không tìm thấy digest', log }
  if (digest.status === 'sent') return { success: false, message: 'Đã gửi rồi', log }
  if (!digest.email_html) return { success: false, message: 'Chưa có nội dung (script/email chưa tạo), không gửi', log }
  if (opts.requireApproval && !digest.approved_at) {
    return { success: false, message: 'Chưa được duyệt (approved_at trống), không gửi', log }
  }

  // Check video status (best-effort — a missing/failed video never blocks the email)
  let videoUrl: string | null = null
  const video = digest.videos?.[0]

  if (video?.luma_generation_id && video.status === 'generating') {
    log.push(`Checking video job: ${video.luma_generation_id}`)
    const gen = await checkVideoStatus(video.luma_generation_id)
    log.push(`Video status: ${gen.state}`)

    if (gen.state === 'completed' && gen.assets?.video) {
      videoUrl = gen.assets.video
      await db.from('videos').update({ video_url: videoUrl, thumbnail_url: gen.assets.thumbnail, status: 'ready' }).eq('id', video.id)
      await db.from('digests').update({ status: 'video_ready' }).eq('id', digest.id)
    } else if (gen.state === 'failed') {
      log.push('Video failed, sending without video')
    } else {
      log.push(`Video still ${gen.state} — sending without video`)
    }
  } else if (video?.video_url) {
    videoUrl = video.video_url
  }

  const { data: subscribers } = await db.from('subscribers').select('*').eq('status', 'active')
  if (!subscribers || subscribers.length === 0) {
    return { success: true, message: 'Không có subscriber active', log, sent: 0, failed: 0 }
  }

  const dateStr = new Date(digest.date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
  log.push(`Sending to ${subscribers.length} subscribers...`)

  const { sent, failed } = await sendDailyDigest(subscribers as Subscriber[], digest.email_html, videoUrl, dateStr)

  const logs = subscribers.map((sub: Subscriber) => ({ digest_id: digest.id, subscriber_id: sub.id, status: 'sent' }))
  await db.from('send_logs').insert(logs)
  await db.from('digests').update({ status: 'sent' }).eq('id', digest.id)

  log.push(`Done! Sent: ${sent}, Failed: ${failed}`)
  return { success: true, sent, failed, log }
}
