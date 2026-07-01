import axios from 'axios'
import * as cheerio from 'cheerio'
import type { ToolItem } from '@/lib/supabase'

async function scrapeProductHunt(): Promise<ToolItem[]> {
  try {
    const { data } = await axios.get('https://www.producthunt.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyToolDigest/1.0)' },
      timeout: 10000,
    })
    const $ = cheerio.load(data)
    const items: ToolItem[] = []

    // Product Hunt daily products
    $('[data-test="product-item"]').slice(0, 5).each((_, el) => {
      const title = $(el).find('h3').text().trim()
      const description = $(el).find('[data-test="tagline"]').text().trim()
      const href = $(el).find('a').first().attr('href') || ''
      if (title) {
        items.push({
          title,
          description,
          url: href.startsWith('http') ? href : `https://www.producthunt.com${href}`,
          source: 'Product Hunt',
          category: 'New Launch',
        })
      }
    })
    return items
  } catch {
    return []
  }
}

async function scrapeTheRundown(): Promise<ToolItem[]> {
  try {
    const { data } = await axios.get('https://www.therundown.ai', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyToolDigest/1.0)' },
      timeout: 10000,
    })
    const $ = cheerio.load(data)
    const items: ToolItem[] = []

    $('article, .post-item, .story').slice(0, 4).each((_, el) => {
      const title = $(el).find('h2, h3, .title').first().text().trim()
      const description = $(el).find('p, .excerpt, .summary').first().text().trim()
      const href = $(el).find('a').first().attr('href') || ''
      if (title) {
        items.push({
          title,
          description: description.slice(0, 200),
          url: href.startsWith('http') ? href : `https://www.therundown.ai${href}`,
          source: 'The Rundown AI',
          category: 'AI News',
        })
      }
    })
    return items
  } catch {
    return []
  }
}

async function scrapeTechCrunchAI(): Promise<ToolItem[]> {
  try {
    const { data } = await axios.get('https://techcrunch.com/category/artificial-intelligence/feed/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyToolDigest/1.0)' },
      timeout: 10000,
    })
    const $ = cheerio.load(data, { xmlMode: true })
    const items: ToolItem[] = []

    $('item').slice(0, 4).each((_, el) => {
      const title = $(el).find('title').text().trim()
      const description = $(el).find('description').text().replace(/<[^>]*>/g, '').trim()
      const url = $(el).find('link').text().trim()
      if (title) {
        items.push({
          title,
          description: description.slice(0, 200),
          url,
          source: 'TechCrunch AI',
          category: 'Tech News',
        })
      }
    })
    return items
  } catch {
    return []
  }
}

async function scrapeToolify(): Promise<ToolItem[]> {
  try {
    const { data } = await axios.get('https://www.toolify.ai/new', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyToolDigest/1.0)' },
      timeout: 10000,
    })
    const $ = cheerio.load(data)
    const items: ToolItem[] = []

    $('.tool-card, [class*="tool"]').slice(0, 4).each((_, el) => {
      const title = $(el).find('h3, h2, .name').first().text().trim()
      const description = $(el).find('p, .desc').first().text().trim()
      const href = $(el).find('a').first().attr('href') || ''
      if (title) {
        items.push({
          title,
          description: description.slice(0, 200),
          url: href.startsWith('http') ? href : `https://www.toolify.ai${href}`,
          source: 'Toolify',
          category: 'AI Tool',
        })
      }
    })
    return items
  } catch {
    return []
  }
}

export async function scrapeAllSources(): Promise<ToolItem[]> {
  const [productHunt, rundown, techCrunch, toolify] = await Promise.allSettled([
    scrapeProductHunt(),
    scrapeTheRundown(),
    scrapeTechCrunchAI(),
    scrapeToolify(),
  ])

  const allItems: ToolItem[] = [
    ...(productHunt.status === 'fulfilled' ? productHunt.value : []),
    ...(rundown.status === 'fulfilled' ? rundown.value : []),
    ...(techCrunch.status === 'fulfilled' ? techCrunch.value : []),
    ...(toolify.status === 'fulfilled' ? toolify.value : []),
  ]

  // Remove duplicates by title
  const seen = new Set<string>()
  return allItems.filter(item => {
    const key = item.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
