import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils'
import { AdminUrlManager } from '@/components/admin/admin-url-manager'
import prisma from '@/lib/database'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminUrlsPage() {
  const { userId } = await auth()

  if (!userId || !isAdmin(userId)) {
    redirect('/')
  }

  const urls = await prisma.url.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      analytics: true,
      userUrls: {
        take: 1,
      },
      rotationLinks: {
        select: {
          id: true,
        },
      },
    },
  })

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>URL Management</h1>
        <p className='text-muted-foreground'>
          Full control over all shortened URLs
        </p>
      </div>

      <AdminUrlManager initialUrls={urls as any} />
    </div>
  )
}