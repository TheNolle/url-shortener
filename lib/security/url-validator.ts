import { ValidationResult, ScanResult } from '@/types'
import { detectSuspiciousPatterns } from './pattern-detection'
import { scanWithGoogleSafeBrowsing } from './google-safe-browsing'
import { scanWithVirusTotal } from './virustotal'
import { scanWithUrlert } from './urlert'
import prisma from '../database'
import redis from '../redis'
import { extractDomain, hashUrl } from '../utils'

export async function validateUrl(url: string): Promise<ValidationResult> {
  const scans: ScanResult[] = []
  const urlHash = hashUrl(url)

  const cachedResult = await redis.get(`scan:${urlHash}`)
  if (cachedResult) {
    const parsed = JSON.parse(cachedResult)
    return parsed
  }

  const domain = extractDomain(url)
  if (domain) {
    const bannedDomain = await prisma.bannedDomain.findUnique({ where: { domain } })
    if (bannedDomain) {
      return {
        isValid: false,
        isSafe: false,
        reason: `Domain is banned: ${bannedDomain.reason || 'No reason provided'}`,
        scans: [],
      }
    }
  }

  const patternResult = await detectSuspiciousPatterns(url)
  if (patternResult.isSuspicious && patternResult.severity === 'high') {
    const result: ValidationResult = {
      isValid: false,
      isSafe: false,
      reason: `Suspicious pattern detected: ${patternResult.reasons.join(', ')}`,
      scans: [],
    }
    await cacheResult(urlHash, result)
    return result
  }

  const googleScan = await scanWithGoogleSafeBrowsing(url)
  scans.push(googleScan)

  if (googleScan.result === 'unsafe') {
    const result: ValidationResult = {
      isValid: false,
      isSafe: false,
      reason: 'URL flagged as unsafe by Google Safe Browsing',
      scans,
    }
    await saveScans(url, scans)
    await cacheResult(urlHash, result)
    return result
  }

  if (googleScan.result === 'safe') {
    const result: ValidationResult = {
      isValid: true,
      isSafe: true,
      scans,
    }
    await saveScans(url, scans)
    await cacheResult(urlHash, result)
    return result
  }

  const vtScan = await scanWithVirusTotal(url)
  scans.push(vtScan)

  if (vtScan.result === 'unsafe') {
    const result: ValidationResult = {
      isValid: false,
      isSafe: false,
      reason: 'URL flagged by multiple antivirus engines',
      scans,
    }
    await saveScans(url, scans)
    await cacheResult(urlHash, result)
    return result
  }

  if (vtScan.result === 'safe') {
    const result: ValidationResult = {
      isValid: true,
      isSafe: true,
      scans,
    }
    await saveScans(url, scans)
    await cacheResult(urlHash, result)
    return result
  }

  const urlertScan = await scanWithUrlert(url)
  scans.push(urlertScan)

  const isSafe = urlertScan.result === 'safe'
  const result: ValidationResult = {
    isValid: isSafe,
    isSafe,
    reason: isSafe ? undefined : 'URL flagged as potentially unsafe',
    scans,
  }

  await saveScans(url, scans)
  await cacheResult(urlHash, result)
  return result
}

async function saveScans(url: string, scans: ScanResult[]): Promise<void> {
  try {
    const urlHash = hashUrl(url)
    const urlRecord = await prisma.url.findUnique({
      where: { urlHash },
    })

    if (!urlRecord) return

    for (const scan of scans) {
      await prisma.urlScan.create({
        data: {
          urlId: urlRecord.id,
          service: scan.service,
          result: scan.result,
          details: scan.details || {},
          scannedAt: scan.scannedAt,
        },
      })
    }
  } catch (error) {
    console.error('Error saving scans:', error)
  }
}

async function cacheResult(urlHash: string, result: ValidationResult): Promise<void> {
  try {
    await redis.setex(`scan:${urlHash}`, 86400, JSON.stringify(result))
  } catch (error) {
    console.error('Error caching scan result:', error)
  }
}