import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]

  const [subscribersRes, digestsRes, todayRes] = await Promise.all([
    db.from('subscribers').select('id', { count: 'exact' }).eq('status', 'active'),
    db.from('digests').select('id', { count: 'exact' }),
    db.from('digests').select('status').eq('date', today).single(),
  ])

  return NextResponse.json({
    subscribers: subscribersRes.count || 0,
    totalDigests: digestsRes.count || 0,
    sentToday: todayRes.data?.status === 'sent',
  })
}
