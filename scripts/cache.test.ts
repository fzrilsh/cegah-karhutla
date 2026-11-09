import test from 'node:test'
import assert from 'node:assert/strict'
import { readCache, writeCache } from '../src/lib/cache.ts'

function createStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

test('writes and reads a cache entry before its TTL expires', () => {
  const storage = createStorage()
  let now = 1000

  writeCache('aq', { value: 42 }, { storage, ttlMs: 500, now: () => now })
  now = 1200

  assert.deepEqual(readCache('aq', { storage, ttlMs: 500, now: () => now }), { value: 42 })
})

test('removes and ignores an expired cache entry', () => {
  const storage = createStorage()
  let now = 1000

  writeCache('aq', { value: 42 }, { storage, ttlMs: 500, now: () => now })
  now = 1501

  assert.equal(readCache('aq', { storage, ttlMs: 500, now: () => now }), null)
  assert.equal(storage.getItem('aq'), null)
})
