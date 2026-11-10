import { useEffect, useMemo, useRef, useState } from 'react'
import type maplibregl from 'maplibre-gl'
import { useMapTransition } from '@/lib/map-transition'
import { provinceMetas, INDONESIA_BOUNDS, LANDING_BOUNDS } from '@/data/provinces-meta'
import provincesGeo from '@/data/provinces-geo.json'
import heatCells from '@/data/heat-cells.json'
import { loadHeatWeek, type HeatCells } from '@/data/heat-weekly'
import { featureContainsPoint } from '@/lib/geo'
import { fetchFirmsHeat, readFirmsHeatCache } from '@/lib/firms'
import { fetchOpenMeteoSnapshot, readOpenMeteoCache, type ProvinceWeather } from '@/lib/open-meteo'
import { basemapStyle } from '@/lib/basemap-style'
import { WindSmokeLayer } from '@/components/WindSmokeLayer'
import markerRing from '@/assets/map/marker-ring.svg'
import markerCore from '@/assets/map/marker-core.svg'

const FILL_LAYER = 'province-fill'
const FILL_HOVER_LAYER = 'province-fill-hover'
const BORDER_LAYER = 'province-border'
const HEAT_LAYER = 'fire-heat'
const SOURCE_PROVINCES = 'provinces'
const SOURCE_HEAT = 'fire-heat'

// Snapshot FIRMS terakhir (bawaan bundle) dipakai sampai data runtime datang.
const SNAPSHOT_CELLS: HeatCells = (heatCells as { cells: number[][] }).cells.map(
  ([lng, lat, count]) => [lng, lat, count] as const,
)

const toHeatGeoJson = (cells: HeatCells) =>
  ({
    type: 'FeatureCollection',
    features: cells.map(([lng, lat, count]) => ({
      type: 'Feature',
      properties: { count },
      geometry: { type: 'Point', coordinates: [lng, lat] },
    })),
  }) as GeoJSON.FeatureCollection

const maxCount = (cells: HeatCells) => cells.reduce((max, cell) => Math.max(max, cell[2]), 1)

const boundsToLngLat = (b: readonly [number, number, number, number]) => [
  [b[0], b[1]],
  [b[2], b[3]],
] as [[number, number], [number, number]]

interface SharedMapProps {
  readonly isMobile: boolean
  readonly activeProvinceSlug?: string
  readonly weekIndex: number
}

function getFitPadding(isMobile: boolean, kind: 'landing' | 'national' | 'province', viewport: { width: number; height: number }) {
  if (kind === 'landing') {
    return isMobile
      ? { top: 140, bottom: 90, left: 16, right: 16 }
      : { top: 40, bottom: 40, left: 40, right: 40 }
  }
  if (kind === 'national') {
    // Ruang untuk navbar atas dan tombol aksi bawah
    return isMobile
      ? { top: 110, bottom: 100, left: 20, right: 20 }
      : { top: 90, bottom: 110, left: 60, right: 60 }
  }
  if (isMobile) {
    return { top: 140, bottom: 270, left: 16, right: 16 }
  }
  // Desktop: ulangi tata letak ProvincePage. Kolom isi maks 1120px, kartu AQI 393x453
  // di kanan atas, dua panel 605x220 di dasar (jarak 2.2% kolom). Batas provinsi
  // dipaskan ke kotak kosong di kiri kartu AQI dan di atas panel, jadi seluruh
  // boundary kelihatan dan ukurannya mengikuti sisa ruang.
  const COLUMN = 1120
  const AQI_W = 393
  const AQI_H = 453
  const AQI_TOP = 109
  const NAV_H = 79
  const BOTTOM_BAR = 50
  const GAP = 12

  const column = Math.min(viewport.width - 2 * GAP, COLUMN)
  const gutter = (viewport.width - column) / 2
  const panelH = column * 0.489 * (220 / 605)
  const availH = viewport.height - BOTTOM_BAR - panelH - AQI_TOP - GAP
  // Kartu AQI diskalakan FitBox, jadi lebarnya ikut menyusut kalau tinggi kurang.
  const aqiScale = Math.min(Math.min(AQI_W, column * (AQI_W / COLUMN)) / AQI_W, availH / AQI_H)
  const aqiW = AQI_W * Math.max(aqiScale, 0)

  return {
    top: NAV_H + GAP,
    bottom: BOTTOM_BAR + panelH + GAP,
    left: GAP,
    right: gutter + aqiW + GAP,
  }
}

