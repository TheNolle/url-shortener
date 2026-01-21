import { extractDomain } from '../utils'

const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq',
  '.xyz', '.top', '.work', '.date', '.stream',
  '.download', '.loan', '.win', '.bid', '.racing'
]

const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'secure', 'account', 'verify',
  'update', 'confirm', 'banking', 'paypal', 'amazon',
  'facebook', 'google', 'microsoft', 'apple'
]

const HOMOGRAPH_PATTERNS = [
  /[а-яА-Я]/, // Cyrillic
  /[α-ωΑ-Ω]/, // Greek
  /[\u0600-\u06FF]/, // Arabic
]

export interface PatternResult {
  isSuspicious: boolean
  reasons: string[]
  severity: 'low' | 'medium' | 'high'
}

export async function detectSuspiciousPatterns(url: string): Promise<PatternResult> {
  const reasons: string[] = []
  let severity: 'low' | 'medium' | 'high' = 'low'

  const domain = extractDomain(url)
  if (!domain) {
    return { isSuspicious: true, reasons: ['Invalid domain'], severity: 'high' }
  }

  const hasSuspiciousTld = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld))
  if (hasSuspiciousTld) {
    reasons.push('Suspicious TLD detected')
    severity = 'medium'
  }

  for (const pattern of HOMOGRAPH_PATTERNS) {
    if (pattern.test(domain)) {
      reasons.push('Potential homograph attack (non-Latin characters)')
      severity = 'high'
      break
    }
  }

  const lowerDomain = domain.toLowerCase()
  const hasSuspiciousKeyword = SUSPICIOUS_KEYWORDS.some(keyword =>
    lowerDomain.includes(keyword) && !lowerDomain.endsWith('.com')
  )
  if (hasSuspiciousKeyword) {
    reasons.push('Domain contains suspicious keywords')
    severity = severity === 'high' ? 'high' : 'medium'
  }

  const subdomainCount = domain.split('.').length - 2
  if (subdomainCount > 3) {
    reasons.push('Excessive subdomain levels')
    severity = 'medium'
  }

  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    reasons.push('IP address used instead of domain')
    severity = 'medium'
  }

  if (url.length > 500) {
    reasons.push('Unusually long URL')
    severity = 'low'
  }

  const isSuspicious = reasons.length > 0

  return { isSuspicious, reasons, severity }
}