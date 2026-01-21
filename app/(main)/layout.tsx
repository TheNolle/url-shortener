import { UserButton, SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Shield, Flag, Key, Shuffle, Tag, Activity } from 'lucide-react'
import { isAdmin } from '@/lib/utils'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  const showAdminButton = userId && isAdmin(userId)

  return (
    <div className='min-h-screen flex flex-col'>
      <header className='border-b'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2 font-bold text-xl'>
            <Shield className='h-6 w-6 text-primary' />
            <span>S</span>
          </Link>
          <div className='flex items-center gap-4'>
            <Link href='/report'>
              <Button variant='ghost' size='sm'>
                <Flag className='h-4 w-4 mr-2' />
                Report URL
              </Button>
            </Link>
            <SignedIn>
              <Link href='/utm'>
                <Button variant='ghost' size='sm'>
                  <Tag className='h-4 w-4 mr-2' />
                  UTM Builder
                </Button>
              </Link>
              <Link href='/rotation'>
                <Button variant='ghost' size='sm'>
                  <Shuffle className='h-4 w-4 mr-2' />
                  A/B Testing
                </Button>
              </Link>
              <Link href='/health'>
                <Button variant='ghost' size='sm'>
                  <Activity className='h-4 w-4 mr-2' />
                  Health Monitor
                </Button>
              </Link>
              <Link href='/settings/api-keys'>
                <Button variant='ghost' size='sm'>
                  <Key className='h-4 w-4 mr-2' />
                  API Keys
                </Button>
              </Link>
              {showAdminButton && (
                <Link href='/admin'>
                  <Button variant='outline' size='sm'>
                    <Shield className='h-4 w-4 mr-2' />
                    Dashboard
                  </Button>
                </Link>
              )}
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <Button variant='outline' size='sm'>
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size='sm'>Sign Up</Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </header>
      <main className='flex-1 container mx-auto px-4 py-8'>
        {children}
      </main>
      <footer className='border-t py-6 text-center text-sm text-muted-foreground'>
        <p>Protected by M.Y.B.™ Technology</p>
      </footer>
    </div>
  )
}