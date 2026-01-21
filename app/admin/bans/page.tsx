import { BanManager } from '@/components/admin/ban-manager'
import prisma from '@/lib/database'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminBansPage() {
  const [bannedIps, bannedDomains] = await Promise.all([
    prisma.bannedIp.findMany({ orderBy: { bannedAt: 'desc' } }),
    prisma.bannedDomain.findMany({ orderBy: { bannedAt: 'desc' } }),
  ])

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>Ban Management</h1>
        <p className='text-muted-foreground'>
          Manage banned IPs and domains
        </p>
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
        <BanManager
          type='ip'
          initialBans={bannedIps.map(b => ({
            id: b.id,
            target: b.ip,
            reason: b.reason,
            bannedAt: b.bannedAt.toISOString(),
            bannedBy: b.bannedBy,
          }))}
        />

        <BanManager
          type='domain'
          initialBans={bannedDomains.map(b => ({
            id: b.id,
            target: b.domain,
            reason: b.reason,
            bannedAt: b.bannedAt.toISOString(),
            bannedBy: b.bannedBy,
          }))}
        />
      </div>
    </div>
  )
}
