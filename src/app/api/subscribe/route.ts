import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email, name } = await req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('subscribers')
    .upsert({ email, name: name || null, status: 'active' }, { onConflict: 'email' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Đăng ký thất bại' }, { status: 500 })
  }

  // Send welcome email (non-blocking)
  sendWelcomeEmail(email, name).catch(console.error)

  return NextResponse.json({ success: true, subscriber: data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) return NextResponse.json({ error: 'Thiếu email' }, { status: 400 })

  const supabaseAdmin = getSupabaseAdmin()
  await supabaseAdmin
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('email', email)

  return NextResponse.json({ success: true })
}
