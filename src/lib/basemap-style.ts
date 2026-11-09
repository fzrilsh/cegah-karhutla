import type { StyleSpecification } from 'maplibre-gl'

// Vektor OpenFreeMap (OpenMapTiles) diwarnai ulang mengikuti peta Figma:
// laut biru hijau, daratan hijau gelap, tutupan hutan lebih pekat.
// Warna diambil dari sampel node 291:15991.
const SEA = '#1b7082'
const LAND = '#1d6242'
const FOREST = '#174d34'
const RIVER = '#2f9cae'

export const basemapStyle: StyleSpecification = {
  version: 8,
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: '© OpenMapTiles © OpenStreetMap',
    },
  },
  layers: [
    // Latar = daratan, laut ditimpa layer water di bawah.
    { id: 'land', type: 'background', paint: { 'background-color': LAND } },
    {
      id: 'landcover',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
      paint: {
        'fill-color': [
          'match',
          ['get', 'class'],
          ['wood', 'scrub'],
          FOREST,
          ['grass', 'farmland', 'wetland'],
          LAND,
          LAND,
        ],
        'fill-opacity': 0.85,
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
      paint: { 'fill-color': SEA },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: { 'line-color': RIVER, 'line-width': 1, 'line-opacity': 0.6 },
    },
  ],
}