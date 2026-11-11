import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSeo, seoRoutes, DEFAULT_DESCRIPTION } from '../src/lib/seo.ts'

const site = { base: '/cegah-karhutla/', origin: 'https://example.test' }

test('route home memakai deskripsi bawaan dan URL berakhiran slash', () => {
  const seo = buildSeo('/', site)
  assert.equal(seo.description, DEFAULT_DESCRIPTION)
  assert.equal(seo.url, 'https://example.test/cegah-karhutla/')
  assert.equal(seo.image, 'https://example.test/cegah-karhutla/og.jpg')
})

test('slug provinsi menghasilkan judul, canonical, dan breadcrumb sendiri', () => {
  const seo = buildSeo('/provinsi/kalimantan-tengah', site)
  assert.match(seo.title, /Kalimantan Tengah/)
  assert.equal(seo.url, 'https://example.test/cegah-karhutla/provinsi/kalimantan-tengah/')
  const crumbs = seo.jsonLd.find((item) => item['@type'] === 'BreadcrumbList')
  assert.ok(crumbs && Array.isArray(crumbs.itemListElement))
  assert.equal(crumbs.itemListElement.length, 3)
})

test('trailing slash dan slug tak dikenal tidak pecah', () => {
  assert.equal(buildSeo('/peta/', site).url, 'https://example.test/cegah-karhutla/peta/')
  const unknown = buildSeo('/provinsi/tidak-ada', site)
  assert.equal(unknown.description, DEFAULT_DESCRIPTION)
  assert.equal(unknown.jsonLd.some((item) => item['@type'] === 'BreadcrumbList'), false)
})

test('setiap route unik dan semua provinsi tercakup', () => {
  assert.equal(new Set(seoRoutes).size, seoRoutes.length)
  assert.ok(seoRoutes.includes('/peta'))
  assert.ok(seoRoutes.includes('/provinsi/papua-selatan'))
})