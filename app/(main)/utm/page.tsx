import { UTMBuilder } from '@/components/utm-builder'
import { Tag, TrendingUp, Target, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function UTMBuilderPage() {
  return (
    <div className='space-y-8'>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='p-4 bg-primary/10 rounded-full'>
            <Tag className='h-12 w-12 text-primary' />
          </div>
        </div>
        <h1 className='text-4xl font-bold'>UTM Campaign Builder</h1>
        <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
          Create trackable URLs with UTM parameters to measure your marketing campaigns
        </p>
      </div>

      <UTMBuilder />

      <div className='grid md:grid-cols-3 gap-6 max-w-4xl mx-auto'>
        <Card>
          <CardContent className='pt-6 text-center space-y-3'>
            <div className='mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center'>
              <Target className='h-6 w-6 text-blue-600' />
            </div>
            <h3 className='font-semibold'>Track Sources</h3>
            <p className='text-sm text-muted-foreground'>
              Identify where your traffic comes from
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6 text-center space-y-3'>
            <div className='mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center'>
              <BarChart3 className='h-6 w-6 text-purple-600' />
            </div>
            <h3 className='font-semibold'>Measure ROI</h3>
            <p className='text-sm text-muted-foreground'>
              Analyze campaign performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6 text-center space-y-3'>
            <div className='mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center'>
              <TrendingUp className='h-6 w-6 text-green-600' />
            </div>
            <h3 className='font-semibold'>Optimize Spend</h3>
            <p className='text-sm text-muted-foreground'>
              Make data-driven decisions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* UTM Guide */}
      <Card className='max-w-4xl mx-auto'>
        <CardContent className='pt-6 space-y-4'>
          <h3 className='text-lg font-semibold'>UTM Parameters Guide</h3>

          <div className='space-y-3 text-sm'>
            <div className='flex gap-3'>
              <code className='bg-muted px-2 py-1 rounded min-w-30'>utm_source</code>
              <div>
                <p className='font-medium'>Campaign Source</p>
                <p className='text-muted-foreground'>
                  Examples: google, facebook, newsletter, twitter
                </p>
              </div>
            </div>

            <div className='flex gap-3'>
              <code className='bg-muted px-2 py-1 rounded min-w-30'>utm_medium</code>
              <div>
                <p className='font-medium'>Campaign Medium</p>
                <p className='text-muted-foreground'>
                  Examples: cpc, email, social, referral, display
                </p>
              </div>
            </div>

            <div className='flex gap-3'>
              <code className='bg-muted px-2 py-1 rounded min-w-30'>utm_campaign</code>
              <div>
                <p className='font-medium'>Campaign Name</p>
                <p className='text-muted-foreground'>
                  Examples: spring_sale, product_launch, black_friday
                </p>
              </div>
            </div>

            <div className='flex gap-3'>
              <code className='bg-muted px-2 py-1 rounded min-w-30'>utm_term</code>
              <div>
                <p className='font-medium'>Campaign Term (Optional)</p>
                <p className='text-muted-foreground'>
                  For paid search keywords
                </p>
              </div>
            </div>

            <div className='flex gap-3'>
              <code className='bg-muted px-2 py-1 rounded min-w-30'>utm_content</code>
              <div>
                <p className='font-medium'>Campaign Content (Optional)</p>
                <p className='text-muted-foreground'>
                  To differentiate similar content or links
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}