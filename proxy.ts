import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/shorten',
  '/api/webhooks/clerk',
  '/api/cron(.*)',
  '/preview(.*)',
  '/[code]',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth()

  if (isAdminRoute(request)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const adminIds = process.env.ADMIN_USER_IDS?.split(',') || []
    if (!adminIds.includes(userId)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (isPublicRoute(request)) {
    return NextResponse.next()
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}