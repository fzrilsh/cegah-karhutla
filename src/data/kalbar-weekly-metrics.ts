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

// Data linimasa 7 minggu Kalimantan Barat (September sampai Oktober 2026).
// Angka diselaraskan dengan teks Figma (AQI 322, 1.254 titik api, jarak pandang <100 m pada 25 Okt 2026).
export const kalbarWeeklyMetrics: readonly WeeklyMetric[] = [
  {
    weekIndex: 0,
    dateIso: '2026-09-13',
    dateShort: '13 Sep 2026',
    dateFull: 'Minggu, 13 September 2026',
    hotspotCount: 145,
    mapDotsCount: 6,
    aqi: 115,
    pm25: 41,
    visibility: '3,5 km',
    category: 'Sensitif',
    impactHeadline: 'Asap tipis mulai tercium saat sore hari',
    isHazardous: false,
  },
  {
    weekIndex: 1,
    dateIso: '2026-09-20',
    dateShort: '20 Sep 2026',
    dateFull: 'Minggu, 20 September 2026',
    hotspotCount: 390,
    mapDotsCount: 24,
    aqi: 168,
    pm25: 88,
    visibility: '1,8 km',
    category: 'Tidak Sehat',
    impactHeadline: 'Setara menghisap 4 batang rokok pasif seharian',
    isHazardous: false,
  },
  {
    weekIndex: 2,
    dateIso: '2026-09-27',
    dateShort: '27 Sep 2026',
    dateFull: 'Minggu, 27 September 2026',
    hotspotCount: 620,
    mapDotsCount: 46,
    aqi: 220,
    pm25: 170,
    visibility: '900 m',
    category: 'Sangat Tidak Sehat',
    impactHeadline: 'Mata mulai perih, jarak pandang jalan menyusut',
    isHazardous: false,
  },
  {
    weekIndex: 3,
    dateIso: '2026-10-04',
    dateShort: '4 Okt 2026',
    dateFull: 'Minggu, 4 Oktober 2026',
    hotspotCount: 886,
    mapDotsCount: 93,
    aqi: 265,
    pm25: 215,
    visibility: '500 m',
    category: 'Sangat Tidak Sehat',
    impactHeadline: 'Langit menguning kecokelatan jelang siang',
    isHazardous: false,
  },
  {
    weekIndex: 4,
    dateIso: '2026-10-11',
    dateShort: '11 Okt 2026',
    dateFull: 'Minggu, 11 Oktober 2026',
    hotspotCount: 1150,
    mapDotsCount: 149,
    aqi: 295,
    pm25: 245,
    visibility: '250 m',
    category: 'Sangat Tidak Sehat',
    impactHeadline: 'Aktivitas belajar luar ruangan dihentikan',
    isHazardous: false,
  },
  {
    weekIndex: 5,
    dateIso: '2026-10-18',
    dateShort: '18 Okt 2026',
    dateFull: 'Minggu, 18 Oktober 2026',
    hotspotCount: 1420,
    mapDotsCount: 172,
    aqi: 360,
    pm25: 310,
    visibility: '120 m',
    category: 'BERBAHAYA!',
    impactHeadline: 'Seperti menghisap 15 batang rokok sekaligus',
    isHazardous: true,
  },
  {
    weekIndex: 6,
    dateIso: '2026-10-25',
    dateShort: '25 Okt 2026',
    dateFull: 'Minggu, 25 Oktober 2026',
    hotspotCount: 1254,
    mapDotsCount: 140,
    aqi: 322,
    pm25: 272,
    visibility: '<100 m',
    category: 'BERBAHAYA!',
    impactHeadline: 'Ujung lapangan bola hilang total',
    isHazardous: true,
  },
] as const

export const DEFAULT_WEEK_INDEX = 6
