// Metadata provinsi: nama, posisi marker dan bbox dalam lng/lat.
// Geometri dari batas administrasi 38 provinsi (CC BY 4.0, denyherianto/indonesia-geojson-topojson-maps-with-38-provinces).
// markerLng/markerLat adalah titik label di dalam poligon provinsi.
export interface ProvinceMeta {
  readonly slug: string
  readonly name: string
  readonly markerLng: number
  readonly markerLat: number
  readonly bounds: readonly [minLng: number, minLat: number, maxLng: number, maxLat: number]
}

export const provinceMetas: readonly ProvinceMeta[] = [
  {
    slug: 'aceh',
    name: 'Aceh',
    markerLng: 96.9334,
    markerLat: 4.2838,
    bounds: [95.1935, 2.0554, 98.2872, 5.9071],
  },
  {
    slug: 'bali',
    name: 'Bali',
    markerLng: 115.0974,
    markerLat: -8.3621,
    bounds: [114.4388, -8.8489, 115.7104, -8.0616],
  },
  {
    slug: 'banten',
    name: 'Banten',
    markerLng: 106.1034,
    markerLat: -6.4624,
    bounds: [105.1207, -6.9785, 106.7799, -5.891],
  },
  {
    slug: 'bengkulu',
    name: 'Bengkulu',
    markerLng: 102.3582,
    markerLat: -3.5389,
    bounds: [101.0224, -5.4855, 103.7905, -2.2887],
  },
  {
    slug: 'dki-jakarta',
    name: 'DKI Jakarta',
    markerLng: 106.836,
    markerLat: -6.1997,
    bounds: [106.6868, -6.3503, 106.97, -6.0896],
  },
  {
    slug: 'daerah-istimewa-yogyakarta',
    name: 'Daerah Istimewa Yogyakarta',
    markerLng: 110.4372,
    markerLat: -7.8822,
    bounds: [110.0035, -8.2031, 110.8349, -7.5412],
  },
  {
    slug: 'gorontalo',
    name: 'Gorontalo',
    markerLng: 122.36,
    markerLat: 0.6954,
    bounds: [121.1657, 0.3203, 123.5332, 1.0386],
  },
  {
    slug: 'jambi',
    name: 'Jambi',
    markerLng: 102.7167,
    markerLat: -1.6935,
    bounds: [101.1345, -2.7685, 104.491, -0.7317],
  },
  {
    slug: 'jawa-barat',
    name: 'Jawa Barat',
    markerLng: 107.6097,
    markerLat: -6.916,
    bounds: [106.3706, -7.8183, 108.8308, -5.9206],
  },
  {
    slug: 'jawa-tengah',
    name: 'Jawa Tengah',
    markerLng: 110.1999,
    markerLat: -7.255,
    bounds: [108.5566, -8.2113, 111.6914, -6.4044],
  },
  {
    slug: 'jawa-timur',
    name: 'Jawa Timur',
    markerLng: 112.6111,
    markerLat: -7.8143,
    bounds: [110.9001, -8.7504, 115.9018, -5.7371],
  },
  {
    slug: 'kalimantan-barat',
    name: 'Kalimantan Barat',
    markerLng: 111.152,
    markerLat: -0.0756,
    bounds: [108.7993, -3.0292, 114.2055, 2.065],
  },
  {
    slug: 'kalimantan-selatan',
    name: 'Kalimantan Selatan',
    markerLng: 115.3911,
    markerLat: -2.964,
    bounds: [114.352, -4.1747, 116.5553, -1.3126],
  },
  {
    slug: 'kalimantan-tengah',
    name: 'Kalimantan Tengah',
    markerLng: 113.4228,
    markerLat: -1.6061,
    bounds: [110.7332, -3.539, 115.842, 0.7317],
  },
  {
    slug: 'kalimantan-timur',
    name: 'Kalimantan Timur',
    markerLng: 116.4401,
    markerLat: 0.4567,
    bounds: [113.8418, -2.4088, 118.9865, 2.5647],
  },
  {
    slug: 'kalimantan-utara',
    name: 'Kalimantan Utara',
    markerLng: 116.2035,
    markerLat: 2.887,
    bounds: [114.5652, 1.1179, 117.9882, 4.3915],
  },
  {
    slug: 'kepulauan-bangka-belitung',
    name: 'Kepulauan Bangka Belitung',
    markerLng: 106.0039,
    markerLat: -2.2583,
    bounds: [105.1087, -3.2714, 108.2942, -1.5018],
  },
  {
    slug: 'kepulauan-riau',
    name: 'Kepulauan Riau',
    markerLng: 108.2133,
    markerLat: 3.9288,
    bounds: [103.3277, -0.6839, 109.1166, 4.2305],
  },
  {
    slug: 'lampung',
    name: 'Lampung',
    markerLng: 105.0147,
    markerLat: -4.9113,
    bounds: [103.596, -5.9431, 105.9128, -3.7326],
  },
  {
    slug: 'maluku',
    name: 'Maluku',
    markerLng: 129.4623,
    markerLat: -3.2045,
    bounds: [125.8074, -8.3447, 134.8738, -2.7739],
  },
  {
    slug: 'maluku-utara',
    name: 'Maluku Utara',
    markerLng: 128.0148,
    markerLat: 0.8818,
    bounds: [124.3373, -2.4409, 128.8688, 2.6452],
  },
  {
    slug: 'nusa-tenggara-barat',
    name: 'Nusa Tenggara Barat',
    markerLng: 117.8547,
    markerLat: -8.6374,
    bounds: [115.8235, -9.1042, 119.1845, -8.0801],
  },
  {
    slug: 'nusa-tenggara-timur',
    name: 'Nusa Tenggara Timur',
    markerLng: 121.1449,
    markerLat: -8.6003,
    bounds: [118.9273, -10.9302, 125.1809, -8.0635],
  },
  {
    slug: 'papua',
    name: 'Papua',
    markerLng: 138.7223,
    markerLat: -2.7093,
    bounds: [134.7944, -4.1142, 141.0013, -0.6302],
  },
  {
    slug: 'papua-barat',
    name: 'Papua Barat',
    markerLng: 133.6396,
    markerLat: -2.6523,
    bounds: [131.9514, -4.2525, 135.1978, -0.7199],
  },
  {
    slug: 'papua-barat-daya',
    name: 'Papua Barat Daya',
    markerLng: 132.3235,
    markerLat: -1.1774,
    bounds: [129.7304, -2.2837, 133.4858, -0.0061],
  },
  {
    slug: 'papua-pegunungan',
    name: 'Papua Pegunungan',
    markerLng: 139.4512,
    markerLat: -4.2296,
    bounds: [137.7336, -5.3444, 141.0012, -2.9374],
  },
  {
    slug: 'papua-selatan',
    name: 'Papua Selatan',
    markerLng: 139.6925,
    markerLat: -6.5305,
    bounds: [137.6406, -9.1255, 141.02, -4.5668],
  },
  {
    slug: 'papua-tengah',
    name: 'Papua Tengah',
    markerLng: 136.6159,
    markerLat: -3.9098,
    bounds: [134.5855, -5.2177, 138.3539, -2.7059],
  },
  {
    slug: 'riau',
    name: 'Riau',
    markerLng: 101.7626,
    markerLat: 0.4557,
    bounds: [100.0534, -1.1242, 103.809, 2.5477],
  },
  {
    slug: 'sulawesi-barat',
    name: 'Sulawesi Barat',
    markerLng: 119.3504,
    markerLat: -2.4546,
    bounds: [118.7572, -3.5631, 119.872, -0.8495],
  },
  {
    slug: 'sulawesi-selatan',
    name: 'Sulawesi Selatan',
    markerLng: 120.1539,
    markerLat: -3.646,
    bounds: [119.3542, -7.3974, 121.7841, -1.948],
  },
  {
    slug: 'sulawesi-tengah',
    name: 'Sulawesi Tengah',
    markerLng: 121.0704,
    markerLat: -0.9967,
    bounds: [119.4275, -3.6116, 123.6125, 1.3557],
  },
  {
    slug: 'sulawesi-tenggara',
    name: 'Sulawesi Tenggara',
    markerLng: 121.8242,
    markerLat: -3.8046,
    bounds: [120.8645, -5.7781, 123.996, -2.7733],
  },
  {
    slug: 'sulawesi-utara',
    name: 'Sulawesi Utara',
    markerLng: 124.2877,
    markerLat: 0.9003,
    bounds: [123.1215, 0.3203, 126.9112, 4.5436],
  },
  {
    slug: 'sumatera-barat',
    name: 'Sumatera Barat',
    markerLng: 100.652,
    markerLat: -0.6878,
    bounds: [98.5965, -3.3471, 101.8839, 0.8905],
  },
  {
    slug: 'sumatera-selatan',
    name: 'Sumatera Selatan',
    markerLng: 104.1689,
    markerLat: -3.2184,
    bounds: [102.0639, -4.9174, 106.0967, -1.6293],
  },
  {
    slug: 'sumatera-utara',
    name: 'Sumatera Utara',
    markerLng: 99.1622,
    markerLat: 2.2947,
    bounds: [97.0589, -0.5465, 100.4345, 4.2899],
  },
]

// Bounding box seluruh Indonesia untuk framing /peta
export const INDONESIA_BOUNDS: readonly [number, number, number, number] = [
  94.9, -11.1, 141.1, 6.1,
]

// Bounding box lama (8 provinsi target) untuk framing landing
export const LANDING_BOUNDS: readonly [number, number, number, number] = [
  100.053658, -4.923104, 118.988958, 4.408174,
]
