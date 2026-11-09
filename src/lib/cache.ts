export interface CacheEntry<T> {
  readonly value: T
  readonly savedAt: number
}

export interface CacheOptions {
  readonly ttlMs: number
  readonly storage?: Storage
  readonly now?: () => number
}

export function readCache<T>(key: string, options: CacheOptions): T | null {
  const storage = options.storage ?? getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    const now = options.now?.() ?? Date.now()
    if (!Number.isFinite(entry.savedAt) || now - entry.savedAt > options.ttlMs) {
      storage.removeItem(key)
      return null
    }
    return entry.value
  } catch {
    storage.removeItem(key)
    return null
  }
}

export function writeCache<T>(key: string, value: T, options: CacheOptions): void {
  const storage = options.storage ?? getStorage()
  if (!storage) return

  try {
    const entry: CacheEntry<T> = { value, savedAt: options.now?.() ?? Date.now() }
    storage.setItem(key, JSON.stringify(entry))
  } catch {
    // Cache is an optimization. Quota and private-mode errors must not break data loading.
  }
}

function getStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage
}
