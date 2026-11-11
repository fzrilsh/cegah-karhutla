import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { normalizePath } from '@/lib/path.ts'
import { buildSeo } from '@/lib/seo.ts'

// Seo statis per route ditulis scripts/gen-seo.ts saat build. Komponen ini
// memperbarui head saat navigasi client supaya judul ikut berubah tanpa reload.
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.append(el)
  }
  el.content = content
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.append(el)
  }
  el.href = href
}

export function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = buildSeo(normalizePath(pathname), {
      base: import.meta.env.BASE_URL,
      origin: window.location.origin,
    })
    document.title = seo.title
    setMeta('name', 'description', seo.description)
    setMeta('property', 'og:title', seo.title)
    setMeta('property', 'og:description', seo.description)
    setMeta('property', 'og:url', seo.url)
    setMeta('property', 'og:image', seo.image)
    setMeta('name', 'twitter:title', seo.title)
    setMeta('name', 'twitter:description', seo.description)
    setMeta('name', 'twitter:image', seo.image)
    setLink('canonical', seo.url)

    let script = document.getElementById('seo-jsonld')
    if (!script) {
      script = document.createElement('script')
      script.id = 'seo-jsonld'
      script.setAttribute('type', 'application/ld+json')
      document.head.append(script)
    }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': seo.jsonLd })
  }, [pathname])

  return null
}