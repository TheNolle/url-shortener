import { NextRequest, NextResponse } from 'next/server'
import { runHealthCheckBatch } from '@/lib/health-monitor'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await runHealthCheckBatch(100)

    return NextResponse.json({
      success: true,
      message: 'Health check batch completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
