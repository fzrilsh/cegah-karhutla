export const provinces = [
  { slug: 'kalimantan-barat', name: 'Kalimantan Barat' },
  { slug: 'kalimantan-tengah', name: 'Kalimantan Tengah' },
  { slug: 'kalimantan-selatan', name: 'Kalimantan Selatan' },
  { slug: 'kalimantan-timur', name: 'Kalimantan Timur' },
  { slug: 'kalimantan-utara', name: 'Kalimantan Utara' },
  { slug: 'riau', name: 'Riau' },
  { slug: 'jambi', name: 'Jambi' },
  { slug: 'sumatera-selatan', name: 'Sumatera Selatan' },
] as const

export type Province = (typeof provinces)[number]

export const findProvince = (slug: string | undefined) =>
  provinces.find((province) => province.slug === slug)
