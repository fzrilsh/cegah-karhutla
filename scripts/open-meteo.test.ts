import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchOpenMeteoSnapshot } from '../src/lib/open-meteo.ts'

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
