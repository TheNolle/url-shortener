export function isSocialBot(userAgent: string | null): boolean {
  if (!userAgent) return false

  const botPatterns = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'discordbot',
    'Slackbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'Googlebot',
    'Google-PageRenderer',
    'bingbot',
    'Yahoo! Slurp',
    'DuckDuckBot',
  ]

  return botPatterns.some((pattern) =>
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  )
}
