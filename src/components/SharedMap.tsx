import { useEffect, useRef, useState } from 'react'
import type maplibregl from 'maplibre-gl'
import { useMapTransition } from '@/lib/map-transition'
import { provinceMetas, ALL_PROVINCES_BOUNDS } from '@/data/provinces-meta'
import { provinceFirePoints } from '@/data/fire-points'
import { DEFAULT_WEEK_INDEX } from '@/data/kalbar-weekly-metrics'
import provincesGeo from '@/data/provinces-geo.json'
import markerRing from '@/assets/map/marker-ring.svg'
import markerCore from '@/assets/map/marker-core.svg'

const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const FILL_LAYER = 'province-fill'
const FILL_HOVER_LAYER = 'province-fill-hover'
const BORDER_LAYER = 'province-border'
const FIRE_LAYER = 'fire-points'
const SOURCE_PROVINCES = 'provinces'
const SOURCE_FIRE = 'fire-points'

interface SharedMapProps {
  readonly isMobile: boolean
  readonly activeProvinceSlug?: string
  readonly mode?: 'fire' | 'smoke'
  readonly weekIndex?: number
}

function getFitPadding(isMobile: boolean, kind: 'landing' | 'province', viewport: { width: number; height: number }) {
  if (kind === 'landing') {
    return isMobile
      ? { top: 140, bottom: 90, left: 16, right: 16 }
      : { top: 40, bottom: 40, left: 40, right: 40 }
  }
  if (isMobile) {
    return { top: 140, bottom: 270, left: 16, right: 16 }
  }
  // Desktop: ruang untuk bar atas, kartu kanan (434px + margin), slider bawah
  const ui = Math.min(1.5, Math.max(0.6, viewport.width / 1440))
  const marginX = Math.max(16, 0.0347 * viewport.width)
  const marginTop = Math.max(12, 0.0488 * viewport.height)
  return {
    top: marginTop + 60 * ui + 24,
    bottom: 140 + marginTop + 16,
    left: marginX + 60 * ui + 24,
    right: marginX + 434 * ui + 32,
  }
}

