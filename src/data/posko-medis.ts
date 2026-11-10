export interface Posko {
  readonly name: string
  readonly lng: number
  readonly lat: number
  readonly city: string
  readonly phone: string
}

interface PoskoPayload {
  readonly provinces: Record<string, readonly Posko[]>
}

// 118 KB, jadi diimpor dinamis: hanya diunduh saat toggle Posko Medis dibuka.
let cache: PoskoPayload | null = null

export async function loadPosko(slug: string | undefined): Promise<readonly Posko[]> {
  cache ??= (await import('./posko-medis.json')).default as unknown as PoskoPayload
  return cache.provinces[slug ?? ''] ?? []
}