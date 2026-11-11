// Pencocokan titik ke poligon provinsi, dipakai untuk melabeli lokasi GPS pengguna.
type Ring = readonly (readonly number[])[]
type Polygon = readonly Ring[]

function inRing(ring: Ring, lng: number, lat: number) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inPolygon(polygon: Polygon, lng: number, lat: number) {
  // Ring pertama batas luar, sisanya lubang.
  if (!inRing(polygon[0], lng, lat)) return false
  return !polygon.slice(1).some((hole) => inRing(hole, lng, lat))
}

interface ProvinceFeature {
  readonly properties: { readonly name: string }
  readonly geometry: { readonly type: string; readonly coordinates: unknown }
}

export function featureContainsPoint(feature: ProvinceFeature, lng: number, lat: number): boolean {
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates as Polygon]
      : (feature.geometry.coordinates as readonly Polygon[])
  return polygons.some((polygon) => inPolygon(polygon, lng, lat))
}

export function findProvinceNameAt(
  features: readonly ProvinceFeature[],
  lng: number,
  lat: number,
): string | undefined {
  for (const feature of features) {
    if (featureContainsPoint(feature, lng, lat)) return feature.properties.name
  }
  return undefined
}

// MapLibre membaca pasangan bounds sebagai [barat daya, timur laut]. Kalau
// dibalik (tujuan di barat asal), east < west dan MapLibre mengira lintas
// antimeridian, kamera lompat ke belahan bumi lain.
export function boundsAround(
  a: readonly [number, number],
  b: readonly [number, number],
): [[number, number], [number, number]] {
  return [
    [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
    [Math.max(a[0], b[0]), Math.max(a[1], b[1])],
  ]
}

// Format desain: "0.467° LS, 111.330° BT".
export function formatCoordinate(lat: number, lng: number) {
  const latText = `${Math.abs(lat).toFixed(3)}° ${lat < 0 ? 'LS' : 'LU'}`
  const lngText = `${Math.abs(lng).toFixed(3)}° ${lng < 0 ? 'BB' : 'BT'}`
  return `${latText}, ${lngText}`
}