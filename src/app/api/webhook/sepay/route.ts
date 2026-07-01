import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySepayRequest, PLAN_AMOUNTS } from '@/lib/sepay'
import { sendWelcomeEmail } from '@/lib/email'

type SepayPayload = {
  id: number
  gateway: string
  transactionDate: string
  accountNumber: string
  code: string | null        // order code từ nội dung CK
  content: string
  transferType: 'in' | 'out'
  transferAmount: number
  accumulated: number
  referenceCode: string
}

export async function POST(req: NextRequest) {
  // 1. Xác thực SePay API key
  if (!verifySepayRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json().catch(() => null) as SepayPayload | null
  if (!payload) return NextResponse.json({ error: 'Bad payload' }, { status: 400 })

  // 2. Chỉ xử lý tiền vào
  if (payload.transferType !== 'in') {
    return NextResponse.json({ success: true, skip: 'outgoing' })
  }

  // 3. Tìm order code trong nội dung (AICD-PLAN-XXXXX)
  const content = payload.content ?? ''
  const match = content.match(/AICD-(STARTER|POPULAR|YEARLY)-([A-Z0-9]+)/i)
  if (!match) {
    return NextResponse.json({ success: true, skip: 'no_aicd_code' })
  }

  const planKey   = match[1].toLowerCase() as 'starter' | 'popular' | 'yearly'
  const orderCode = `AICD-${match[1].toUpperCase()}-${match[2].toUpperCase()}`
  const expected  = PLAN_AMOUNTS[planKey]

  // 4. Kiểm tra số tiền (chấp nhận ≥ expected, tránh reject do phí chuyển)
  if (payload.transferAmount < expected - 1000) {
    return NextResponse.json({ success: false, reason: `Amount ${payload.transferAmount} < ${expected}` })
  }

  const db = getSupabaseAdmin()

  // 5. Tìm subscriber theo order_code
  const { data: sub, error: findErr } = await db
    .from('subscribers')
    .select('*')
    .eq('order_code', orderCode)
    .maybeSingle()

  if (findErr || !sub) {
    return NextResponse.json({ success: false, reason: 'subscriber_not_found', orderCode })
  }

  // 6. Kích hoạt tài khoản
  await db.from('subscribers').update({
    status:      'active',
    plan:        planKey,
    paid_at:     new Date().toISOString(),
    sepay_ref:   payload.referenceCode,
    amount_paid: payload.transferAmount,
  }).eq('id', sub.id)

  // 7. Gửi email chào mừng
  try {
    await sendWelcomeEmail(sub.email, sub.name || 'bạn')
  } catch (e) {
    console.error('Welcome email failed:', e)
  }

  console.log(`[SePay] Activated ${sub.email} → ${planKey} | ${orderCode}`)
  return NextResponse.json({ success: true, email: sub.email, plan: planKey })
}
