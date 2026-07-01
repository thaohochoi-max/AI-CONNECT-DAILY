import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!
const AUTH = { Authorization: `Bearer ${process.env.CRON_SECRET}` }

async function callAPI(path: string, body?: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...AUTH },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export async function GET(req: NextRequest) {
  // Vercel cron calls this with CRON_SECRET in Authorization header
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []

  try {
    // Step 1: Scrape
    log.push('Step 1: Scraping sources...')
    const scrapeResult = await callAPI('/api/scrape')
    if (scrapeResult.error) throw new Error(`Scrape failed: ${scrapeResult.error}`)
    const digestId = scrapeResult.digest?.id || scrapeResult.id
    log.push(`Scraped ${scrapeResult.itemCount || 0} items. Digest ID: ${digestId}`)

    // Step 2: Generate script + email
    log.push('Step 2: Generating AI script...')
    const genResult = await callAPI('/api/generate', { digestId })
    if (genResult.error) throw new Error(`Generate failed: ${genResult.error}`)
    log.push(`Script generated (${genResult.scriptLength} chars)`)

    // Step 3: Create video
    log.push('Step 3: Starting Luma video generation...')
    const videoResult = await callAPI('/api/video', { digestId })
    if (videoResult.error) throw new Error(`Video failed: ${videoResult.error}`)
    log.push(`Video job started: ${videoResult.lumaGenerationId}`)

    // Step 4: Wait for video (poll up to 10 min)
    log.push('Step 4: Polling video status...')
    let videoReady = false
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 20000)) // wait 20s
      const statusResult = await callAPI(`/api/video?digestId=${digestId}`)
      if (statusResult.status === 'ready') {
        videoReady = true
        log.push(`Video ready: ${statusResult.videoUrl}`)
        break
      }
    }
    if (!videoReady) log.push('Video not ready in time, sending without video')

    // Step 5: Send emails
    log.push('Step 5: Sending emails to subscribers...')
    const sendResult = await callAPI('/api/send', { digestId })
    log.push(`Sent: ${sendResult.sent}, Failed: ${sendResult.failed}`)

    return NextResponse.json({ success: true, log })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.push(`ERROR: ${message}`)
    return NextResponse.json({ success: false, log, error: message }, { status: 500 })
  }
}
