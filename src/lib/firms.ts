export const FIRMS_AREA_API = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv'

export const KALIMANTAN_BOUNDS = [108, -5, 119, 5] as const

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

export function parseFirmsCsv(csv: string): FirmsParseResult {
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
      !isInsideBounds(latitude, longitude) ||
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
