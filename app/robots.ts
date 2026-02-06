import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/test-components/', '/settings'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'cohere-ai'],
        allow: '/',
        disallow: ['/admin/', '/test-components/', '/settings'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}



