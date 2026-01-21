import { ImageResponse } from 'next/og'
import { getUrlByShortCode } from '@/lib/shortener'
import prisma from '@/lib/database'

export const runtime = 'nodejs'
export const alt = 'URL Preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface RouteContext {
  params: Promise<{ code: string }>
}

export default async function Image({ params }: RouteContext) {
  const { code } = await params

  const url = await getUrlByShortCode(code)

  if (!url) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui',
            color: 'white',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 'bold' }}>URL Not Found</div>
        </div>
      ),
      size
    )
  }

  const metadata = await prisma.linkMetadata.findUnique({
    where: { urlId: url.id },
  })

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'system-ui',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px',
              fontSize: '32px',
            }}
          >
            🔗
          </div>
          <div style={{ fontSize: 40, fontWeight: 'bold', color: '#667eea' }}>
            S
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 50,
              fontWeight: 'bold',
              color: '#1a202c',
              marginBottom: '20px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {metadata?.title || 'Shortened Link'}
          </div>

          {metadata?.description && (
            <div
              style={{
                fontSize: 28,
                color: '#718096',
                marginBottom: '30px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {metadata.description}
            </div>
          )}

          <div
            style={{
              fontSize: 24,
              color: '#a0aec0',
              fontFamily: 'monospace',
            }}
          >
            {process.env.NEXT_PUBLIC_BASE_URL?.replace('https://', '')}/{code}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 20,
            color: '#48bb78',
            marginTop: '40px',
          }}
        >
          <span style={{ marginRight: '10px' }}>🛡️</span>
          Protected by M.Y.B.™ Technology
        </div>
      </div>
    ),
    size
  )
}
