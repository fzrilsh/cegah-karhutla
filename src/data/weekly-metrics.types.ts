export type AirQualityCategory =
  | 'Sensitif'
  | 'Tidak Sehat'
  | 'Sangat Tidak Sehat'
  | 'BERBAHAYA!'

export interface WeeklyMetric {
  readonly weekIndex: number
  readonly dateIso: string
  readonly dateShort: string
  readonly dateFull: string
  readonly hotspotCount: number
  readonly mapDotsCount: number
  readonly aqi: number
  readonly pm25: number
  readonly visibility: string
  readonly category: AirQualityCategory
  readonly impactHeadline: string
  readonly isHazardous: boolean
}
