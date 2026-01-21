import { ReportQueue } from '@/components/admin/report-queue'
import prisma from '@/lib/database'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminReportsPage() {
  const allReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    include: { url: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>Report Management</h1>
        <p className='text-muted-foreground'>
          Review and manage reported URLs
        </p>
      </div>

      <ReportQueue initialReports={allReports as any} />
    </div>
  )
}