import { load } from 'cheerio'
import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'
import prisma from './database'

export async function scrapeAndSaveMetadata(urlId: string, targetUrl: string) {
  try {
    const metadata = await scrapeMetadata(targetUrl)

    await prisma.linkMetadata.upsert({
      where: { urlId },
      create: {
        urlId,
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        favicon: metadata.favicon,
        author: metadata.article?.author || null,
        publisher: metadata.article?.siteName || null,
        date: null,
        logo: metadata.favicon,
        scrapedAt: new Date()
      },
      update: {
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        favicon: metadata.favicon,
        author: metadata.article?.author || null,
        publisher: metadata.article?.siteName || null,
        logo: metadata.favicon,
        scrapedAt: new Date()
      }
    })

    return {
      success: true,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        image: metadata.image,
        favicon: metadata.favicon
      }
    }
  } catch (error) {
    console.error('Failed to scrape and save metadata:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function scrapeMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = load(html)
    const articleContent = extractArticleContent(url, html)

    const metadata = {
      title: extractTitle($, articleContent),
      description: extractDescription($, articleContent),
      image: extractImage($),
      favicon: extractFavicon($, url),

      article: articleContent ? {
        content: articleContent.content,
        textContent: articleContent.textContent,
        excerpt: articleContent.excerpt,
        author: articleContent.byline,
        length: articleContent.length,
        siteName: articleContent.siteName
      } : null,

      openGraph: extractOpenGraph($),
      twitterCard: extractTwitterCard($),
      canonical: $('link[rel="canonical"]').attr('href') || url,
      language: $('html').attr('lang') || articleContent?.lang || 'en',
      keywords: $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || []
    }

    return metadata

  } catch (error) {
    console.error('Metadata scraping failed:', error)
    return {
      title: 'Unknown',
      description: '',
      image: null,
      favicon: null,
      article: null,
      openGraph: {},
      twitterCard: {},
      canonical: url,
      language: 'en',
      keywords: []
    }
  }
}

export async function getMetadata(urlId: string) {
  try {
    const metadata = await prisma.linkMetadata.findUnique({
      where: { urlId }
    })
    return metadata
  } catch (error) {
    console.error('Failed to get metadata:', error)
    return null
  }
}

export async function refreshMetadata(urlId: string, targetUrl: string) {
  try {
    await prisma.linkMetadata.delete({
      where: { urlId }
    }).catch(() => { })

    return await scrapeAndSaveMetadata(urlId, targetUrl)
  } catch (error) {
    console.error('Failed to refresh metadata:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function batchScrapeMetadata(urls: { urlId: string; targetUrl: string }[]) {
  const results = await Promise.allSettled(
    urls.map(({ urlId, targetUrl }) => scrapeAndSaveMetadata(urlId, targetUrl))
  )

  return results.map((result, index) => ({
    urlId: urls[index].urlId,
    success: result.status === 'fulfilled' ? result.value.success : false,
    error: result.status === 'rejected' ? result.reason : undefined
  }))
}

function extractArticleContent(url: string, html: string) {
  try {
    const { document } = parseHTML(html)

    const unwantedSelectors = [
      'script', 'style', 'noscript', 'iframe',
      'footer', 'header', 'nav', 'aside',
      '.advertisement', '.sidebar', '.menu',
      '.cookie-banner', '.popup', '.modal'
    ]

    unwantedSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((el: any) => el.remove())
    })

    const reader = new Readability(document, {
      charThreshold: 100,
      keepClasses: false
    })

    const article = reader.parse()

    if (!article) return null

    return {
      title: article.title || '',
      content: article.content || '',
      textContent: article.textContent || '',
      excerpt: article.excerpt || '',
      byline: article.byline || '',
      length: article.length || 0,
      siteName: article.siteName || '',
      lang: article.lang || ''
    }
  } catch (error) {
    console.error('Readability extraction failed:', error)
    return null
  }
}

function extractTitle($: any, articleContent: any) {
  return (
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    articleContent?.title ||
    $('title').text() ||
    $('h1').first().text() ||
    'No title'
  ).trim()
}

function extractDescription($: any, articleContent: any) {
  return (
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    articleContent?.excerpt ||
    $('p').first().text().substring(0, 200) ||
    ''
  ).trim()
}

function extractImage($: any) {
  return (
    $('meta[property="og:image"]').attr('content') ||
    $('meta[property="og:image:url"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[itemprop="image"]').attr('content') ||
    $('img').first().attr('src') ||
    null
  )
}

function extractFavicon($: any, baseUrl: string) {
  const favicon = (
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href') ||
    '/favicon.ico'
  )

  if (!favicon) return null

  try {
    return new URL(favicon, baseUrl).href
  } catch {
    return favicon
  }
}

function extractOpenGraph($: any) {
  const ogData: Record<string, string> = {}

  $('meta[property^="og:"]').each((_: any, element: any) => {
    const property = $(element).attr('property')
    const content = $(element).attr('content')

    if (property && content) {
      const key = property.replace('og:', '')
      ogData[key] = content.trim()
    }
  })

  return ogData
}

function extractTwitterCard($: any) {
  const twitterData: Record<string, string> = {}

  $('meta[name^="twitter:"]').each((_: any, element: any) => {
    const name = $(element).attr('name')
    const content = $(element).attr('content')

    if (name && content) {
      const key = name.replace('twitter:', '')
      twitterData[key] = content.trim()
    }
  })

  return twitterData
}

export async function scrapeBasicMetadata(url: string) {
  const metadata = await scrapeMetadata(url)
  return {
    title: metadata.title,
    description: metadata.description,
    image: metadata.image,
    favicon: metadata.favicon
  }
}
