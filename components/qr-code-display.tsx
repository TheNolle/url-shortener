'use client'

import { useEffect, useState } from 'react'
import { generateQRCode } from '@/lib/qr-code'
import Image from 'next/image'

interface QRCodeDisplayProps {
  url: string
  size?: number
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateQRCode(url)
      .then(setQrCode)
      .catch((err) => {
        console.error('QR generation error:', err)
        setError('Failed to generate QR code')
      })
      .finally(() => setLoading(false))
  }, [url])

  if (loading) {
    return (
      <div className='flex items-center justify-center' style={{ width: size, height: size }}>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
      </div>
    )
  }

  if (error || !qrCode) {
    return (
      <div className='flex items-center justify-center bg-muted rounded-lg' style={{ width: size, height: size }}>
        <p className='text-sm text-muted-foreground'>{error || 'Failed to load'}</p>
      </div>
    )
  }

  return (
    <Image
      src={qrCode}
      alt='QR Code'
      width={size}
      height={size}
      className='rounded-lg'
    />
  )
}
