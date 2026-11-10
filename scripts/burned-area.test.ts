import test from 'node:test'
import assert from 'node:assert/strict'
import { burnedHaByProvince } from '../src/lib/burned-area.ts'

const provinceAt = (lng: number) => (lng < 110 ? 'a' : lng <= 120 ? 'b' : undefined)

const point = (latitude: number, longitude: number, instrument: string) => ({ latitude, longitude, instrument })

test('counts each sensor pixel once and sums hectares per province', () => {
  const sums = burnedHaByProvince(
    [
      point(0, 105, 'VIIRS'),
      point(0, 105, 'VIIRS'), // hari lain, piksel sama: tidak dihitung dua kali
      point(0.001, 105, 'VIIRS'), // masih di sel 375 m yang sama
      point(0.004, 105, 'VIIRS'), // sel berikutnya
      point(0, 115, 'MODIS'), // 1 km, 100 ha
      point(0, 130, 'VIIRS'), // di luar semua provinsi
      point(-2, 105, 'SLSTR'), // sensor tak dikenal, dilewati
    ],
    provinceAt,
  )
  assert.deepEqual(sums, { a: 28, b: 100 })
})