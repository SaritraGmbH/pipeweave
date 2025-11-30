export default function sitemap() {
  const baseUrl = 'https://gridextract.com'
  const locales = ['en', 'de'] // adjust to your locales

  // Static routes
  const routes = [
    '',
    '/contact',
    '/docs',
    '/converter',
    '/legal',
    '/legal/privacy-policy',
    '/legal/terms-conditions',
    '/legal/imprint',
    '/legal/service-agreement',
    '/legal/permitted-prohibited-use',
    //'/alternative/getmyinvoices',
    //'/tools/tesla-invoice-download',
  ]

  // Generate sitemap entries for all locales
  const sitemap = []

  locales.forEach(locale => {
    routes.forEach(route => {
      sitemap.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
      })
    })
  })

  return sitemap
}
