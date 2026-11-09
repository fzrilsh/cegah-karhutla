import { readCache, writeCache } from './cache.ts'
import { provinceMetas } from '../data/provinces-meta.ts'

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast'
const AIR_QUALITY_API = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const CACHE_KEY = 'ck-open-meteo-current-v1'
const CACHE_TTL_MS = 15 * 60 * 1000

export interface ProvinceWeather {
  readonly latitude: number
  readonly longitude: number
  readonly time: string
  readonly windSpeed: number | null
  readonly windDirection: number | null
  readonly smokeDirection: number | null
}

export interface ProvinceAirQuality {
  readonly latitude: number
  readonly longitude: number
  readonly time: string
  readonly aqi: number | null
  readonly pm25: number | null
}

export interface OpenMeteoSnapshot {
  readonly fetchedAt: string
  readonly weather: readonly ProvinceWeather[]
  readonly airQuality: readonly ProvinceAirQuality[]
}

interface OpenMeteoWeatherResponse {
  readonly latitude?: number
  readonly longitude?: number
  readonly current?: {
    readonly time?: string
    readonly wind_speed_10m?: number
    readonly wind_direction_10m?: number
  }
}

interface OpenMeteoAirResponse {
  readonly latitude?: number
  readonly longitude?: number
  readonly current?: {
    readonly time?: string
    readonly us_aqi?: number
    readonly pm2_5?: number
  }
}

export interface OpenMeteoFetchOptions {
  readonly signal?: AbortSignal
  readonly fetcher?: typeof fetch
  readonly cacheStorage?: Storage
  readonly now?: () => number
}

export async function fetchOpenMeteoSnapshot(
  options: OpenMeteoFetchOptions = {},
): Promise<OpenMeteoSnapshot> {
  const fetcher = options.fetcher ?? fetch
  const latitudes = provinceMetas.map((province) => province.markerLat).join(',')
  const longitudes = provinceMetas.map((province) => province.markerLng).join(',')
  const query = `latitude=${encodeURIComponent(latitudes)}&longitude=${encodeURIComponent(longitudes)}&timezone=Asia%2FJakarta`
  const [weatherResponse, airResponse] = await Promise.all([
    fetcher(`${WEATHER_API}?${query}&current=wind_speed_10m,wind_direction_10m`, {
      signal: options.signal,
    }),
    fetcher(`${AIR_QUALITY_API}?${query}&current=us_aqi,pm2_5`, {
      signal: options.signal,
    }),
  ])

  if (!weatherResponse.ok) throw new Error(`Open-Meteo weather HTTP ${weatherResponse.status}`)
  if (!airResponse.ok) throw new Error(`Open-Meteo air quality HTTP ${airResponse.status}`)

  const weatherPayload = (await weatherResponse.json()) as OpenMeteoWeatherResponse[]
  const airPayload = (await airResponse.json()) as OpenMeteoAirResponse[]
  const weather = weatherPayload.map(normalizeWeather)
  const airQuality = airPayload.map(normalizeAirQuality)
  const snapshot: OpenMeteoSnapshot = {
    fetchedAt: new Date(options.now?.() ?? Date.now()).toISOString(),
    weather,
    airQuality,
  }
  writeCache(CACHE_KEY, snapshot, {
    storage: options.cacheStorage,
    ttlMs: CACHE_TTL_MS,
    now: options.now,
  })
  return snapshot
}

export function readOpenMeteoCache(options: Pick<OpenMeteoFetchOptions, 'cacheStorage' | 'now'> = {}) {
  return readCache<OpenMeteoSnapshot>(CACHE_KEY, {
    storage: options.cacheStorage,
    ttlMs: CACHE_TTL_MS,
    now: options.now,
  })
}

function normalizeWeather(response: OpenMeteoWeatherResponse): ProvinceWeather {
  const windDirection = finiteOrNull(response.current?.wind_direction_10m)
  return {
    latitude: response.latitude ?? 0,
    longitude: response.longitude ?? 0,
    time: response.current?.time ?? '',
    windSpeed: finiteOrNull(response.current?.wind_speed_10m),
    windDirection,
    smokeDirection: windDirection === null ? null : (windDirection + 180) % 360,
  }
}

function normalizeAirQuality(response: OpenMeteoAirResponse): ProvinceAirQuality {
  return {
    latitude: response.latitude ?? 0,
    longitude: response.longitude ?? 0,
    time: response.current?.time ?? '',
    aqi: finiteOrNull(response.current?.us_aqi),
    pm25: finiteOrNull(response.current?.pm2_5),
  }
}

function finiteOrNull(value: number | undefined): number | null {
  return value !== undefined && Number.isFinite(value) ? value : null
}
