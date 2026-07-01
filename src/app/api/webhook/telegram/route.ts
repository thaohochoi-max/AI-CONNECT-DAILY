import { NextRequest, NextResponse } from 'next/server'
import { replyTelegram, TelegramUpdate } from '@/lib/telegram'
import { getSupabaseAdmin } from '@/lib/supabase'

// Vercel xác thực Telegram webhook qua secret path
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const update: TelegramUpdate = await req.json().catch(() => ({}))
  const msg = update.message
  if (!msg?.text) return NextResponse.json({ ok: true })

  const chatId  = msg.chat.id
  const text    = msg.text.trim()
  const adminId = Number(process.env.TELEGRAM_CHAT_ID)

  // Chỉ admin được dùng bot
  if (chatId !== adminId) {
    await replyTelegram(chatId, '⛔ Bạn không có quyền sử dụng bot này.')
    return NextResponse.json({ ok: true })
  }

  // ── /start ──────────────────────────────────────────────────────────────
  if (text === '/start' || text === '/help') {
    await replyTelegram(chatId, [
      '🤖 <b>AI Connect Daily Bot</b>',
      '',
      'Các lệnh có thể dùng:',
      '/stats — Thống kê tổng quan',
      '/subscribers — Danh sách subscribers gần đây',
      '/run — Chạy pipeline thu thập tin hôm nay',
      '/send — Gửi email digest hôm nay',
      '/help — Hiển thị menu này',
    ].join('\n'))
    return NextResponse.json({ ok: true })
  }

  // ── /stats ───────────────────────────────────────────────────────────────
  if (text === '/stats') {
    const db = getSupabaseAdmin()
    const [{ count: totalSubs }, { count: activeSubs }, { count: totalDigests }] = await Promise.all([
      db.from('subscribers').select('*', { count: 'exact', head: true }),
      db.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('digests').select('*', { count: 'exact', head: true }),
    ])
    const { data: plans } = await db
      .from('subscribers')
      .select('plan')
      .eq('status', 'active')

    const planCount = (plans || []).reduce<Record<string, number>>((acc, r) => {
      const p = (r as { plan: string }).plan || 'starter'
      acc[p] = (acc[p] || 0) + 1
      return acc
    }, {})

    await replyTelegram(chatId, [
      '📊 <b>Thống kê AI Connect Daily</b>',
      '',
      `👥 Tổng subscribers: <b>${totalSubs ?? 0}</b>`,
      `✅ Đang active: <b>${activeSubs ?? 0}</b>`,
      `🌱 Trải Nghiệm: ${planCount.starter || 0}`,
      `⭐ Phổ Biến: ${planCount.popular || 0}`,
      `👑 Hàng Năm: ${planCount.yearly || 0}`,
      `📰 Tổng digests đã gửi: <b>${totalDigests ?? 0}</b>`,
    ].join('\n'))
    return NextResponse.json({ ok: true })
  }

  // ── /subscribers ─────────────────────────────────────────────────────────
  if (text === '/subscribers') {
    const db = getSupabaseAdmin()
    const { data } = await db
      .from('subscribers')
      .select('email, plan, status, subscribed_at')
      .order('subscribed_at', { ascending: false })
      .limit(10)

    if (!data?.length) {
      await replyTelegram(chatId, '📭 Chưa có subscriber nào.')
      return NextResponse.json({ ok: true })
    }

    const rows = data.map((s: { email: string; plan: string; status: string; subscribed_at: string }, i: number) => {
      const icon = s.status === 'active' ? '✅' : '⏳'
      const plan = s.plan === 'yearly' ? '👑' : s.plan === 'popular' ? '⭐' : '🌱'
      return `${i + 1}. ${icon}${plan} <code>${s.email}</code>`
    })

    await replyTelegram(chatId, `📋 <b>10 subscribers gần nhất</b>\n\n${rows.join('\n')}`)
    return NextResponse.json({ ok: true })
  }

  // ── /run ─────────────────────────────────────────────────────────────────
  if (text === '/run') {
    await replyTelegram(chatId, '⚙️ Đang chạy pipeline thu thập tin...')
    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://daily-tool-digest.vercel.app'
      const res = await fetch(`${origin}/api/cron/daily`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
      const data = await res.json()
      const logStr = (data.log || []).slice(-5).join('\n')
      await replyTelegram(chatId, `✅ Pipeline hoàn thành!\n\n<code>${logStr}</code>`)
    } catch (e) {
      await replyTelegram(chatId, `❌ Lỗi: ${e instanceof Error ? e.message : String(e)}`)
    }
    return NextResponse.json({ ok: true })
  }

  // ── /send ─────────────────────────────────────────────────────────────────
  if (text === '/send') {
    await replyTelegram(chatId, '📨 Đang gửi email digest...')
    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://daily-tool-digest.vercel.app'
      const res = await fetch(`${origin}/api/cron/send`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
      const data = await res.json()
      await replyTelegram(chatId, `✅ Đã gửi ${data.sent ?? 0} email · Lỗi: ${data.failed ?? 0}`)
    } catch (e) {
      await replyTelegram(chatId, `❌ Lỗi: ${e instanceof Error ? e.message : String(e)}`)
    }
    return NextResponse.json({ ok: true })
  }

  // Unknown command
  await replyTelegram(chatId, `❓ Lệnh không hợp lệ. Gõ /help để xem danh sách.`)
  return NextResponse.json({ ok: true })
}
