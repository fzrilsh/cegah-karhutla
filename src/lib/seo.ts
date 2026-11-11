import { provinceMetas } from '../data/provinces-meta.ts'

export const SITE_NAME = 'Cegah Karhutla'

export const DEFAULT_DESCRIPTION =
  'Platform web interaktif untuk memantau titik api, kualitas udara, dan sebaran asap kebakaran hutan dan lahan di Indonesia. Data NASA FIRMS dan Open-Meteo.'

const PETA_DESCRIPTION =
  'Peta interaktif titik api, arah angin, dan sebaran asap karhutla di seluruh Indonesia. Pilih provinsi untuk melihat AQI, area terbakar, dan posko medis terdekat.'

export interface Seo {
  readonly title: string
  readonly description: string
  readonly url: string
  readonly image: string
  readonly jsonLd: readonly Record<string, unknown>[]
}

interface Site {
  readonly base: string
  readonly origin: string
}

// path = pathname aplikasi tanpa base, mis. '/', '/peta', '/provinsi/aceh'.
// Dipakai di dua tempat: <Seo> di browser dan scripts/gen-seo.ts saat build.
export function buildSeo(path: string, site: Site): Seo {
  const base = site.base.endsWith('/') ? site.base : `${site.base}/`
  const root = `${site.origin}${base}`
  const clean = path.replace(/\/+$/, '')
  const slug = clean.startsWith('/provinsi/') ? clean.split('/')[2] : undefined
  const province = slug ? provinceMetas.find((meta) => meta.slug === slug) : undefined
  // Trailing slash supaya canonical cocok dengan folder index.html hasil prerender.
  const url = clean === '' ? root : `${root}${clean.slice(1)}/`
  const image = `${root}og.jpg`

  const website = {
    '@type': 'WebSite',
    '@id': root,
    name: SITE_NAME,
    url: root,
    inLanguage: 'id',
    description: DEFAULT_DESCRIPTION,
  }

  if (!province) {
    const isPeta = clean === '/peta'
    const title = isPeta
      ? 'Peta Titik Api dan Sebaran Asap Karhutla | Cegah Karhutla'
      : 'Cegah Karhutla: Pantau Titik Api Kebakaran Hutan dan Lahan'
    const description = isPeta ? PETA_DESCRIPTION : DEFAULT_DESCRIPTION
    return {
      title,
      description,
      url,
      image,
      jsonLd: [
        website,
        {
          '@type': 'WebPage',
          '@id': url,
          url,
          name: title,
          description,
          inLanguage: 'id',
          isPartOf: { '@id': root },
        },
      ],
    }
  }

  const title = `${province.name}: Titik Api dan Kualitas Udara | Cegah Karhutla`
  const description = `Titik api, kualitas udara (AQI), dan luas area terbakar di ${province.name} per minggu. Peta dan grafik interaktif dari data NASA FIRMS dan Open-Meteo.`
  return {
    title,
    description,
    url,
    image,
    jsonLd: [
      website,
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: title,
        description,
        inLanguage: 'id',
        isPartOf: { '@id': root },
        about: { '@type': 'AdministrativeArea', name: province.name },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: root },
          { '@type': 'ListItem', position: 2, name: 'Peta Nasional', item: `${root}peta/` },
          { '@type': 'ListItem', position: 3, name: province.name, item: url },
        ],
      },
    ],
  }
}

export const seoRoutes = ['/', '/peta', ...provinceMetas.map((meta) => `/provinsi/${meta.slug}`)]