import type { HotspotWeek } from '@/lib/hotspot-history'
import snapshot from './hotspot-history.json'

interface HotspotHistory {
  readonly source: string
  readonly fetchedAt: string
  readonly note: string
  readonly weeks: readonly HotspotWeek[]
  readonly provinces: readonly {
    readonly slug: string
    readonly hotspotWeekly: readonly number[]
    readonly aqiWeekly: readonly number[]
    readonly pm25Weekly: readonly number[]
    readonly burnedWeeklyHa: readonly number[]
  }[]
}

// Snapshot hasil scripts/fetch-history.ts. Jalankan ulang menjelang final.
export const hotspotHistory = snapshot as HotspotHistory

export const hotspotWeeks = hotspotHistory.weeks

const EMPTY = hotspotWeeks.map(() => 0)

export const hotspotWeeklyFor = (slug: string | undefined): readonly number[] =>
  hotspotHistory.provinces.find((province) => province.slug === slug)?.hotspotWeekly ?? EMPTY

export const aqiWeeklyFor = (slug: string | undefined): readonly number[] =>
  hotspotHistory.provinces.find((province) => province.slug === slug)?.aqiWeekly ?? EMPTY

export const pm25WeeklyFor = (slug: string | undefined): readonly number[] =>
  hotspotHistory.provinces.find((province) => province.slug === slug)?.pm25Weekly ?? EMPTY

export const burnedWeeklyHaFor = (slug: string | undefined): readonly number[] =>
  hotspotHistory.provinces.find((province) => province.slug === slug)?.burnedWeeklyHa ?? EMPTY