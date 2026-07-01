import { Resend } from 'resend'
import type { Subscriber } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDailyDigest(
  subscribers: Subscriber[],
  htmlContent: string,
  videoUrl: string | null,
  date: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  const videoSection = videoUrl
    ? `<div style="text-align:center;margin:24px 0;">
        <a href="${videoUrl}" style="display:inline-block;background:#6366f1;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
          ▶ Xem Video Tóm Tắt Hôm Nay
        </a>
       </div>`
    : ''

  const fullHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Tool Digest - ${date}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">🛠️ Daily Tool Digest</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">${date}</p>
    </div>
    <div style="padding:24px;">
      ${videoSection}
      ${htmlContent}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        Bạn nhận email này vì đã đăng ký Daily Tool Digest.<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color:#6366f1;">Hủy đăng ký</a>
      </p>
    </div>
  </div>
</body>
</html>`

  // Send in batches of 50
  const batchSize = 50
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(sub =>
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: sub.email,
          subject: `🛠️ Tool mới nhất hôm nay - ${date}`,
          html: fullHtml,
        })
      )
    )
    results.forEach(r => {
      if (r.status === 'fulfilled') sent++
      else failed++
    })
  }

  return { sent, failed }
}

export async function sendWelcomeEmail(email: string, name: string | null): Promise<void> {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: '🎉 Chào mừng bạn đến với Daily Tool Digest!',
    html: `
<!DOCTYPE html>
<html lang="vi">
<body style="font-family:-apple-system,sans-serif;background:#f4f4f5;padding:20px;">
  <div style="max-width:500px;margin:0 auto;background:white;border-radius:12px;padding:32px;">
    <h2 style="color:#6366f1;">Chào ${name || 'bạn'}! 👋</h2>
    <p>Bạn đã đăng ký thành công <strong>Daily Tool Digest</strong> – bản tin công nghệ & AI tool mỗi ngày.</p>
    <p>Mỗi sáng bạn sẽ nhận được:</p>
    <ul>
      <li>📰 Tin tức tool & AI mới nhất</li>
      <li>🎬 Video tóm tắt ngắn gọn</li>
      <li>🔗 Link trực tiếp đến từng tool</li>
    </ul>
    <p style="color:#6b7280;font-size:14px;">Hẹn gặp bạn vào sáng mai!</p>
  </div>
</body>
</html>`,
  })
}