export function SharedMap({ isMobile, activeProvinceSlug, weekIndex }: SharedMapProps) {
  const { camera, enterProvince } = useMapTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const maplibreRef = useRef<typeof maplibregl | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const hoveredRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [viewport, setViewport] = useState({ width: 1440, height: 1024 })
  // Sel heatmap peta nasional: cache runtime FIRMS kalau ada, kalau tidak snapshot bundle.
  const [heatLive, setHeatLive] = useState<HeatCells>(
    () => readFirmsHeatCache()?.cells ?? SNAPSHOT_CELLS,
  )
  // Sel heatmap minggu terpilih di halaman provinsi, dari snapshot build-time.
  const [heatWeek, setHeatWeek] = useState<HeatCells | null>(null)
  // Sampel angin per provinsi, dipakai bersama oleh partikel angin dan asap.
  const [weather, setWeather] = useState<readonly ProvinceWeather[]>(
    () => readOpenMeteoCache()?.weather ?? [],
  )

  // Ref untuk nilai yang dipakai di event handler peta (didaftarkan sekali saat init)
  const cameraRef = useRef(camera)
  const enterProvinceRef = useRef(enterProvince)
  const prevCameraRef = useRef(camera)
  const isMobileRef = useRef(isMobile)
  const viewportRef = useRef(viewport)
  useEffect(() => { cameraRef.current = camera }, [camera])
  useEffect(() => { enterProvinceRef.current = enterProvince }, [enterProvince])
  useEffect(() => { isMobileRef.current = isMobile }, [isMobile])
  useEffect(() => { viewportRef.current = viewport }, [viewport])

  // Posisi kamera landing disimpan di localStorage supaya kembali ke tempat semula
  // setelah keluar dari halaman detail (sama seperti implementasi peta lama)
  const LANDING_CAM_KEY = 'ck-landing-camera'

  const readLandingCamera = (): { kind: string; center: [number, number]; zoom: number } | null => {
    try {
      const raw = localStorage.getItem(LANDING_CAM_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { kind?: string; center?: [number, number]; zoom?: number }
      if (
        !Array.isArray(parsed.center) ||
        parsed.center.length !== 2 ||
        typeof parsed.center[0] !== 'number' ||
        typeof parsed.center[1] !== 'number' ||
        typeof parsed.zoom !== 'number'
      ) {
        return null
      }
      return { kind: parsed.kind ?? 'landing', center: [parsed.center[0], parsed.center[1]], zoom: parsed.zoom }
    } catch {
      return null
    }
  }

  // Inisialisasi peta sekali, maplibre di-lazy-load supaya tidak masuk initial bundle
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    let map: maplibregl.Map | null = null
    const zoomIn = () => map?.zoomIn()
    const zoomOut = () => map?.zoomOut()
    const recenter = () => {
      const national = cameraRef.current.kind === 'national'
      map?.fitBounds(
        boundsToLngLat(national ? INDONESIA_BOUNDS : LANDING_BOUNDS),
        {
          padding: getFitPadding(isMobileRef.current, national ? 'national' : 'landing', viewportRef.current),
          duration: 750,
        },
      )
    }
    window.addEventListener('map-zoom-in', zoomIn)
    window.addEventListener('map-zoom-out', zoomOut)
    window.addEventListener('map-recenter', recenter)

    const init = async () => {
      const [module] = await Promise.all([
        import('maplibre-gl'),
        import('maplibre-gl/dist/maplibre-gl.css'),
      ])
      if (cancelled || !containerRef.current) return
      const ml = module.default
      maplibreRef.current = ml

      map = new ml.Map({
        container: containerRef.current,
        style: basemapStyle,
        center: [112, -0.5],
        zoom: 4.5,
        // Portrait sempit butuh zoom ~2,4 untuk memuat seluruh Indonesia
        minZoom: 2,
        maxZoom: 12,
        attributionControl: false,
      })

      map.addControl(
        new ml.AttributionControl({ compact: true, customAttribution: '© NASA FIRMS' }),
        'bottom-left',
      )
      const geoData = provincesGeo as GeoJSON.FeatureCollection

      map.on('load', () => {
        if (!map) return
        map.addSource(SOURCE_PROVINCES, {
          type: 'geojson',
          data: geoData,
          // promoteId mengangkat properties.slug jadi feature id supaya
          // setFeatureState (untuk highlight hover/aktif) mengenali fiturnya
          promoteId: 'slug',
        })

        // Fill dasar semua provinsi (tipis, di atas peta hijau)
        map.addLayer({
          id: FILL_LAYER,
          type: 'fill',
          source: SOURCE_PROVINCES,
          paint: {
            'fill-color': '#9df0a8',
            'fill-opacity': 0.06,
          },
        })

        // Fill hover/aktif (fitur state untuk highlight)
        map.addLayer({
          id: FILL_HOVER_LAYER,
          type: 'fill',
          source: SOURCE_PROVINCES,
          paint: {
            'fill-color': '#9df0a8',
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.18,
              ['boolean', ['feature-state', 'active'], false],
              0.26,
              0,
            ],
          },
        })

        map.addLayer({
          id: BORDER_LAYER,
          type: 'line',
          source: SOURCE_PROVINCES,
          paint: {
            'line-color': '#8fe3a0',
            'line-width': 1.5,
            'line-opacity': 0.7,
          },
        })

        // Interaksi hover dan click pada layer teratas (hover layer menutupi fill dasar)
        map.on('mousemove', FILL_HOVER_LAYER, (e) => {
          if (!map || (cameraRef.current.kind !== 'landing' && cameraRef.current.kind !== 'national')) return
          const feature = e.features?.[0]
          const slug = feature?.properties?.slug as string | undefined
          if (slug === hoveredRef.current) return
          if (hoveredRef.current) {
            map.setFeatureState({ source: SOURCE_PROVINCES, id: hoveredRef.current }, { hover: false })
          }
          hoveredRef.current = slug ?? null
          if (slug) {
            map.setFeatureState({ source: SOURCE_PROVINCES, id: slug }, { hover: true })
            map.getCanvas().style.cursor = 'pointer'
          } else {
            map.getCanvas().style.cursor = ''
          }
        })

        map.on('mouseleave', FILL_HOVER_LAYER, () => {
          if (!map) return
          if (hoveredRef.current) {
            map.setFeatureState({ source: SOURCE_PROVINCES, id: hoveredRef.current }, { hover: false })
            hoveredRef.current = null
          }
          map.getCanvas().style.cursor = ''
        })

        map.on('click', FILL_HOVER_LAYER, (e) => {
          if (cameraRef.current.kind !== 'landing' && cameraRef.current.kind !== 'national') return
          const slug = e.features?.[0]?.properties?.slug as string | undefined
          if (slug) enterProvinceRef.current(slug)
        })

        setIsLoaded(true)
      })

      mapRef.current = map
    }

    init()

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setViewport({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(containerRef.current)

    const markers = markersRef.current
    return () => {
      cancelled = true
      observer.disconnect()
      markers.forEach((marker) => marker.remove())
      markers.clear()
      window.removeEventListener('map-zoom-in', zoomIn)
      window.removeEventListener('map-zoom-out', zoomOut)
      window.removeEventListener('map-recenter', recenter)
      if (map) {
        map.remove()
        map = null
      }
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bubble nama provinsi di landing dan /peta, desain Figma node 291:20082.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const showMarkers = camera.kind === 'landing' || camera.kind === 'national'
    // Bubble digambar 105px (frame Figma) lalu dikecilkan; teks tetap ukuran tetap
    // supaya nama provinsi masih terbaca saat semua provinsi tampil.
    const baseScale = isMobile ? 0.45 : 0.62

    provinceMetas.forEach((meta) => {
      let marker = markersRef.current.get(meta.slug)

      if (!showMarkers) {
        if (marker) {
          marker.remove()
          markersRef.current.delete(meta.slug)
        }
        return
      }

      if (!marker) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'province-map-marker'
        el.setAttribute('aria-label', `Buka data ${meta.name}`)
        // Elemen luar polos: MapLibre mengelola position dan transform untuk
        // positioning, jadi hover scale ditaruh di elemen visual di dalamnya.
        // Ukuran 105px sama dengan frame Figma (outer ellipse 105px, inner 81.5px).
        el.style.cssText = `
          width: 105px;
          height: 105px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: block;
        `

        const visual = document.createElement('div')
        // drop-shadow mengikuti siluet bulat aset, bukan kotak elemennya.
        visual.style.cssText = `
          position: absolute;
          inset: 0;
          transition: transform 0.18s ease-out;
          transform-origin: center center;
          pointer-events: none;
          transform: scale(${baseScale});
          filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.35));
        `

        const ring = document.createElement('img')
        ring.src = markerRing
        ring.alt = ''
        ring.style.cssText =
          'position:absolute;inset:0;width:105px;height:105px;transform:rotate(180deg);'

        const core = document.createElement('img')
        core.src = markerCore
        core.alt = ''
        core.style.cssText = 'position:absolute;inset:11.75px;width:81.5px;height:81.5px;'

        visual.appendChild(ring)
        visual.appendChild(core)
        el.appendChild(visual)

        // Label tidak ikut diskalakan bersama bubble supaya tetap terbaca.
        // Lebar dibatasi diameter lingkaran dalam yang sudah diskalakan (81.5 * baseScale),
        // jadi nama panjang turun baris dan tetap di dalam bola.
        const bubblePx = 81.5 * baseScale
        const label = document.createElement('div')
        label.style.cssText = `
          position:absolute;
          left:50%;
          top:50%;
          transform:translate(-50%,-50%);
          width:${bubblePx}px;
          max-height:${bubblePx}px;
          overflow:hidden;
          display:flex;
          align-items:center;
          justify-content:center;
          font-family:var(--font-nav);
          font-weight:700;
          font-size:${isMobile ? 6 : 8}px;
          line-height:1.1;
          color:#ffffff;
          text-align:center;
          overflow-wrap:anywhere;
          text-shadow:0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7);
        `
        label.textContent = meta.name
        el.appendChild(label)

        el.addEventListener('mouseenter', () => {
          visual.style.transform = `scale(${baseScale * 1.111})`
          if (mapRef.current) {
            mapRef.current.setFeatureState({ source: SOURCE_PROVINCES, id: meta.slug }, { hover: true })
          }
        })
        el.addEventListener('mouseleave', () => {
          visual.style.transform = `scale(${baseScale})`
          if (mapRef.current) {
            mapRef.current.setFeatureState({ source: SOURCE_PROVINCES, id: meta.slug }, { hover: false })
          }
        })
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          enterProvince(meta.slug)
        })

        const ml = maplibreRef.current
        if (!ml) return

        marker = new ml.Marker({ element: el, anchor: 'center' })
          .setLngLat([meta.markerLng, meta.markerLat])
          .addTo(map)

        markersRef.current.set(meta.slug, marker)
      } else {
        // Marker sudah ada: sinkronkan base scale (misal setelah resize melewati breakpoint)
        const visual = marker.getElement().firstElementChild as HTMLElement | null
        if (visual) visual.style.transform = `scale(${baseScale})`
      }
    })

    // Hapus marker yang tidak diperlukan lagi
    markersRef.current.forEach((marker, slug) => {
      if (!showMarkers) {
        marker.remove()
        markersRef.current.delete(slug)
      }
    })
  }, [isLoaded, camera.kind, enterProvince, isMobile])

  // Highlight provinsi aktif di halaman detail, pakai feature-state terpisah
  // supaya tidak direset oleh handler hover di landing
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const activeSlug = camera.kind === 'province' ? camera.slug : activeProvinceSlug

    provinceMetas.forEach((meta) => {
      map.setFeatureState(
        { source: SOURCE_PROVINCES, id: meta.slug },
        { active: meta.slug === activeSlug },
      )
    })
  }, [isLoaded, camera, activeProvinceSlug])

  // Ambil titik api FIRMS terbaru sekali per sesi. Cache TTL 1 jam di lib/firms.
  useEffect(() => {
    const controller = new AbortController()
    fetchFirmsHeat({ signal: controller.signal })
      .then((snapshot) => {
        if (snapshot.cells.length > 0) setHeatLive(snapshot.cells)
      })
      .catch(() => {
        // Gagal fetch: tetap pakai cache lama atau snapshot bundle.
      })
    return () => controller.abort()
  }, [])

  // Halaman provinsi: muat sel heatmap minggu terpilih, ikut slider.
  // Peta nasional tetap pakai data 5 hari terakhir karena tidak punya slider.
  const isProvinceView = camera.kind === 'province'
  useEffect(() => {
    if (!isProvinceView) return
    let active = true
    loadHeatWeek(weekIndex)
      .then((cells) => {
        if (active) setHeatWeek(cells)
      })
      .catch(() => {
        // Gagal muat: heatmap tetap pakai sel terakhir yang tampil.
      })
    return () => {
      active = false
    }
  }, [isProvinceView, weekIndex])

  // Ambil sampel angin/udara sekali per sesi, cache 15 menit di lib/open-meteo.
  useEffect(() => {
    const controller = new AbortController()
    fetchOpenMeteoSnapshot({ signal: controller.signal })
      .then((snapshot) => setWeather(snapshot.weather))
      .catch(() => {
        // Gagal fetch: tetap pakai cache lama. Tanpa angin lapisan asap tidak digambar.
      })
    return () => controller.abort()
  }, [])

  // Titik api: heatmap dari sel FIRMS yang sudah diagregasi.
  // Tampil di /peta dan halaman detail provinsi. Halaman provinsi pakai minggu
  // terpilih, peta nasional pakai 5 hari terakhir.
  // Halaman provinsi hanya memuat sel di dalam poligon provinsinya, supaya bobot
  // heatmap dinormalisasi ke sel terpadat provinsi itu. Dengan maksimum nasional,
  // provinsi berapi jarang (misal Sulawesi Tenggara) jatuh di ujung transparan
  // ramp warna dan tak terlihat di atas peta hijau.
  const heat = useMemo(() => {
    if (camera.kind !== 'province') return heatLive
    const feature = (provincesGeo as GeoJSON.FeatureCollection).features.find(
      (item) => item.properties?.slug === camera.slug,
    ) as Parameters<typeof featureContainsPoint>[0] | undefined
    if (!feature) return []
    return (heatWeek ?? heatLive).filter(([lng, lat]) => featureContainsPoint(feature, lng, lat))
  }, [camera, heatWeek, heatLive])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const showHeat = camera.kind === 'national' || camera.kind === 'province'

    if (map.getLayer(HEAT_LAYER)) map.removeLayer(HEAT_LAYER)
    if (map.getSource(SOURCE_HEAT)) map.removeSource(SOURCE_HEAT)

    if (!showHeat) return

    map.addSource(SOURCE_HEAT, { type: 'geojson', data: toHeatGeoJson(heat) })

    map.addLayer({
      id: HEAT_LAYER,
      type: 'heatmap',
      source: SOURCE_HEAT,
      maxzoom: 11,
      paint: {
        // Bobot dari jumlah deteksi per sel, dinormalisasi ke nilai maksimum.
        'heatmap-weight': ['/', ['get', 'count'], maxCount(heat)],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 5, 1.2, 8, 2],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 18, 5, 30, 8, 45],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.85, 9, 0.85, 11, 0],
        // Gradasi hijau ke merah seperti desain.
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(40,101,63,0)',
          0.2, '#28653f',
          0.45, '#8d8225',
          0.65, '#b8751b',
          0.85, '#c22a09',
          1, '#c22a09',
        ],
      },
    })

    // Heatmap di bawah garis batas dan fill provinsi supaya batas tetap terbaca.
    if (map.getLayer(FILL_LAYER)) map.moveLayer(HEAT_LAYER, FILL_LAYER)
  }, [isLoaded, camera, heat])

  // Di halaman detail provinsi peta dikunci supaya fokus ke satu provinsi.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return
    const locked = camera.kind === 'province'
    const handlers = [
      map.dragPan,
      map.scrollZoom,
      map.doubleClickZoom,
      map.touchZoomRotate,
      map.dragRotate,
      map.boxZoom,
      map.keyboard,
    ]
    handlers.forEach((handler) => (locked ? handler.disable() : handler.enable()))
  }, [isLoaded, camera.kind])

  // Framing kamera mengikuti route
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const padding = getFitPadding(
      isMobile,
      camera.kind === 'province' ? 'province' : camera.kind === 'national' ? 'national' : 'landing',
      viewport,
    )

    // Simpan kamera peta tepat sebelum masuk halaman detail (dari landing atau /peta)
    const prevCam = prevCameraRef.current
    prevCameraRef.current = camera
    if (prevCam.kind !== 'province' && camera.kind === 'province') {
      try {
        const c = map.getCenter()
        localStorage.setItem(
          LANDING_CAM_KEY,
          JSON.stringify({ kind: prevCam.kind, center: [c.lng, c.lat], zoom: map.getZoom() }),
        )
      } catch {
        // abaikan kegagalan storage
      }
    }

    if (camera.kind === 'landing' || camera.kind === 'national') {
      // Saat kembali dari detail, pulihkan kamera persis sebelum provinsi diklik.
      // Hanya dipulihkan kalau halaman asalnya sama, supaya /peta tetap zoom out penuh.
      const saved = prevCam.kind === 'province' ? readLandingCamera() : null
      if (saved && saved.kind === camera.kind) {
        map.easeTo({
          center: saved.center,
          zoom: saved.zoom,
          duration: 750,
          essential: true,
        })
        return
      }
      map.fitBounds(
        boundsToLngLat(camera.kind === 'national' ? INDONESIA_BOUNDS : LANDING_BOUNDS),
        { padding, duration: 750, essential: true },
      )
      return
    }

    const meta = provinceMetas.find((m) => m.slug === camera.slug)
    if (!meta) return

    map.fitBounds(
      [
        [meta.bounds[0], meta.bounds[1]],
        [meta.bounds[2], meta.bounds[3]],
      ],
      { padding, duration: 750, essential: true },
    )
  }, [isLoaded, camera, isMobile, viewport])

  // Arah angin dan sebaran asap hanya relevan di peta, bukan landing.
  const showWindSmoke =
    isLoaded && (camera.kind === 'national' || camera.kind === 'province')

  return (
    <>
      <div
        ref={containerRef}
        className="absolute inset-0 z-10 size-full"
        style={{ background: 'var(--color-stage)' }}
      />
      <WindSmokeLayer
        map={mapRef.current}
        weather={weather}
        cells={heat}
        enabled={showWindSmoke}
        isMobile={isMobile}
      />
    </>
  )
}
