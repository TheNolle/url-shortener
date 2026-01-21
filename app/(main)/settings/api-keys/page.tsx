import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ApiKeysManager } from '@/components/api-keys-manager'

export default async function ApiKeysPage() {
  const { userId } = await auth()

  if (!userId) redirect('/sign-in')

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>API Keys</h1>
        <p className='text-muted-foreground'>
          Manage your API keys for programmatic access
        </p>
      </div>

      <ApiKeysManager />
    </div>
  )
}
