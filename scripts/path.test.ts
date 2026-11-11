import test from 'node:test'
import assert from 'node:assert/strict'
import { routeFromPath } from '../src/lib/path.ts'

test('route dikenal', () => {
  assert.equal(routeFromPath('/').kind, 'landing')
  assert.equal(routeFromPath('/peta/').kind, 'national')
  assert.deepEqual(routeFromPath('/provinsi/aceh/'), { kind: 'province', slug: 'aceh' })
})

test('route asing jatuh ke not-found', () => {
  assert.equal(routeFromPath('/peta/ciki').kind, 'not-found')
  assert.equal(routeFromPath('/provinsi/ciki').kind, 'not-found')
  assert.equal(routeFromPath('/provinsi/').kind, 'not-found')
  assert.equal(routeFromPath('/apa-saja').kind, 'not-found')
})