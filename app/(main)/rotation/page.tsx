import { RotationCreator } from '@/components/rotation-creator'
import { Shuffle } from 'lucide-react'

export default function RotationPage() {
  return (
    <div className='space-y-8'>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='p-4 bg-primary/10 rounded-full'>
            <Shuffle className='h-12 w-12 text-primary' />
          </div>
        </div>
        <h1 className='text-4xl font-bold'>A/B Testing & Link Rotation</h1>
        <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
          Create smart links that rotate between multiple destinations for testing and optimization
        </p>
      </div>

      <RotationCreator />

      <div className='grid md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
        <div className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center'>
            <Shuffle className='h-6 w-6 text-blue-600' />
          </div>
          <h3 className='font-semibold'>Random Distribution</h3>
          <p className='text-sm text-muted-foreground'>
            Equal traffic split across all destinations
          </p>
        </div>

        <div className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center'>
            <Shuffle className='h-6 w-6 text-purple-600' />
          </div>
          <h3 className='font-semibold'>Weighted Split</h3>
          <p className='text-sm text-muted-foreground'>
            Custom traffic allocation for A/B testing
          </p>
        </div>

        <div className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center'>
            <Shuffle className='h-6 w-6 text-green-600' />
          </div>
          <h3 className='font-semibold'>Sequential</h3>
          <p className='text-sm text-muted-foreground'>
            Round-robin rotation through destinations
          </p>
        </div>
      </div>
    </div>
  )
}
