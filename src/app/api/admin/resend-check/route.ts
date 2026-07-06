import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const domains = await resend.domains.list()

  const testSend = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: 'claude-diagnostic-test@example.com',
    subject: 'Diagnostic test',
    html: '<p>test</p>',
  })

  return NextResponse.json({
    fromEnv: process.env.RESEND_FROM_EMAIL,
    domains: domains.data,
    domainsError: domains.error,
    testSend,
  })
}
