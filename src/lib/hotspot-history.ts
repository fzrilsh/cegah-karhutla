import { findProvinceNameAt } from './geo.ts'
import type { FirmsFirePoint } from './firms.ts'

export interface HotspotWeek {
  readonly dateIso: string
  readonly dateShort: string
  readonly dateFull: string
}

type ProvinceFeature = {
  readonly properties: { readonly name: string }
  readonly geometry: { readonly type: string; readonly coordinates: unknown }
}

const formatDay = (date: Date, options: Intl.DateTimeFormatOptions) =>
  date.toLocaleDateString('id-ID', { ...options, timeZone: 'UTC' })

// Tujuh minggu, urut lama ke baru. Label sumbu chart = tanggal akhir minggu.
export function weeklyEnds(endIso: string, count = 7): HotspotWeek[] {
  const end = new Date(`${endIso}T00:00:00Z`)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end)
    date.setUTCDate(date.getUTCDate() - (count - 1 - index) * 7)
    return {
      dateIso: date.toISOString().slice(0, 10),
      dateShort: formatDay(date, { day: 'numeric', month: 'short' }),
      dateFull: formatDay(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    }
  })
}

// Titik di laut atau luar batas provinsi dilewati.
export function countByProvince(
  points: readonly Pick<FirmsFirePoint, 'longitude' | 'latitude'>[],
  features: readonly ProvinceFeature[],
  slugByName: Readonly<Record<string, string>>,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const point of points) {
    const name = findProvinceNameAt(features, point.longitude, point.latitude)
    const slug = name ? slugByName[name] : undefined
    if (slug) counts[slug] = (counts[slug] ?? 0) + 1
  }
  return counts
}