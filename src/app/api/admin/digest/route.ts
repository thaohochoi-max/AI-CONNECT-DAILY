import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { digestId, script, email_html } = await req.json()
  if (!digestId) return NextResponse.json({ error: 'Thiếu digestId' }, { status: 400 })

  const update: Record<string, string> = {}
  if (typeof script === 'string') update.script = script
  if (typeof email_html === 'string') update.email_html = email_html
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Không có gì để sửa' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { error } = await db.from('digests').update(update).eq('id', digestId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
