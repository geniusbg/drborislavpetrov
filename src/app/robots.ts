import { MetadataRoute } from 'next'
import { getSiteDomain } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${getSiteDomain()}/sitemap.xml`,
  }
} 