import test from 'node:test'
import assert from 'node:assert/strict'
import { estimateIspaCases } from '../src/lib/health.ts'

test('ISPA estimate rises with PM2.5 and stays zero without exposure', () => {
  assert.equal(estimateIspaCases(1_000_000, 0), 0)
  assert.equal(estimateIspaCases(0, 50), 0)
  const low = estimateIspaCases(1_000_000, 10)
  const high = estimateIspaCases(1_000_000, 100)
  assert.ok(low > 0 && high > low)
  // 9,3% dasar x (1,019^1 - 1) x 1 juta = 1.767 kasus.
  assert.equal(low, 1767)
})