import { provinceMetas } from './provinces-meta'

// Satu sumber daftar provinsi: turunan dari geometri 38 provinsi.
export const provinces = provinceMetas.map(({ slug, name }) => ({ slug, name }))

export type Province = { readonly slug: string; readonly name: string }

export const findProvince = (slug: string | undefined) =>
  provinces.find((province) => province.slug === slug)