export function SharedMap({ isMobile, activeProvinceSlug, mode = 'fire', weekIndex = DEFAULT_WEEK_INDEX }: SharedMapProps) {
  const { camera, enterProvince } = useMapTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const maplibreRef = useRef<typeof maplibregl | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const hoveredRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [viewport, setViewport] = useState({ width: 1440, height: 1024 })

  // Ref untuk nilai yang dipakai di event handler peta (didaftarkan sekali saat init)
  const cameraRef = useRef(camera)
  const enterProvinceRef = useRef(enterProvince)
  const prevCameraRef = useRef(camera)
  useEffect(() => { cameraRef.current = camera }, [camera])
  useEffect(() => { enterProvinceRef.current = enterProvince }, [enterProvince])

  // Posisi kamera landing disimpan di localStorage supaya kembali ke tempat semula
  // setelah keluar dari halaman detail (sama seperti implementasi peta lama)
  const LANDING_CAM_KEY = 'ck-landing-camera'

  const readLandingCamera = (): { center: [number, number]; zoom: number } | null => {
    try {
      const raw = localStorage.getItem(LANDING_CAM_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { center?: [number, number]; zoom?: number }
      if (
        !Array.isArray(parsed.center) ||
        parsed.center.length !== 2 ||
        typeof parsed.center[0] !== 'number' ||
        typeof parsed.center[1] !== 'number' ||
        typeof parsed.zoom !== 'number'
      ) {
        return null
      }
      return { center: [parsed.center[0], parsed.center[1]], zoom: parsed.zoom }
    } catch {
      return null
    }
  }

  // Inisialisasi peta sekali, maplibre di-lazy-load supaya tidak masuk initial bundle
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    let map: maplibregl.Map | null = null

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
        style: BASEMAP_STYLE,
        center: [112, -0.5],
        zoom: 4.5,
        minZoom: 3.5,
        maxZoom: 12,
        attributionControl: false,
      })

      map.addControl(new ml.AttributionControl({ compact: true }), 'bottom-left')

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

        // Fill dasar semua provinsi (tipis, warna netral di peta gelap)
        map.addLayer({
          id: FILL_LAYER,
          type: 'fill',
          source: SOURCE_PROVINCES,
          paint: {
            'fill-color': '#a8bfff',
            'fill-opacity': 0.06,
          },
        })

        // Fill hover/aktif (fitur state untuk highlight)
        map.addLayer({
          id: FILL_HOVER_LAYER,
          type: 'fill',
          source: SOURCE_PROVINCES,
          paint: {
            'fill-color': '#d9e1ff',
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.28,
              ['boolean', ['feature-state', 'active'], false],
              0.38,
              0,
            ],
          },
        })

        // Border provinsi
        map.addLayer({
          id: BORDER_LAYER,
          type: 'line',
          source: SOURCE_PROVINCES,
          paint: {
            'line-color': '#a8bfff',
            'line-width': 1.5,
            'line-opacity': 0.55,
          },
        })

        // Interaksi hover dan click pada layer teratas (hover layer menutupi fill dasar)
        map.on('mousemove', FILL_HOVER_LAYER, (e) => {
          if (!map || cameraRef.current.kind !== 'landing') return
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
          if (cameraRef.current.kind !== 'landing') return
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
      if (map) {
        map.remove()
        map = null
      }
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Marker provinsi (hanya di landing), pakai maplibre Marker dengan elemen HTML kustom
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const showMarkers = camera.kind === 'landing'
    const baseScale = isMobile ? 0.82 : 1

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
        // Elemen luar polos: MapLibre mengelola position (absolute lewat class
        // maplibregl-marker) dan style.transform untuk positioning, jadi jangan
        // menimpa keduanya. Hover scale ditaruh di elemen visual di dalamnya.
        el.style.cssText = `
          width: 99px;
          height: 99px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: block;
        `

        const visual = document.createElement('div')
        visual.style.cssText = `
          position: absolute;
          inset: 0;
          transition: transform 0.18s ease-out;
          transform-origin: center center;
          pointer-events: none;
          transform: scale(${baseScale});
        `

        const ring = document.createElement('img')
        ring.src = markerRing
        ring.alt = ''
        ring.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'

        const core = document.createElement('img')
        core.src = markerCore
        core.alt = ''
        core.style.cssText = 'position:absolute;inset:10px;width:79px;height:79px;'

        const label = document.createElement('div')
        label.style.cssText = `
          position:absolute;
          inset:0;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          font-family:var(--font-display);
          font-size:12px;
          line-height:14px;
          color:var(--color-map-label);
          text-align:center;
        `
        const p1 = document.createElement('p')
        p1.textContent = meta.line1
        p1.style.margin = '0'
        label.appendChild(p1)
        if (meta.line2) {
          const p2 = document.createElement('p')
          p2.textContent = meta.line2
          p2.style.margin = '0'
          label.appendChild(p2)
        }

        visual.appendChild(ring)
        visual.appendChild(core)
        visual.appendChild(label)
        el.appendChild(visual)

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

  // Titik api: GeoJSON circle layer
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const showFire = camera.kind === 'province' && mode === 'fire' && camera.slug in provinceFirePoints

    // Bersihkan layer lama
    if (map.getLayer(FIRE_LAYER)) map.removeLayer(FIRE_LAYER)
    if (map.getSource(SOURCE_FIRE)) map.removeSource(SOURCE_FIRE)

    if (!showFire) return

    const slugWeeks = provinceFirePoints[camera.slug]
    const points = slugWeeks?.[weekIndex] ?? slugWeeks?.[DEFAULT_WEEK_INDEX] ?? []

    if (points.length === 0) return

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: points.map(([lng, lat]) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [lng, lat] },
      })),
    }

    map.addSource(SOURCE_FIRE, { type: 'geojson', data: geojson })

    map.addLayer({
      id: FIRE_LAYER,
      type: 'circle',
      source: SOURCE_FIRE,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4, 6,
          8, 14,
          12, 22,
        ],
        'circle-color': '#e30000',
        'circle-opacity': 0.85,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.6,
      },
    })
  }, [isLoaded, camera, mode, weekIndex])

  // Framing kamera mengikuti route
  useEffect(() => {
    const map = mapRef.current
    if (!map || !isLoaded) return

    const padding = getFitPadding(isMobile, camera.kind, viewport)

    // Simpan kamera landing tepat sebelum masuk halaman detail
    const prevCam = prevCameraRef.current
    prevCameraRef.current = camera
    if (prevCam.kind === 'landing' && camera.kind === 'province') {
      try {
        const c = map.getCenter()
        localStorage.setItem(
          LANDING_CAM_KEY,
          JSON.stringify({ center: [c.lng, c.lat], zoom: map.getZoom() }),
        )
      } catch {
        // abaikan kegagalan storage
      }
    }

    if (camera.kind === 'landing') {
      // Saat kembali ke landing, pulihkan kamera tersimpan bila ada
      const saved = prevCam.kind === 'province' ? readLandingCamera() : null
      if (saved) {
        map.easeTo({
          center: saved.center,
          zoom: saved.zoom,
          duration: 750,
          essential: true,
        })
        return
      }
      map.fitBounds(
        [
          [ALL_PROVINCES_BOUNDS[0], ALL_PROVINCES_BOUNDS[1]],
          [ALL_PROVINCES_BOUNDS[2], ALL_PROVINCES_BOUNDS[3]],
        ],
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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 size-full"
      style={{ background: 'var(--color-stage)' }}
    />
  )
}
