// Metadata provinsi: nama, label marker, posisi marker dan bbox dalam lng/lat.
// markerLng/markerLat adalah PUSAT marker (koordinat wrapper 99px di peta Figma + 49,5).
export interface ProvinceMeta {
  readonly slug: string
  readonly name: string
  readonly line1: string
  readonly line2: string
  readonly markerLng: number
  readonly markerLat: number
  readonly bounds: readonly [minLng: number, minLat: number, maxLng: number, maxLat: number]
}

export const provinceMetas: readonly ProvinceMeta[] = [
  {
    slug: 'kalimantan-barat',
    name: 'Kalimantan Barat',
    line1: 'Kalimantan',
    line2: 'Barat',
    markerLng: 110.816591,
    markerLat: -0.055714,
    bounds: [108.685426, -3.039550, 114.220466, 2.064976],
  },
  {
    slug: 'kalimantan-tengah',
    name: 'Kalimantan Tengah',
    line1: 'Kalimantan',
    line2: 'Tengah',
    markerLng: 113.434301,
    markerLat: -1.709054,
    bounds: [110.734479, -3.543584, 115.846961, 0.777485],
  },
  {
    slug: 'kalimantan-selatan',
    name: 'Kalimantan Selatan',
    line1: 'Kalimantan',
    line2: 'Selatan',
    markerLng: 115.440689,
    markerLat: -3.000234,
    bounds: [114.347139, -4.704409, 116.558931, -1.315042],
  },
  {
    slug: 'kalimantan-timur',
    name: 'Kalimantan Timur',
    line1: 'Kalimantan',
    line2: 'Timur',
    markerLng: 116.584958,
    markerLat: 0.574129,
    bounds: [113.836349, -2.405193, 118.988958, 2.626342],
  },
  {
    slug: 'kalimantan-utara',
    name: 'Kalimantan Utara',
    line1: 'Kalimantan',
    line2: 'Utara',
    markerLng: 116.224435,
    markerLat: 3.187980,
    bounds: [114.589587, 1.046625, 117.985934, 4.408174],
  },
  {
    slug: 'riau',
    name: 'Riau',
    line1: 'Riau',
    line2: '',
    markerLng: 102.077828,
    markerLat: 0.739463,
    bounds: [100.053658, -1.121101, 103.811668, 2.529452],
  },
  {
    slug: 'jambi',
    name: 'Jambi',
    line1: 'Jambi',
    line2: '',
    markerLng: 102.939949,
    markerLat: -1.543720,
    bounds: [101.124443, -2.766654, 104.515165, -0.746429],
  },
  {
    slug: 'sumatera-selatan',
    name: 'Sumatera Selatan',
    line1: 'Sumatera',
    line2: 'Selatan',
    markerLng: 104.429065,
    markerLat: -2.960868,
    bounds: [102.066829, -4.923104, 106.079933, -1.628021],
  },
]

// Gabungan semua provinsi untuk framing landing
export const ALL_PROVINCES_BOUNDS: readonly [number, number, number, number] = [
  100.053658, -4.923104, 118.988958, 4.408174,
]
