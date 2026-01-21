import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Shield, Home, Flag, Ban, Link2, Activity } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()

  if (!userId || !isAdmin(userId)) {
    redirect('/')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/urls', label: 'URLs', icon: Link2 },
    { href: '/admin/reports', label: 'Reports', icon: Flag },
    { href: '/admin/bans', label: 'Bans', icon: Ban },
    { href: '/admin/health', label: 'Health', icon: Activity },
  ]

  return (
    <div className='min-h-screen flex flex-col'>
      <header className='border-b bg-card'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-6'>
            <Link href='/admin' className='flex items-center gap-2 font-bold text-xl'>
              <Shield className='h-6 w-6 text-primary' />
              <span>Admin Panel</span>
            </Link>
            <nav className='flex items-center gap-4'>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className='flex items-center gap-2 text-sm hover:text-primary transition-colors'
                >
                  <item.icon className='h-4 w-4' />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className='flex items-center gap-4'>
            <Link href='/' className='text-sm text-muted-foreground hover:text-foreground'>
              ← Back to Site
            </Link>
            <UserButton />
          </div>
        </div>
      </header>
      <main className='flex-1 container mx-auto px-4 py-8'>
        {children}
      </main>
    </div>
  )
}
