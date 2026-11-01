export const provinces = [
  { slug: 'kalimantan-barat', name: 'Kalimantan Barat' },
  { slug: 'kalimantan-tengah', name: 'Kalimantan Tengah' },
  { slug: 'kalimantan-selatan', name: 'Kalimantan Selatan' },
  { slug: 'kalimantan-timur', name: 'Kalimantan Timur' },
  { slug: 'kalimantan-utara', name: 'Kalimantan Utara' },
] as const

export type Province = (typeof provinces)[number]

export const findProvince = (slug: string | undefined) =>
  provinces.find((province) => province.slug === slug)
