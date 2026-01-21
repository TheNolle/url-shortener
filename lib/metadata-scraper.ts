import metascraper from 'metascraper'
import metascraperAuthor from 'metascraper-author'
import metascraperDate from 'metascraper-date'
import metascraperDescription from 'metascraper-description'
import metascraperImage from 'metascraper-image'
import metascraperLogo from 'metascraper-logo'
import metascraperPublisher from 'metascraper-publisher'
import metascraperTitle from 'metascraper-title'
import metascraperUrl from 'metascraper-url'
import prisma from './database'

const scraper = metascraper([
  metascraperAuthor(),
  metascraperDate(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperPublisher(),
  metascraperTitle(),
  metascraperUrl(),
])

export interface MetadataResult {
  title?: string
  description?: string
  image?: string
  logo?: string
  author?: string
  publisher?: string
  date?: string
  url?: string
  favicon?: string
}

export async function scrapeMetadata(url: string): Promise<MetadataResult | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLShortenerBot/1.0)',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const metadata = await scraper({ html, url })

    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
    const favicon = faviconMatch ? new URL(faviconMatch[1], url).href : `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`

    return {
      title: metadata.title || undefined,
      description: metadata.description || undefined,
      image: metadata.image || undefined,
      logo: metadata.logo || undefined,
      author: metadata.author || undefined,
      publisher: metadata.publisher || undefined,
      date: metadata.date || undefined,
      url: metadata.url || url,
      favicon,
    }
  } catch (error) {
    console.error('Metadata scraping error:', error)
    return null
  }
}

export async function saveMetadata(urlId: string, metadata: MetadataResult): Promise<void> {
  try {
    await prisma.linkMetadata.upsert({
      where: { urlId },
      update: {
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        logo: metadata.logo,
        author: metadata.author,
        publisher: metadata.publisher,
        date: metadata.date ? new Date(metadata.date) : null,
        favicon: metadata.favicon,
        scrapedAt: new Date(),
      },
      create: {
        urlId,
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        logo: metadata.logo,
        author: metadata.author,
        publisher: metadata.publisher,
        date: metadata.date ? new Date(metadata.date) : null,
        favicon: metadata.favicon,
      },
    })
  } catch (error) {
    console.error('Save metadata error:', error)
  }
}

export async function getMetadata(urlId: string): Promise<MetadataResult | null> {
  try {
    const metadata = await prisma.linkMetadata.findUnique({
      where: { urlId },
    })

    if (!metadata) return null

    return {
      title: metadata.title || undefined,
      description: metadata.description || undefined,
      image: metadata.image || undefined,
      logo: metadata.logo || undefined,
      author: metadata.author || undefined,
      publisher: metadata.publisher || undefined,
      date: metadata.date?.toISOString(),
      favicon: metadata.favicon || undefined,
    }
  } catch (error) {
    console.error('Get metadata error:', error)
    return null
  }
}

export async function scrapeAndSaveMetadata(urlId: string, url: string): Promise<MetadataResult | null> {
  const metadata = await scrapeMetadata(url)
  if (metadata) {
    await saveMetadata(urlId, metadata)
  }
  return metadata
}
