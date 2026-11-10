import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { FIRMS_MAP_KEY, aggregateFirmsHeat, buildFirmsAreaUrl, parseFirmsCsv } from '../src/lib/firms.ts'
import { burnedHaByProvince } from '../src/lib/burned-area.ts'
import { countByProvince, weeklyEnds } from '../src/lib/hotspot-history.ts'
import { meanBetween } from '../src/lib/air-quality.ts'
import { findProvinceNameAt } from '../src/lib/geo.ts'
import { provinceMetas } from '../src/data/provinces-meta.ts'

// Snapshot mingguan per provinsi untuk widget Histori Area Api dan kartu AQI:
// jumlah titik api FIRMS dan rata-rata AQI Open-Meteo pada minggu yang sama.
// Data mentah FIRMS terlalu besar untuk ditarik dari browser (3 sampai 15 MB per
// provinsi untuk 7 minggu), jadi dijumlahkan sekali di sini lalu di-commit.
// Jalankan ulang menjelang final: node --experimental-strip-types scripts/fetch-history.ts

const BOUNDS = [94.9, -11.1, 141.1, 6.1] as const
const SOURCES = ['VIIRS_NOAA21_NRT', 'MODIS_NRT'] as const
const HISTORY_DAYS = 49
const WEEKS = 7
const outputPath = resolve('src/data/hotspot-history.json')
const heatOutputPath = resolve('src/data/heat-weekly.json')

const geo = JSON.parse(await readFile(resolve('src/data/provinces-geo.json'), 'utf8')) as {
  features: {
    properties: { slug: string; name: string }
    geometry: { type: string; coordinates: unknown }
  }[]
}
const slugByName: Record<string, string> = {}
for (const { properties } of geo.features) slugByName[properties.name] = properties.slug

// API membatasi dayRange maksimal 5, jadi satu minggu dipecah 5 + 2 hari.
async function fetchWindow(date: string, dayRange: number) {
  const chunks = await Promise.all(
    SOURCES.map(async (source) => {
      const url = buildFirmsAreaUrl({ mapKey: FIRMS_MAP_KEY, source, bounds: BOUNDS, dayRange, date })
      const response = await fetch(url)
      if (!response.ok) throw new Error(`FIRMS ${source} ${date} HTTP ${response.status}`)
      return parseFirmsCsv(await response.text(), BOUNDS).points
    }),
  )
  return chunks.flat()
}

async function fetchWindowWithRetry(date: string, dayRange: number) {
  for (let attempt = 1; ; attempt += 1) {
    const points = await fetchWindow(date, dayRange)
    if (points.length > 0 || attempt === 3) return points
  }
}

const addDays = (iso: string, days: number) =>
  new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * 86400000).toISOString().slice(0, 10)

// Akhir minggu terakhir = Sabtu terakhir, sama dengan label desain (26 Sep ... 7 Nov).
const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)
const endIso = new Date(today.getTime() - ((today.getUTCDay() + 1) % 7) * 86400000).toISOString().slice(0, 10)
const weeks = weeklyEnds(endIso, WEEKS)
const firstDay = addDays(weeks[0].dateIso, -6)

