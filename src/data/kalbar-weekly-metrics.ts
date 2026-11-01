// Re-export untuk backward compatibility. Data sekarang per provinsi di weekly-metrics.ts.
import { provinceWeeklyMetrics } from './weekly-metrics'

export type { AirQualityCategory, WeeklyMetric } from './weekly-metrics.types'

export const kalbarWeeklyMetrics = provinceWeeklyMetrics['kalimantan-barat']

export { DEFAULT_WEEK_INDEX } from './weekly-metrics'
