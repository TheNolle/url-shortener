import cron from 'node-cron'
import { runHealthCheckBatch } from './health-monitor'

let isInitialized = false

export function initializeCronJobs() {
  if (isInitialized) {
    console.log('Cron jobs already initialized')
    return
  }

  console.log('Initializing cron jobs...')

  cron.schedule('0 */6 * * *', async () => {
    console.log('Running scheduled health check batch...')
    try {
      await runHealthCheckBatch(100)
      console.log('Health check batch completed')
    } catch (error) {
      console.error('Health check batch failed:', error)
    }
  })

  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily cleanup...')
    try {
      const prisma = (await import('./database')).default
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

      await prisma.clickEvent.deleteMany({
        where: {
          clickedAt: { lt: ninetyDaysAgo },
        },
      })
      console.log('Cleanup completed')
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  })

  cron.schedule('0 3 * * 0', async () => {
    console.log('Running weekly expired URL cleanup...')
    try {
      const prisma = (await import('./database')).default

      await prisma.url.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      })
      console.log('Expired URL cleanup completed')
    } catch (error) {
      console.error('Expired URL cleanup failed:', error)
    }
  })

  isInitialized = true
  console.log('Cron jobs initialized successfully')
}