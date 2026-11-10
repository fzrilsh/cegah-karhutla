import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { countByProvince, weeklyEnds } from '../src/lib/hotspot-history.ts'

// JSON dibaca lewat fs karena Node tidak menerima import JSON tanpa import attribute.
const snapshot = JSON.parse(readFileSync(new URL('../src/data/hotspot-history.json', import.meta.url), 'utf8')) as {
  weeks: unknown[]
  provinces: { slug: string; hotspotWeekly: number[] }[]
}

const square = (slug: string, name: string, [minLng, minLat, maxLng, maxLat]: number[]) => ({
  properties: { slug, name },
  geometry: {
    type: 'Polygon',
    coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]],
  },
})

const features = [square('kotak-a', 'Kotak A', [100, -5, 110, 0]), square('kotak-b', 'Kotak B', [111, -5, 120, 0])]

test('counts points into their province and drops points outside every polygon', () => {
  const counts = countByProvince(
    [
      { longitude: 105, latitude: -2 },
      { longitude: 105.5, latitude: -1 },
      { longitude: 115, latitude: -2 },
      { longitude: 105, latitude: 5 },
    ],
    features,
    { 'Kotak A': 'kotak-a', 'Kotak B': 'kotak-b' },
  )
  assert.deepEqual(counts, { 'kotak-a': 2, 'kotak-b': 1 })
})

test('weekly ends are seven Saturdays ending on the anchor date', () => {
  const weeks = weeklyEnds('2026-11-07')
  assert.equal(weeks.length, 7)
  assert.equal(weeks[0].dateIso, '2026-09-26')
  assert.equal(weeks[6].dateIso, '2026-11-07')
  assert.equal(weeks[6].dateShort, '7 Nov')
  assert.equal(weeks[6].dateFull, 'Sabtu, 7 November 2026')
})

test('snapshot covers every province with one count per week', () => {
  assert.equal(snapshot.provinces.length, 38)
  for (const province of snapshot.provinces) {
    assert.equal(province.hotspotWeekly.length, snapshot.weeks.length, province.slug)
  }
})

test('weekly heat cells exist per week and never contain single-detection cells', () => {
  const heat = JSON.parse(readFileSync(new URL('../src/data/heat-weekly.json', import.meta.url), 'utf8')) as {
    cellDeg: number
    weeks: string[]
    heat: [number, number, number][][]
  }
  assert.equal(heat.cellDeg, 0.02)
  assert.equal(heat.heat.length, snapshot.weeks.length)
  assert.deepEqual(heat.weeks, snapshot.weeks.map((week) => (week as { dateIso: string }).dateIso))
  for (const [index, cells] of heat.heat.entries()) {
    assert.ok(cells.length > 0, `minggu ${index} kosong`)
    for (const cell of cells) {
      assert.equal(cell.length, 3)
      assert.ok(cell[2] > 1, `sel di minggu ${index} berisi ${cell[2]} deteksi`)
    }
  }
})