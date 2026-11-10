import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { findProvinceNameAt } from '../src/lib/geo.ts'
import { provinceMetas } from '../src/data/provinces-meta.ts'

const geo = JSON.parse(await readFile(new URL('../src/data/provinces-geo.json', import.meta.url), 'utf8'))
const posko = JSON.parse(await readFile(new URL('../src/data/posko-medis.json', import.meta.url), 'utf8'))

const nameBySlug = new Map(provinceMetas.map(({ slug, name }) => [slug, name]))

test('setiap posko tersimpan di provinsi yang memuat koordinatnya', () => {
  for (const [slug, list] of Object.entries(posko.provinces) as [string, { lat: number; lng: number; name: string }[]][]) {
    const expected = nameBySlug.get(slug)
    assert.ok(expected, `slug ${slug} tidak ada di provinces-meta`)
    for (const item of list) {
      assert.equal(
        findProvinceNameAt(geo.features, item.lng, item.lat),
        expected,
        `${item.name} di ${slug} jatuh di provinsi lain`,
      )
    }
  }
})

test('provinsi tanpa fasilitas kesehatan di OSM tetap punya kunci kosong atau dilewati', () => {
  const known = new Set(provinceMetas.map(({ slug }) => slug))
  for (const slug of Object.keys(posko.provinces)) assert.ok(known.has(slug), `slug asing ${slug}`)
})