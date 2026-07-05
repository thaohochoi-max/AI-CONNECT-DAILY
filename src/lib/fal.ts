import axios from 'axios'

const FAL_QUEUE_BASE = 'https://queue.fal.run'
const FAL_ENDPOINT = 'fal-ai/wan-25-preview/text-to-video'
// Status/result URLs live under the app namespace, without the /text-to-video suffix
const FAL_APP = 'fal-ai/wan-25-preview'

type FalGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

type FalGeneration = {
  id: string
  state: FalGenerationStatus
  assets?: {
    video?: string
    thumbnail?: string
  }
  failure_reason?: string
}

function falHeaders() {
  return { Authorization: `Key ${process.env.FAL_KEY}` }
}

export async function createVideoFromScript(script: string, date: string): Promise<string> {
  const visualPrompt = extractVisualPrompt(script, date)

  const response = await axios.post(
    `${FAL_QUEUE_BASE}/${FAL_ENDPOINT}`,
    {
      prompt: visualPrompt,
      aspect_ratio: '16:9',
      duration: '5',
      resolution: '720p',
    },
    { headers: { ...falHeaders(), 'Content-Type': 'application/json' } }
  )

  return response.data.request_id as string
}

export async function checkVideoStatus(requestId: string): Promise<FalGeneration> {
  const statusRes = await axios.get(
    `${FAL_QUEUE_BASE}/${FAL_APP}/requests/${requestId}/status`,
    { headers: falHeaders() }
  )
  const status = statusRes.data.status as 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'

  if (status === 'IN_QUEUE') return { id: requestId, state: 'pending' }
  if (status === 'IN_PROGRESS') return { id: requestId, state: 'processing' }

  // COMPLETED — fetch the actual result payload (fal.ai returns an error body here if generation failed)
  try {
    const resultRes = await axios.get(
      `${FAL_QUEUE_BASE}/${FAL_APP}/requests/${requestId}`,
      { headers: falHeaders() }
    )
    const video = resultRes.data.video as { url?: string } | undefined

    if (!video?.url) {
      return { id: requestId, state: 'failed', failure_reason: 'No video in fal.ai result' }
    }

    return { id: requestId, state: 'completed', assets: { video: video.url } }
  } catch (err) {
    const message = axios.isAxiosError(err) ? JSON.stringify(err.response?.data) : String(err)
    return { id: requestId, state: 'failed', failure_reason: message }
  }
}

function extractVisualPrompt(script: string, date: string): string {
  const visuals = script.match(/\[([^\]]+)\]/g)?.map(v => v.replace(/[\[\]]/g, '')) || []
  const visualText = visuals.slice(0, 3).join(', ')

  return `Tech news video intro for ${date}. Modern digital interface showing AI tools and technology updates. ${visualText ? `Visuals include: ${visualText}.` : ''} Clean, professional, futuristic style with Vietnamese text overlays. Bright colors, smooth animations, tech aesthetic.`
}
