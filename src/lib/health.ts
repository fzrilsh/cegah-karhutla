// Estimasi tambahan kasus ISPA dari PM2.5. Bukan data lapangan, jadi UI wajib
// memberi label estimasi.
// Prevalensi dasar: Riskesdas 2018, 9,3% penduduk diagnosa ISPA tenaga kesehatan.
// Risiko relatif: WHO HRAPIE, 1,019 per 10 µg/m³ PM2.5 untuk rawat jalan napas.
export const ISPA_BASE_PREVALENCE = 0.093
export const PM25_RR_PER_10 = 1.019

export function estimateIspaCases(population: number, pm25: number): number {
  if (population <= 0 || pm25 <= 0) return 0
  const attributableFraction = PM25_RR_PER_10 ** (pm25 / 10) - 1
  return Math.round(population * ISPA_BASE_PREVALENCE * attributableFraction)
}