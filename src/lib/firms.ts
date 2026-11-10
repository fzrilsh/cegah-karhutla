import { readCache, writeCache } from './cache.ts'

export const FIRMS_AREA_API = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv'

export const KALIMANTAN_BOUNDS = [108, -5, 119, 5] as const

// MAP_KEY FIRMS ikut terkirim ke browser (SPA tanpa backend), jadi anggap publik.
// Batas key: 5000 transaksi / 10 menit. Ganti key kalau kuotanya habis.
export const FIRMS_MAP_KEY = '82609ef73d1dc954226475e0b37314bb'

// Sumber NRT yang masih terisi per 10 Nov 2026. VIIRS_SNPP_NRT berhenti 2 Nov
// dan VIIRS NOAA-20 dilewati supaya payload ~580 KB, bukan ~1 MB.
export const FIRMS_RUNTIME_SOURCES = ['VIIRS_NOAA21_NRT', 'MODIS_NRT'] as const

export const FIRMS_DAY_RANGE = 5

export type FirmsConfidence = 'low' | 'nominal' | 'high' | number | string | null

export interface FirmsFirePoint {
  readonly id: string
  readonly latitude: number
  readonly longitude: number
  readonly acquisitionDate: string
  readonly acquisitionTime: string
  readonly satellite: string
  readonly instrument: string
  readonly confidence: FirmsConfidence
  readonly frp: number | null
  readonly dayNight: 'D' | 'N' | string | null
}

export interface FirmsParseResult {
  readonly status: 'ok' | 'no-detections'
  readonly points: readonly FirmsFirePoint[]
  readonly skippedRows: number
}

export interface FirmsAreaUrlOptions {
  readonly mapKey: string
  readonly source: string
  readonly bounds: readonly [number, number, number, number]
  readonly dayRange: number
  readonly date?: string
}

export interface FirmsGeoJson {
  readonly type: 'FeatureCollection'
  readonly features: readonly {
    readonly type: 'Feature'
    readonly properties: FirmsFirePoint
    readonly geometry: {
      readonly type: 'Point'
      readonly coordinates: readonly [number, number]
    }
  }[]
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]
    const nextCharacter = csv[index + 1]

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.some((value) => value.trim() !== '')) rows.push(row)
  }

  return rows
}

function normalizeConfidence(value: string | undefined): FirmsConfidence {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!normalized) return null
  if (normalized === 'l' || normalized === 'low') return 'low'
  if (normalized === 'n' || normalized === 'nominal' || normalized === 'nom') return 'nominal'
  if (normalized === 'h' || normalized === 'high') return 'high'
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : value?.trim() ?? null
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function isInsideBounds(
  latitude: number,
  longitude: number,
  bounds: readonly [number, number, number, number] = KALIMANTAN_BOUNDS,
): boolean {
  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bounds
  return (
    longitude >= minLongitude &&
    longitude <= maxLongitude &&
    latitude >= minLatitude &&
    latitude <= maxLatitude
  )
}

function getColumnIndexes(header: readonly string[]): Record<string, number> {
  return Object.fromEntries(header.map((name, index) => [name.trim().toLowerCase(), index]))
}

function valueAt(row: readonly string[], columns: Record<string, number>, name: string): string {
  const index = columns[name]
  return index === undefined ? '' : row[index] ?? ''
}

export function parseFirmsCsv(
  csv: string,
  bounds: readonly [number, number, number, number] = KALIMANTAN_BOUNDS,
): FirmsParseResult {
  const rows = parseCsvRows(csv)
  if (rows.length === 0) return { status: 'no-detections', points: [], skippedRows: 0 }

  const columns = getColumnIndexes(rows[0] ?? [])
  const points: FirmsFirePoint[] = []
  const seenIds = new Set<string>()
  let skippedRows = 0

  for (const row of rows.slice(1)) {
    const latitude = Number(valueAt(row, columns, 'latitude'))
    const longitude = Number(valueAt(row, columns, 'longitude'))
    const acquisitionDate = valueAt(row, columns, 'acq_date').trim()
    const acquisitionTime = valueAt(row, columns, 'acq_time').trim()
    const satellite = valueAt(row, columns, 'satellite').trim()

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !isInsideBounds(latitude, longitude, bounds) ||
      !acquisitionDate ||
      !acquisitionTime ||
      !satellite
    ) {
      skippedRows += 1
      continue
    }

    const point: FirmsFirePoint = {
      id: `${acquisitionDate}T${acquisitionTime}-${longitude}-${latitude}-${satellite}`,
      latitude,
      longitude,
      acquisitionDate,
      acquisitionTime,
      satellite,
      instrument: valueAt(row, columns, 'instrument').trim(),
      confidence: normalizeConfidence(valueAt(row, columns, 'confidence')),
      frp: parseOptionalNumber(valueAt(row, columns, 'frp')),
      dayNight: valueAt(row, columns, 'daynight').trim() || null,
    }

    if (seenIds.has(point.id)) {
      skippedRows += 1
      continue
    }

    seenIds.add(point.id)
    points.push(point)
  }

  return {
    status: points.length === 0 ? 'no-detections' : 'ok',
    points,
    skippedRows,
  }
}

