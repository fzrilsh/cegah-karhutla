import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { buildFirmsAreaUrl, KALIMANTAN_BOUNDS, parseFirmsCsv } from '../src/lib/firms.ts'

const outputPath = resolve('src/data/firms-hotspots.json')
const mapKey = process.env.FIRMS_MAP_KEY
const source = process.env.FIRMS_SOURCE ?? 'VIIRS_SNPP_NRT'
const dayRange = Number(process.env.FIRMS_DAY_RANGE ?? '5')
const date = process.env.FIRMS_DATE

if (!mapKey) {
  throw new Error('FIRMS_MAP_KEY belum diset. Jalankan: FIRMS_MAP_KEY=... pnpm firms:fetch')
}
if (!Number.isInteger(dayRange) || dayRange < 1 || dayRange > 5) {
  throw new Error('FIRMS_DAY_RANGE harus berupa bilangan bulat 1 sampai 5.')
}

const url = buildFirmsAreaUrl({
  mapKey,
  source,
  bounds: KALIMANTAN_BOUNDS,
  dayRange,
  date,
})
const response = await fetch(url)
if (!response.ok) {
  throw new Error(`FIRMS mengembalikan HTTP ${response.status}: ${await response.text()}`)
}

const csv = await response.text()
const parsed = parseFirmsCsv(csv)
const fetchedAt = new Date().toISOString()
const from = date ?? new Date(Date.now() - (dayRange - 1) * 86400000).toISOString().slice(0, 10)
const to = date ? new Date(Date.parse(`${date}T00:00:00Z`) + (dayRange - 1) * 86400000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
const payload = {
  source: 'NASA FIRMS',
  sourceUrl: url.replace(mapKey, '{MAP_KEY}'),
  sensor: source,
  fetchedAt,
  dateRange: { from, to },
  status: parsed.status,
  skippedRows: parsed.skippedRows,
  points: parsed.points,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Tersimpan ${parsed.points.length} titik FIRMS ke ${outputPath}`)

if (parsed.status === 'no-detections') {
  console.warn('FIRMS tidak mengembalikan deteksi pada rentang ini. Snapshot tetap disimpan sebagai no-detections.')
}
