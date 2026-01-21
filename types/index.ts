export interface UrlData {
  id: string
  originalUrl: string
  urlHash: string
  shortCode: string
  createdAt: Date
  expiresAt: Date | null
  isActive: boolean
  isFlagged: boolean
  flagReason: string | null
  isPasswordProtected: boolean
  passwordHash: string | null
  isRotation: boolean
  rotationType: 'RANDOM' | 'WEIGHTED' | 'SEQUENTIAL' | null
}

export interface UserUrlData {
  id: string
  userId: string
  urlId: string
  createdAt: Date
}

export interface AnalyticsData {
  id: string
  urlId: string
  clicks: number
  lastClick: Date | null
  ipHash: string | null
  userAgent: string | null
  referer: string | null
  country: string | null
}

export interface ReportData {
  id: string
  urlId: string
  reportedBy: string | null
  reason: string
  createdAt: Date
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy: string | null
  reviewedAt: Date | null
}

export interface ScanResult {
  service: string
  result: 'safe' | 'unsafe' | 'uncertain'
  details?: any
  scannedAt: Date
}

export interface ValidationResult {
  isValid: boolean
  isSafe: boolean
  reason?: string
  scans: ScanResult[]
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export interface AdminStats {
  totalUrls: number
  deletedUrls: number
  totalClicks: number
  totalUsers: number
  pendingReports: number
  flaggedUrls: number
  bannedIps: number
  bannedDomains: number
  last24hUrls: number
  last24hClicks: number
}

export interface BanData {
  id: string
  target: string
  reason: string | null
  bannedAt: Date
  bannedBy: string
}