export function toFirmsGeoJson(points: readonly FirmsFirePoint[]): FirmsGeoJson {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      properties: point,
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude],
      },
    })),
  }
}

export function buildFirmsAreaUrl(options: FirmsAreaUrlOptions): string {
  const { mapKey, source, bounds, dayRange, date } = options
  const boundsText = bounds.join(',')
  const dateSuffix = date ? `/${encodeURIComponent(date)}` : ''
  return `${FIRMS_AREA_API}/${encodeURIComponent(mapKey)}/${encodeURIComponent(source)}/${boundsText}/${dayRange}${dateSuffix}`
}

// Heatmap pakai sel 0,02 derajat (sama dengan heat-cells.json): [lng, lat, count].
export const HEAT_CELL_DEG = 0.02

export interface FirmsHeatSnapshot {
  readonly fetchedAt: string
  readonly sources: readonly string[]
  readonly dayRange: number
  readonly cells: readonly (readonly [number, number, number])[]
}

const HEAT_CACHE_KEY = 'ck-firms-heat-v1'
const HEAT_CACHE_TTL_MS = 60 * 60 * 1000

export function aggregateFirmsHeat(
  points: readonly FirmsFirePoint[],
  cellDeg = HEAT_CELL_DEG,
): [number, number, number][] {
  const counts = new Map<string, { lng: number; lat: number; count: number }>()
  for (const point of points) {
    const lng = Math.round(Math.round(point.longitude / cellDeg) * cellDeg * 100) / 100
    const lat = Math.round(Math.round(point.latitude / cellDeg) * cellDeg * 100) / 100
    const key = `${lng},${lat}`
    const cell = counts.get(key)
    if (cell) cell.count += 1
    else counts.set(key, { lng, lat, count: 1 })
  }
  return [...counts.values()].map(({ lng, lat, count }) => [lng, lat, count] as [number, number, number])
}

export interface FirmsHeatFetchOptions {
  readonly mapKey?: string
  readonly sources?: readonly string[]
  readonly dayRange?: number
  readonly bounds?: readonly [number, number, number, number]
  readonly signal?: AbortSignal
  readonly fetcher?: typeof fetch
  readonly cacheStorage?: Storage
  readonly now?: () => number
}

const INDONESIA_BOUNDS = [94.9, -11.1, 141.1, 6.1] as const

export function readFirmsHeatCache(
  options: Pick<FirmsHeatFetchOptions, 'cacheStorage' | 'now'> = {},
): FirmsHeatSnapshot | null {
  return readCache<FirmsHeatSnapshot>(HEAT_CACHE_KEY, {
    storage: options.cacheStorage,
    ttlMs: HEAT_CACHE_TTL_MS,
    now: options.now,
  })
}

// Ambil titik api terbaru semua provinsi, agregasi jadi sel heatmap, simpan ke cache.
// Gagal satu sumber tidak menggagalkan semuanya; yang penting ada satu sumber sukses.
export async function fetchFirmsHeat(
  options: FirmsHeatFetchOptions = {},
): Promise<FirmsHeatSnapshot> {
  const mapKey = options.mapKey ?? FIRMS_MAP_KEY
  const sources = options.sources ?? FIRMS_RUNTIME_SOURCES
  const dayRange = options.dayRange ?? FIRMS_DAY_RANGE
  const bounds = options.bounds ?? INDONESIA_BOUNDS
  const fetcher = options.fetcher ?? fetch

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const response = await fetcher(buildFirmsAreaUrl({ mapKey, source, bounds, dayRange }), {
        signal: options.signal,
      })
      if (!response.ok) throw new Error(`FIRMS ${source} HTTP ${response.status}`)
      return parseFirmsCsv(await response.text(), bounds)
    }),
  )

  const points = results.flatMap((result) => (result.status === 'fulfilled' ? result.value.points : []))
  if (!results.some((result) => result.status === 'fulfilled')) {
    const firstError = results.find((result) => result.status === 'rejected')
    throw firstError && firstError.status === 'rejected'
      ? firstError.reason
      : new Error('FIRMS tidak mengembalikan data')
  }

  const snapshot: FirmsHeatSnapshot = {
    fetchedAt: new Date(options.now?.() ?? Date.now()).toISOString(),
    sources: sources.filter((_, index) => results[index]?.status === 'fulfilled'),
    dayRange,
    cells: aggregateFirmsHeat(points),
  }
  writeCache(HEAT_CACHE_KEY, snapshot, {
    storage: options.cacheStorage,
    ttlMs: HEAT_CACHE_TTL_MS,
    now: options.now,
  })
  return snapshot
}
