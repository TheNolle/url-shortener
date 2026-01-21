import { getAdminStats } from '@/lib/analytics'
import { StatsCards } from '@/components/admin/stats-cards'
import { ReportQueue } from '@/components/admin/report-queue'
import prisma from '@/lib/database'

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  const pendingReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    include: { url: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-muted-foreground'>
          Overview of your URL shortener system
        </p>
      </div>

      <StatsCards stats={stats} />

      <ReportQueue initialReports={pendingReports as any} />
    </div>
  )
}