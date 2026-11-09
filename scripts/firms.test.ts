import test from 'node:test'
import assert from 'node:assert/strict'
import {
  KALIMANTAN_BOUNDS,
  buildFirmsAreaUrl,
  parseFirmsCsv,
  toFirmsGeoJson,
} from '../src/lib/firms.ts'

const HEADER = 'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight'

test('parses a FIRMS CSV row into a normalized fire point', () => {
  const csv = `${HEADER}\n0.47178,110.488985,340.2,0.4,0.5,2026-11-08,1234,Suomi NPP,VIIRS,n,2.0NRT,300.1,12.5,D`

  const result = parseFirmsCsv(csv)

  assert.equal(result.status, 'ok')
  assert.equal(result.points.length, 1)
  assert.deepEqual(result.points[0], {
    id: '2026-11-08T1234-110.488985-0.47178-Suomi NPP',
    latitude: 0.47178,
    longitude: 110.488985,
    acquisitionDate: '2026-11-08',
    acquisitionTime: '1234',
    satellite: 'Suomi NPP',
    instrument: 'VIIRS',
    confidence: 'nominal',
    frp: 12.5,
    dayNight: 'D',
  })
})

test('treats a header-only response as a valid empty result', () => {
  const result = parseFirmsCsv(HEADER)

  assert.deepEqual(result, { status: 'no-detections', points: [], skippedRows: 0 })
})

test('skips malformed and out-of-bounds rows without failing the whole response', () => {
  const csv = [
    HEADER,
    '0,110,340,0,0,2026-11-08,1000,NOAA-20,VIIRS,h,2,300,3,D',
    'not-a-lat,110,340,0,0,2026-11-08,1001,NOAA-20,VIIRS,h,2,300,3,D',
    '12,110,340,0,0,2026-11-08,1002,NOAA-20,VIIRS,h,2,300,3,D',
  ].join('\n')

  const result = parseFirmsCsv(csv)

  assert.equal(result.status, 'ok')
  assert.equal(result.points.length, 1)
  assert.equal(result.skippedRows, 2)
  assert.equal(result.points[0]?.confidence, 'high')
})

test('normalizes numeric, missing, and unknown confidence values', () => {
  const rows = ['l', 'n', 'h', '73', '', 'experimental'].map((confidence, index) =>
    `0.${index + 1},110.${index + 1},340,0,0,2026-11-08,10${index}0,NOAA-20,VIIRS,${confidence},2,300,3,D`,
  )
  const result = parseFirmsCsv([HEADER, ...rows].join('\n'))

  assert.equal(result.points[0]?.confidence, 'low')
  assert.equal(result.points[1]?.confidence, 'nominal')
  assert.equal(result.points[2]?.confidence, 'high')
  assert.equal(result.points[3]?.confidence, 73)
  assert.equal(result.points[4]?.confidence, null)
  assert.equal(result.points[5]?.confidence, 'experimental')
})

test('creates a GeoJSON FeatureCollection from normalized points', () => {
  const result = parseFirmsCsv(`${HEADER}\n0.1,110.1,340,0,0,2026-11-08,1000,NOAA-20,VIIRS,h,2,300,3,D`)
  const geoJson = toFirmsGeoJson(result.points)

  assert.equal(geoJson.type, 'FeatureCollection')
  assert.equal(geoJson.features.length, 1)
  assert.deepEqual(geoJson.features[0]?.geometry, {
    type: 'Point',
    coordinates: [110.1, 0.1],
  })
  assert.equal(geoJson.features[0]?.properties.confidence, 'high')
})

test('builds a FIRMS area URL without putting a key in source code', () => {
  const url = buildFirmsAreaUrl({
    mapKey: 'test-key',
    source: 'VIIRS_SNPP_NRT',
    bounds: KALIMANTAN_BOUNDS,
    dayRange: 5,
    date: '2026-11-08',
  })

  assert.equal(
    url,
    'https://firms.modaps.eosdis.nasa.gov/api/area/csv/test-key/VIIRS_SNPP_NRT/108,-5,119,5/5/2026-11-08',
  )
})
