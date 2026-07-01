import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateOrderCode, PLAN_AMOUNTS, getVietQRUrl } from '@/lib/sepay'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { email, name, plan } = body as { email?: string; name?: string; plan?: string }

  if (!email || !plan || !PLAN_AMOUNTS[plan]) {
    return NextResponse.json({ error: 'email và plan là bắt buộc' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const orderCode = generateOrderCode(plan, email)

  // Upsert subscriber ở trạng thái pending
  const { error } = await db.from('subscribers').upsert(
    {
      email,
      name:       name || '',
      status:     'pending',
      plan,
      order_code: orderCode,
    },
    { onConflict: 'email' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    orderCode,
    amount:        PLAN_AMOUNTS[plan],
    bank:          'TPBank',
    accountNumber: '73266666686',
    accountName:   'PHẠM THỊ THÚY NGÂN',
    qrUrl:         getVietQRUrl(orderCode, plan),
  })
}
