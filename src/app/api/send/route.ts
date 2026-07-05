import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendDigestNow } from '@/lib/sendPipeline'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { digestId } = await req.json()
  const db = getSupabaseAdmin()

  // Clicking "Gửi" in the admin dashboard is itself the human approval step
  await db.from('digests').update({ approved_at: new Date().toISOString() }).eq('id', digestId).is('approved_at', null)

  const result = await sendDigestNow(digestId, { requireApproval: false })
  return NextResponse.json(result)
}
