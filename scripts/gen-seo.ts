import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { seoRoutes } from '../src/lib/seo.ts'
import { renderSeo } from '../src/lib/seo-markup.ts'

// Tulis dist/<route>/index.html dengan head SEO sendiri, plus sitemap.xml,
// robots.txt, dan 404.html. GitHub Pages menyajikan folder sebagai route, jadi
// deep link /provinsi/aceh tidak 404 lagi dan crawler dapat judul per provinsi.
// Jalankan setelah vite build: node --experimental-strip-types scripts/gen-seo.ts

const base = process.env.VITE_BASE_PATH ?? '/cegah-karhutla/'
const origin = process.env.SITE_ORIGIN ?? 'https://fzrilsh.github.io'
const dist = resolve('dist')
const template = await readFile(resolve(dist, 'index.html'), 'utf8')

const withBase = (path: string) => {
  const root = base.endsWith('/') ? base : `${base}/`
  return path === '/' ? root : `${root}${path.slice(1)}/`
}

const SEO_BLOCK = /<!--seo-->[\s\S]*?<!--\/seo-->/
if (!SEO_BLOCK.test(template)) {
  throw new Error('dist/index.html tidak punya blok <!--seo-->, cek index.html')
}

for (const route of seoRoutes) {
  const html = template.replace(SEO_BLOCK, () => renderSeo(route, { base, origin }))
  const out = resolve(dist, route === '/' ? 'index.html' : `${route.slice(1)}/index.html`)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, html)
}

const routes = seoRoutes.map((route) => `  <url><loc>${origin}${withBase(route)}</loc></url>`).join('\n')
await writeFile(
  resolve(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes}\n</urlset>\n`,
)
await writeFile(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}${withBase('/')}sitemap.xml\n`)

// Fallback SPA untuk route lain; status 404 dari GitHub Pages, jadi tidak diindeks.
await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'))
console.log(`SEO: ${seoRoutes.length} route`)