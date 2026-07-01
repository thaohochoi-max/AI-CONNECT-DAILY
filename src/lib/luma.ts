import axios from 'axios'

const LUMA_API_BASE = 'https://api.lumalabs.ai/dream-machine/v1'

type LumaGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

type LumaGeneration = {
  id: string
  state: LumaGenerationStatus
  assets?: {
    video?: string
    thumbnail?: string
  }
  failure_reason?: string
}

export async function createVideoFromScript(script: string, date: string): Promise<string> {
  // Extract key visuals from script for prompt
  const visualPrompt = extractVisualPrompt(script, date)

  const response = await axios.post(
    `${LUMA_API_BASE}/generations`,
    {
      prompt: visualPrompt,
      aspect_ratio: '16:9',
      loop: false,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data.id as string
}

export async function checkVideoStatus(generationId: string): Promise<LumaGeneration> {
  const response = await axios.get(`${LUMA_API_BASE}/generations/${generationId}`, {
    headers: {
      Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
    },
  })
  return response.data as LumaGeneration
}

export async function pollVideoReady(
  generationId: string,
  maxWaitMs = 300000
): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  const start = Date.now()
  const interval = 10000 // check every 10 seconds

  while (Date.now() - start < maxWaitMs) {
    const gen = await checkVideoStatus(generationId)

    if (gen.state === 'completed' && gen.assets?.video) {
      return {
        videoUrl: gen.assets.video,
        thumbnailUrl: gen.assets.thumbnail || '',
      }
    }

    if (gen.state === 'failed') {
      throw new Error(`Luma video generation failed: ${gen.failure_reason}`)
    }

    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error('Video generation timed out')
}

function extractVisualPrompt(script: string, date: string): string {
  // Pull visual hints from script (text in brackets)
  const visuals = script.match(/\[([^\]]+)\]/g)?.map(v => v.replace(/[\[\]]/g, '')) || []
  const visualText = visuals.slice(0, 3).join(', ')

  return `Tech news video intro for ${date}. Modern digital interface showing AI tools and technology updates. ${visualText ? `Visuals include: ${visualText}.` : ''} Clean, professional, futuristic style with Vietnamese text overlays. Bright colors, smooth animations, tech aesthetic.`
}