// AQI dan PM2.5 per jam dari Open-Meteo untuk titik marker tiap provinsi, lalu
// dirata-rata per minggu. Query 38 lokasi sekali panggil, ripotnya ~1,6 MB.
async function fetchAqiWeekly() {
  const latitudes = provinceMetas.map((province) => province.markerLat).join(',')
  const longitudes = provinceMetas.map((province) => province.markerLng).join(',')
  const query = `latitude=${latitudes}&longitude=${longitudes}&start_date=${firstDay}&end_date=${weeks[weeks.length - 1].dateIso}&timezone=Asia%2FJakarta&hourly=us_aqi,pm2_5`
  const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${query}`)
  if (!response.ok) throw new Error(`Open-Meteo air quality HTTP ${response.status}`)
  const payload = (await response.json()) as {
    latitude?: number
    hourly?: { time?: string[]; us_aqi?: (number | null)[]; pm2_5?: (number | null)[] }
  }[]
  const bySlug: Record<string, { aqi: number[]; pm25: number[] }> = {}
  payload.forEach((location, index) => {
    const slug = provinceMetas[index]?.slug
    if (!slug) return
    const times = location.hourly?.time ?? []
    bySlug[slug] = {
      aqi: weeks.map((week) => meanBetween(times, location.hourly?.us_aqi ?? [], addDays(week.dateIso, -6), week.dateIso)),
      pm25: weeks.map((week) => meanBetween(times, location.hourly?.pm2_5 ?? [], addDays(week.dateIso, -6), week.dateIso)),
    }
  })
  return bySlug
}

const aqiBySlug = await fetchAqiWeekly()

// Sel heatmap per minggu, dihitung dari titik yang sama jadi tidak ada request tambahan.
const weekPoints: ReturnType<typeof parseFirmsCsv>['points'][] = weeks.map(() => [])
const weekOf = (date: string) => weeks.findIndex((week) => date >= addDays(week.dateIso, -6) && date <= week.dateIso)

const daily: Record<string, Record<string, number>> = {}
for (let offset = 0; offset < HISTORY_DAYS; offset += 5) {
  const from = addDays(firstDay, offset)
  const dayRange = Math.min(5, HISTORY_DAYS - offset)
  const points = await fetchWindowWithRetry(from, dayRange)
  const byDate: Record<string, typeof points> = {}
  for (const point of points) (byDate[point.acquisitionDate] ??= []).push(point)
  for (const [date, dayPoints] of Object.entries(byDate)) {
    for (const [slug, count] of Object.entries(countByProvince(dayPoints, geo.features, slugByName))) {
      daily[slug] ??= {}
      daily[slug][date] = (daily[slug][date] ?? 0) + count
    }
    const index = weekOf(date)
    if (index >= 0) weekPoints[index].push(...dayPoints)
  }
  console.log(`${from} +${dayRange} hari: ${points.length} titik`)
}

// Sel berisi satu deteksi dibuang: bobot heatmap dinormalisasi ke sel terpadat,
// jadi sel tunggal nyaris tak terlihat tapi hampir separuh file.
const heatWeekly = weekPoints.map((points) => aggregateFirmsHeat(points).filter((cell) => cell[2] > 1))

// Luas terbakar per minggu, diturunkan dari titik yang sama dengan heatmap
// minggu itu. Satu piksel dihitung sekali dalam satu minggu.
const nameAt = (lng: number, lat: number) => {
  const name = findProvinceNameAt(geo.features, lng, lat)
  return name ? slugByName[name] : undefined
}
const burnedWeekly = weekPoints.map((points) => burnedHaByProvince(points, nameAt))
console.log(`Luas terbakar mingguan: ${burnedWeekly.map((week) => Object.keys(week).length).join(', ')} provinsi`)

const provinces = geo.features.map(({ properties }) => {
  const perDay = daily[properties.slug] ?? {}
  const hotspotWeekly = weeks.map((week) => {
    const end = new Date(`${week.dateIso}T00:00:00Z`).getTime()
    const start = end - 6 * 86400000
    let count = 0
    for (const [date, value] of Object.entries(perDay)) {
      const time = new Date(`${date}T00:00:00Z`).getTime()
      if (time >= start && time <= end) count += value
    }
    return count
  })
  return {
    slug: properties.slug,
    hotspotWeekly,
    aqiWeekly: aqiBySlug[properties.slug]?.aqi ?? weeks.map(() => 0),
    pm25Weekly: aqiBySlug[properties.slug]?.pm25 ?? weeks.map(() => 0),
    burnedWeeklyHa: burnedWeekly.map((week) => week[properties.slug] ?? 0),
  }
})

const payload = {
  source: 'NASA FIRMS + Open-Meteo',
  sensors: [...SOURCES],
  fetchedAt: new Date().toISOString(),
  note: 'Per provinsi per minggu (Minggu sampai Sabtu): jumlah deteksi titik api dari CSV FIRMS, rata-rata AQI dan PM2.5 Open-Meteo per jam di titik marker provinsi, dan luas area terbakar (hektar) dari piksel FIRMS minggu itu, tiap piksel dihitung sekali.',
  weeks,
  provinces,
}

// File terpisah karena ~1,9 MB. Halaman provinsi memuatnya on-demand,
// landing dan peta nasional tidak ikut menanggung.
const heatPayload = {
  source: 'NASA FIRMS',
  sensors: [...SOURCES],
  fetchedAt: payload.fetchedAt,
  cellDeg: 0.02,
  weeks: weeks.map((week) => week.dateIso),
  heat: heatWeekly,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, 'utf8')
await writeFile(heatOutputPath, `${JSON.stringify(heatPayload)}\n`, 'utf8')
console.log(`Tersimpan ${provinces.length} provinsi x ${weeks.length} minggu ke ${outputPath}`)
console.log(`Tersimpan sel heatmap ${weeks.length} minggu ke ${heatOutputPath}`)