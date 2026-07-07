import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { searchParams } = new URL(req.url)
  const addDomain = searchParams.get('addDomain')

  if (addDomain) {
    const created = await resend.domains.create({ name: addDomain })
    return NextResponse.json(created)
  }

  const domains = await resend.domains.list()
  return NextResponse.json({ fromEnv: process.env.RESEND_FROM_EMAIL, domains: domains.data, domainsError: domains.error })
}
