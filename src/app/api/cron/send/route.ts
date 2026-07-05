import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendDigestNow } from '@/lib/sendPipeline'

function authorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

// Runs at 15:30 VN (8:30 UTC) — only sends if an admin has already approved today's digest
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]

  const { data: digest } = await db.from('digests').select('id').eq('date', today).single()
  if (!digest) return NextResponse.json({ message: 'No digest found for today', log: [] })

  try {
    const result = await sendDigestNow(digest.id, { requireApproval: true })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, log: [`ERROR: ${message}`], error: message }, { status: 500 })
  }
}
