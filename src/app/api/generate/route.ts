import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateVideoScript, generateEmailSummary } from '@/lib/ai-writer'
import type { ToolItem } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { digestId } = await req.json()
  const db = getSupabaseAdmin()

  const { data: digest, error } = await db
    .from('digests')
    .select('*')
    .eq('id', digestId)
    .single()

  if (error || !digest) {
    return NextResponse.json({ error: 'Digest not found' }, { status: 404 })
  }

  const items = digest.items as ToolItem[]
  const dateStr = new Date(digest.date).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const [script, emailHtml] = await Promise.all([
    generateVideoScript(items, dateStr),
    generateEmailSummary(items, dateStr),
  ])

  await db
    .from('digests')
    .update({ script, status: 'scripted', email_html: emailHtml })
    .eq('id', digestId)

  return NextResponse.json({ success: true, scriptLength: script.length })
}
