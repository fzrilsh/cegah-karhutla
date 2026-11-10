import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchOpenMeteoSnapshot, nearestWind } from '../src/lib/open-meteo.ts'

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 })
}

test('fetches multi-location weather and air quality and converts wind to smoke direction', async () => {
  const urls: string[] = []
  const fetcher: typeof fetch = async (input) => {
    const url = String(input)
    urls.push(url)
    if (url.includes('air-quality-api')) {
      return response([{ latitude: 0, longitude: 110, current: { time: '2026-11-08T12:00', us_aqi: 64, pm2_5: 10.7 } }])
    }
    return response([{ latitude: 0, longitude: 110, current: { time: '2026-11-08T12:00', wind_speed_10m: 12, wind_direction_10m: 242 } }])
  }

  const snapshot = await fetchOpenMeteoSnapshot({ fetcher, now: () => 0 })

  assert.equal(urls.length, 2)
  assert.equal(snapshot.airQuality[0]?.aqi, 64)
  assert.equal(snapshot.weather[0]?.smokeDirection, 62)
  assert.match(urls[0] ?? '', /latitude=/)
})

test('normalizes missing API values to null', async () => {
  const fetcher: typeof fetch = async () => response([{ latitude: 0, longitude: 110, current: {} }])

  const snapshot = await fetchOpenMeteoSnapshot({ fetcher, now: () => 0 })

  assert.equal(snapshot.airQuality[0]?.aqi, null)
  assert.equal(snapshot.airQuality[0]?.pm25, null)
  assert.equal(snapshot.weather[0]?.windSpeed, null)
  assert.equal(snapshot.weather[0]?.smokeDirection, null)
})

test('nearestWind picks the closest sample and converts smoke direction to a vector', () => {
  const weather = [
    { latitude: 0, longitude: 110, time: '', windSpeed: 10, windDirection: 270, smokeDirection: 90 },
    { latitude: -3, longitude: 114, time: '', windSpeed: 20, windDirection: 0, smokeDirection: 180 },
  ]

  // Titik di dekat sampel pertama: angin bergerak ke timur (smokeDirection 90).
  const first = nearestWind(0.4, 110.2, weather)
  assert.ok(first)
  assert.ok(Math.abs(first.u - 10) < 1e-9)
  assert.ok(Math.abs(first.v) < 1e-9)

  // Titik di dekat sampel kedua: angin bergerak ke selatan.
  const second = nearestWind(-3.2, 113.9, weather)
  assert.ok(second)
  assert.ok(Math.abs(second.u) < 1e-9)
  assert.ok(second.v < 0)
})

test('nearestWind returns null when the closest sample has no wind data', () => {
  const weather = [
    { latitude: 0, longitude: 110, time: '', windSpeed: null, windDirection: null, smokeDirection: null },
  ]

  assert.equal(nearestWind(0.1, 110.1, weather), null)
  assert.equal(nearestWind(0, 0, []), null)
})
