import { findProvince } from '../data/provinces.ts'

// '/peta/' dan '/peta' harus sama: GitHub Pages menyajikan tiap route sebagai folder.
export const normalizePath = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

export type AppRoute =
  | { readonly kind: 'landing' }
  | { readonly kind: 'national' }
  | { readonly kind: 'province'; readonly slug: string }
  | { readonly kind: 'not-found' }

// Slug tak dikenal jatuh ke not-found, bukan halaman provinsi dengan data bawaan.
export const routeFromPath = (rawPath: string): AppRoute => {
  const path = normalizePath(rawPath)
  if (path === '/') return { kind: 'landing' }
  if (path === '/peta') return { kind: 'national' }
  const slug = path.startsWith('/provinsi/') ? path.split('/')[2] : undefined
  if (slug && findProvince(slug)) return { kind: 'province', slug }
  return { kind: 'not-found' }
}