const API = (token: string) => `https://api.telegram.org/bot${token}`

function getConfig() {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID chưa được cấu hình')
  return { token, chatId }
}

export async function sendTelegram(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
  const { token, chatId } = getConfig()
  const res = await fetch(`${API(token)}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true }),
  })
  return res.json()
}

// ── Notification templates ────────────────────────────────────────────────

export async function notifyPayment(data: {
  email:     string
  plan:      string
  amount:    number
  orderCode: string
  sepayRef:  string
  bank:      string
}) {
  const planEmoji = data.plan === 'yearly' ? '👑' : data.plan === 'popular' ? '⭐' : '🌱'
  const planLabel = data.plan === 'yearly' ? 'Hàng Năm' : data.plan === 'popular' ? 'Phổ Biến' : 'Trải Nghiệm'
  const text = [
    `💰 <b>Thanh toán mới!</b>`,
    ``,
    `${planEmoji} <b>Gói:</b> ${planLabel}`,
    `📧 <b>Email:</b> <code>${data.email}</code>`,
    `💵 <b>Số tiền:</b> ${data.amount.toLocaleString('vi-VN')}đ`,
    `🏦 <b>Ngân hàng:</b> ${data.bank}`,
    `🔑 <b>Mã đơn:</b> <code>${data.orderCode}</code>`,
    `📋 <b>Ref SePay:</b> <code>${data.sepayRef}</code>`,
    ``,
    `✅ Tài khoản đã được kích hoạt tự động`,
  ].join('\n')
  return sendTelegram(text)
}

export async function notifyNewSubscriber(email: string, plan: string) {
  const planLabel = plan === 'yearly' ? 'Hàng Năm 👑' : plan === 'popular' ? 'Phổ Biến ⭐' : 'Trải Nghiệm 🌱'
  return sendTelegram(
    `🎉 <b>Subscriber mới!</b>\n📧 ${email}\n📦 ${planLabel}`
  )
}

export async function notifyDailyDigest(date: string, itemCount: number, subscriberCount: number) {
  return sendTelegram(
    `📰 <b>Digest đã gửi!</b>\n📅 ${date}\n📊 ${itemCount} tin · ${subscriberCount} subscribers`
  )
}

export async function notifyError(context: string, error: string) {
  return sendTelegram(
    `🚨 <b>Lỗi hệ thống</b>\n📍 ${context}\n❌ <code>${error.slice(0, 300)}</code>`
  )
}

// ── Bot command handler ───────────────────────────────────────────────────

export type TelegramUpdate = {
  update_id: number
  message?: {
    message_id: number
    from: { id: number; username?: string; first_name: string }
    chat: { id: number; type: string }
    text?: string
  }
}

export async function replyTelegram(chatId: number, text: string) {
  const { token } = getConfig()
  await fetch(`${API(token)}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
}
