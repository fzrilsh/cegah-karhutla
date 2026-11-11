import test from 'node:test'
import assert from 'node:assert/strict'
import { boundsAround, featureContainsPoint, findProvinceNameAt, formatCoordinate } from '../src/lib/geo.ts'

const square = (name: string, [minLng, minLat, maxLng, maxLat]: number[]) => ({
  properties: { name },
  geometry: {
    type: 'Polygon',
    coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]],
  },
})

const features = [square('Kotak A', [100, -5, 110, 0]), square('Kotak B', [111, -5, 120, 0])]

test('matches a point inside a province polygon', () => {
  assert.equal(findProvinceNameAt(features, 105, -2), 'Kotak A')
  assert.equal(findProvinceNameAt(features, 115, -2), 'Kotak B')
})

test('returns undefined outside every polygon', () => {
  assert.equal(findProvinceNameAt(features, 105, 5), undefined)
  assert.equal(findProvinceNameAt(features, 110.5, -2), undefined)
})

test('featureContainsPoint filters heat cells by the province polygon, not its bbox', () => {
  // Kotak A dan B berbagi bbox 100..120 x -5..0, titik di celah antarkeduanya
  // ada di bbox tapi bukan di poligon mana pun.
  assert.equal(featureContainsPoint(features[0], 105, -2), true)
  assert.equal(featureContainsPoint(features[0], 115, -2), false)
  assert.equal(featureContainsPoint(features[0], 110.5, -2), false)
})

test('boundsAround orders a route west of the origin as [southwest, northeast]', () => {
  // Tujuan di barat asal. Dibalik, MapLibre menganggapnya lintas antimeridian
  // dan kamera lompat ke belahan bumi lain.
  assert.deepEqual(boundsAround([106.63, -6.18], [106.6047, -6.1878]), [[106.6047, -6.1878], [106.63, -6.18]])
  assert.deepEqual(boundsAround([106.63, -6.18], [106.72, -6.12]), [[106.63, -6.18], [106.72, -6.12]])
})

test('formats coordinates with LS/BT hemisphere labels', () => {
  assert.equal(formatCoordinate(-0.467, 111.33), '0.467° LS, 111.330° BT')
  assert.equal(formatCoordinate(4.2838, 96.9334), '4.284° LU, 96.933° BT')
})