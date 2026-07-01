import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createVideoFromScript, checkVideoStatus } from '@/lib/luma'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { digestId } = await req.json()
  const db = getSupabaseAdmin()

  const { data: digest } = await db
    .from('digests')
    .select('*')
    .eq('id', digestId)
    .single()

  if (!digest?.script) {
    return NextResponse.json({ error: 'Script not generated yet' }, { status: 400 })
  }

  const lumaGenerationId = await createVideoFromScript(digest.script, digest.date)

  const { data: video } = await db
    .from('videos')
    .insert({ digest_id: digestId, luma_generation_id: lumaGenerationId, status: 'generating' })
    .select()
    .single()

  await db.from('digests').update({ status: 'video_generating' }).eq('id', digestId)

  return NextResponse.json({ success: true, videoId: video?.id, lumaGenerationId })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const digestId = searchParams.get('digestId')
  if (!digestId) return NextResponse.json({ error: 'Missing digestId' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: video } = await db
    .from('videos')
    .select('*')
    .eq('digest_id', digestId)
    .single()

  if (!video?.luma_generation_id) {
    return NextResponse.json({ status: 'not_started' })
  }

  const gen = await checkVideoStatus(video.luma_generation_id)

  if (gen.state === 'completed' && gen.assets?.video) {
    await db
      .from('videos')
      .update({ video_url: gen.assets.video, thumbnail_url: gen.assets.thumbnail, status: 'ready' })
      .eq('id', video.id)

    await db.from('digests').update({ status: 'video_ready' }).eq('id', digestId)

    return NextResponse.json({ status: 'ready', videoUrl: gen.assets.video })
  }

  return NextResponse.json({ status: gen.state })
}
