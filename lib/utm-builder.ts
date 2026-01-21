export interface UTMParams {
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
}

export interface UTMPreset {
  name: string
  description: string
  params: Partial<UTMParams>
}

export const UTM_PRESETS: UTMPreset[] = [
  {
    name: 'Facebook Ad',
    description: 'Facebook advertising campaign',
    params: {
      source: 'facebook',
      medium: 'cpc',
    },
  },
  {
    name: 'Google Ads',
    description: 'Google AdWords campaign',
    params: {
      source: 'google',
      medium: 'cpc',
    },
  },
  {
    name: 'Twitter Post',
    description: 'Organic Twitter post',
    params: {
      source: 'twitter',
      medium: 'social',
    },
  },
  {
    name: 'LinkedIn Post',
    description: 'Organic LinkedIn post',
    params: {
      source: 'linkedin',
      medium: 'social',
    },
  },
  {
    name: 'Email Newsletter',
    description: 'Email marketing campaign',
    params: {
      source: 'newsletter',
      medium: 'email',
    },
  },
  {
    name: 'Instagram Story',
    description: 'Instagram story link',
    params: {
      source: 'instagram',
      medium: 'social',
    },
  },
  {
    name: 'YouTube Video',
    description: 'YouTube video description',
    params: {
      source: 'youtube',
      medium: 'video',
    },
  },
  {
    name: 'Blog Post',
    description: 'Blog content link',
    params: {
      source: 'blog',
      medium: 'referral',
    },
  },
]

export function buildUTMUrl(baseUrl: string, params: UTMParams): string {
  try {
    const url = new URL(baseUrl)

    if (params.source) {
      url.searchParams.set('utm_source', params.source)
    }
    if (params.medium) {
      url.searchParams.set('utm_medium', params.medium)
    }
    if (params.campaign) {
      url.searchParams.set('utm_campaign', params.campaign)
    }
    if (params.term) {
      url.searchParams.set('utm_term', params.term)
    }
    if (params.content) {
      url.searchParams.set('utm_content', params.content)
    }

    return url.toString()
  } catch (error) {
    throw new Error('Invalid URL format')
  }
}

export function parseUTMUrl(url: string): UTMParams | null {
  try {
    const urlObj = new URL(url)
    const source = urlObj.searchParams.get('utm_source')
    const medium = urlObj.searchParams.get('utm_medium')
    const campaign = urlObj.searchParams.get('utm_campaign')

    if (!source || !medium || !campaign) return null

    return {
      source,
      medium,
      campaign,
      term: urlObj.searchParams.get('utm_term') || undefined,
      content: urlObj.searchParams.get('utm_content') || undefined,
    }
  } catch (error) {
    return null
  }
}

export function validateUTMParams(params: Partial<UTMParams>): string[] {
  const errors: string[] = []

  if (!params.source?.trim()) {
    errors.push('Source is required')
  }
  if (!params.medium?.trim()) {
    errors.push('Medium is required')
  }
  if (!params.campaign?.trim()) {
    errors.push('Campaign is required')
  }

  return errors
}

export function getUTMSuggestions() {
  return {
    source: [
      'google',
      'facebook',
      'twitter',
      'linkedin',
      'instagram',
      'youtube',
      'newsletter',
      'blog',
      'reddit',
      'tiktok',
    ],
    medium: [
      'cpc',
      'social',
      'email',
      'referral',
      'organic',
      'display',
      'video',
      'banner',
      'affiliate',
    ],
    campaign: [
      'spring_sale_2026',
      'product_launch',
      'black_friday',
      'webinar',
      'holiday_promo',
      'brand_awareness',
    ],
  }
}
