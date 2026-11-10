export type AqiCategory = 'AMAN' | 'SEDANG' | 'TIDAK SEHAT' | 'SANGAT TIDAK SEHAT' | 'BERBAHAYA'

// Ambang dan warna mengikuti node Figma 268:3132.
const CATEGORIES: readonly { readonly max: number; readonly label: AqiCategory; readonly color: string }[] = [
  { max: 50, label: 'AMAN', color: '#61E154' },
  { max: 150, label: 'SEDANG', color: '#E7DB1D' },
  { max: 200, label: 'TIDAK SEHAT', color: '#F5B80D' },
  { max: 300, label: 'SANGAT TIDAK SEHAT', color: '#FE8101' },
  { max: Infinity, label: 'BERBAHAYA', color: '#FB0401' },
]

export function aqiCategory(aqi: number): { readonly label: AqiCategory; readonly color: string } {
  const { label, color } = CATEGORIES.find((category) => aqi <= category.max) ?? CATEGORIES[CATEGORIES.length - 1]!
  return { label, color }
}

// Rata-rata nilai per jam dalam rentang tanggal inklusif, dibulatkan.
// Nilai null dilewati. Minggu tanpa data menghasilkan 0.
export function meanBetween(
  times: readonly string[],
  values: readonly (number | null)[],
  startIso: string,
  endIso: string,
): number {
  let sum = 0
  let count = 0
  for (let index = 0; index < times.length; index += 1) {
    const day = times[index]?.slice(0, 10) ?? ''
    const value = values[index]
    if (day >= startIso && day <= endIso && value !== null && value !== undefined) {
      sum += value
      count += 1
    }
  }
  return count === 0 ? 0 : Math.round(sum / count)
}