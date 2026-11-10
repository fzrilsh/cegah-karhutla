import test from 'node:test'
import assert from 'node:assert/strict'
import { aqiCategory, meanBetween } from '../src/lib/air-quality.ts'

test('aqiCategory matches Figma tiers and colors', () => {
  assert.deepEqual(aqiCategory(0), { label: 'AMAN', color: '#61E154' })
  assert.deepEqual(aqiCategory(50), { label: 'AMAN', color: '#61E154' })
  assert.deepEqual(aqiCategory(51), { label: 'SEDANG', color: '#E7DB1D' })
  assert.deepEqual(aqiCategory(151), { label: 'TIDAK SEHAT', color: '#F5B80D' })
  assert.deepEqual(aqiCategory(201), { label: 'SANGAT TIDAK SEHAT', color: '#FE8101' })
  assert.deepEqual(aqiCategory(301), { label: 'BERBAHAYA', color: '#FB0401' })
})

test('meanBetween averages only hours inside the week and skips nulls', () => {
  const times = ['2026-09-26T23:00', '2026-09-27T00:00', '2026-10-03T12:00', '2026-10-04T00:00']
  const values = [100, 200, null, 400]

  assert.equal(meanBetween(times, values, '2026-09-27', '2026-10-03'), 200)
  assert.equal(meanBetween(times, values, '2026-09-01', '2026-09-30'), 150)
  assert.equal(meanBetween(times, values, '2025-01-01', '2025-01-07'), 0)
})