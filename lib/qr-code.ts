import QRCode from 'qrcode'

export async function generateQRCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
  } catch (error) {
    console.error('QR code generation error:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  try {
    return await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
  } catch (error) {
    console.error('QR code buffer generation error:', error)
    throw new Error('Failed to generate QR code buffer')
  }
}
