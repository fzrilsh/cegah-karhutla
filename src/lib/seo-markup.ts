import { buildSeo, type Seo } from './seo.ts'

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Tag head untuk satu route. Dipakai scripts build (prerender per folder) dan
// tidak dipakai browser; browser memakai buildSeo lewat komponen Seo.
export function renderSeo(path: string, site: { base: string; origin: string }): string {
  const seo: Seo = buildSeo(path, site)
  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}">`,
    '<meta name="robots" content="index,follow">',
    `<link rel="canonical" href="${esc(seo.url)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Cegah Karhutla">',
    '<meta property="og:locale" content="id_ID">',
    `<meta property="og:title" content="${esc(seo.title)}">`,
    `<meta property="og:description" content="${esc(seo.description)}">`,
    `<meta property="og:url" content="${esc(seo.url)}">`,
    `<meta property="og:image" content="${esc(seo.image)}">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Ilustrasi hutan Kalimantan, Cegah Karhutla">',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(seo.title)}">`,
    `<meta name="twitter:description" content="${esc(seo.description)}">`,
    `<meta name="twitter:image" content="${esc(seo.image)}">`,
    `<script type="application/ld+json" id="seo-jsonld">${JSON.stringify({ '@context': 'https://schema.org', '@graph': seo.jsonLd })}</script>`,
  ]
  // Indentasi 4 spasi milik blok penanda di index.html, bukan dari sini.
  return `${tags.join('\n    ')}\n    `
}