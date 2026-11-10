export type HeatCells = readonly (readonly [number, number, number])[]

interface HeatWeeklyPayload {
  readonly cellDeg: number
  readonly weeks: readonly string[]
  readonly heat: readonly HeatCells[]
}

// 810 KB, jadi diimpor dinamis: hanya diunduh saat halaman provinsi dibuka.
// Dimuat sekali per sesi, minggu berikutnya memakai hasil yang sudah ada.
let cache: HeatWeeklyPayload | null = null

export async function loadHeatWeek(index: number): Promise<HeatCells> {
  cache ??= (await import('./heat-weekly.json')).default as unknown as HeatWeeklyPayload
  // Minggu di luar rentang jatuh ke minggu terakhir, sama seperti kartu AQI.
  return cache.heat[index] ?? cache.heat[cache.heat.length - 1] ?? []
}