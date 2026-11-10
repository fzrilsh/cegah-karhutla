import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { featureContainsPoint } from '../src/lib/geo.ts'

// Snapshot fasilitas kesehatan OSM untuk toggle Posko Medis. Query Overpass
// dilakukan di luar runtime karena layanan publik sering penuh. Ini daftar
// fasilitas kesehatan, bukan posko karhutla aktif; status posko harus
// dikonfirmasi BPBD. Jalankan: node --experimental-strip-types scripts/fetch-posko.ts

const OVERPASS = 'https://overpass-api.de/api/interpreter'
const QUERY = '[out:json][timeout:120];node["amenity"="hospital"]["name"](-11.0,95.0,6.0,141.0);out center tags;'
const outputPath = resolve('src/data/posko-medis.json')

const geo = JSON.parse(await readFile(resolve('src/data/provinces-geo.json'), 'utf8')) as {
  features: {
    properties: { slug: string }
    geometry: { type: string; coordinates: unknown }
  }[]
}

interface OverpassNode {
  readonly lat: number
  readonly lon: number
  readonly tags: Record<string, string>
}

const response = await fetch(OVERPASS, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'cegah-karhutla/1.0' },
  body: new URLSearchParams({ data: QUERY }),
})
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`)

const data = (await response.json()) as { elements: OverpassNode[] }

const provinces: Record<string, { name: string; lng: number; lat: number; city: string; phone: string }[]> = {}
let skipped = 0

for (const node of data.elements) {
  const { tags } = node
  if (typeof node.lat !== 'number' || typeof node.lon !== 'number') {
    skipped += 1
    continue
  }
  const feature = geo.features.find((item) => featureContainsPoint(item, node.lon, node.lat))
  if (!feature) {
    skipped += 1
    continue
  }
  const slug = feature.properties.slug
  ;(provinces[slug] ??= []).push({
    name: tags.name,
    lng: Math.round(node.lon * 1e4) / 1e4,
    lat: Math.round(node.lat * 1e4) / 1e4,
    city: tags['addr:city'] ?? tags['addr:district'] ?? '',
    phone: tags.phone ?? tags['contact:phone'] ?? '',
  })
}

const payload = {
  source: 'OpenStreetMap (Overpass), ODbL',
  fetchedAt: new Date().toISOString(),
  note: 'Fasilitas kesehatan OSM di dalam batas provinsi. Bukan posko karhutla aktif; status harus dikonfirmasi BPBD.',
  provinces,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, 'utf8')

const total = Object.values(provinces).reduce((sum, list) => sum + list.length, 0)
console.log(`Tersimpan ${total} fasilitas kesehatan di ${Object.keys(provinces).length} provinsi (${skipped} di luar Indonesia) ke ${outputPath}`)