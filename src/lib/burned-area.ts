import type { FirmsFirePoint } from './firms.ts'

// Satu deteksi mewakili satu piksel sensor. Resolusi nadir: VIIRS 375 m,
// MODIS 1 km. Piksel di tepi sapuan lebih besar, jadi angkanya perkiraan.
const PIXELS = {
  VIIRS: { deg: 375 / 111_320, ha: 14.0625 },
  MODIS: { deg: 1000 / 111_320, ha: 100 },
} as const

type Sensor = keyof typeof PIXELS

// Luas terbakar per provinsi dari titik api: tiap piksel yang pernah terdeteksi
// dihitung sekali sebesar ukuran pikselnya, jadi deteksi ulang hari lain tidak
// menambah luas. Titik di laut atau luar provinsi dilewati.
export function burnedHaByProvince(
  points: readonly Pick<FirmsFirePoint, 'latitude' | 'longitude' | 'instrument'>[],
  provinceAt: (lng: number, lat: number) => string | undefined,
): Record<string, number> {
  const seen = new Set<string>()
  const sums: Record<string, number> = {}
  for (const point of points) {
    const instrument = point.instrument.toUpperCase()
    const sensor: Sensor | undefined = instrument.includes('VIIRS')
      ? 'VIIRS'
      : instrument.includes('MODIS')
        ? 'MODIS'
        : undefined
    if (!sensor) continue
    const { deg, ha } = PIXELS[sensor]
    const cell = `${sensor}:${Math.floor(point.latitude / deg)}:${Math.floor(point.longitude / deg)}`
    if (seen.has(cell)) continue
    const province = provinceAt(point.longitude, point.latitude)
    if (!province) continue
    seen.add(cell)
    sums[province] = (sums[province] ?? 0) + ha
  }
  for (const province of Object.keys(sums)) sums[province] = Math.round(sums[province]!)
  return sums
}