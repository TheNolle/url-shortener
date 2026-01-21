'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QrCode, Download } from 'lucide-react'
import Image from 'next/image'

interface QRCodeModalProps {
  shortCode: string
  shortUrl: string
}

export function QRCodeModal({ shortCode, shortUrl }: QRCodeModalProps) {
  const [open, setOpen] = useState(false)
  const qrUrl = `/api/urls/${shortCode}/qr`

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-${shortCode}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <QrCode className='h-4 w-4 mr-2' />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to access your shortened URL
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col items-center gap-4 py-4'>
          <div className='relative w-75 h-75 bg-white rounded-lg p-4 border'>
            <Image
              src={qrUrl}
              alt='QR Code'
              width={300}
              height={300}
              className='w-full h-full'
              unoptimized
            />
          </div>
          <div className='text-center space-y-2'>
            <code className='text-sm bg-muted px-3 py-1 rounded'>{shortUrl}</code>
          </div>
          <Button onClick={handleDownload} className='w-full'>
            <Download className='h-4 w-4 mr-2' />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
