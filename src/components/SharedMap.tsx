import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { m, animate, useMotionValue } from 'motion/react'
import { provinceMapItems } from '@/data/provinces-map-data'
import { ProvinceMarker } from '@/components/ProvinceMarker'
import { FireLayer } from '@/components/FireLayer'
import { useMapTransition } from '@/lib/map-transition'
import mapRaster from '@/assets/map/kalimantan.webp'

const MAP_WIDTH = 4096
const MAP_HEIGHT = 1365
const DRAG_THRESHOLD = 5

// Kotak kelima provinsi di ruang peta 4096x1365
const ALL_PROVINCES_FIT = { x: 1674, y: 430, width: 494, height: 551 }

// Titik api minggu aktif, diisi dari halaman provinsi
import { kalbarFirePoints } from '@/data/kalbar-fire-points'
import { DEFAULT_WEEK_INDEX } from '@/data/kalbar-weekly-metrics'

interface SharedMapProps {
  readonly isMobile: boolean
  readonly activeProvinceSlug?: string
  readonly mode?: 'fire' | 'smoke'
  readonly weekIndex?: number
}

function getLandingFitInsets(isMobile: boolean) {
  return isMobile ? { top: 128, bottom: 76 } : { top: 0, bottom: 0 }
}

function getProvinceFitInsets(isMobile: boolean) {
  return isMobile ? { top: 128, bottom: 210 } : { top: 0, bottom: 0 }
}

// Framing per provinsi dari bounding box (Figma hanya memuat framing Kalbar di 102:565)
const PROVINCE_FRAME: Record<string, { x: number; y: number; width: number; height: number }> = {
  'kalimantan-barat': { x: 1674, y: 580, width: 346, height: 331 },
  'kalimantan-tengah': { x: 1800, y: 662, width: 323, height: 279 },
  'kalimantan-selatan': { x: 2020, y: 793, width: 146, height: 186 },
  'kalimantan-timur': { x: 1995, y: 550, width: 325, height: 321 },
  'kalimantan-utara': { x: 2037, y: 430, width: 224, height: 218 },
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4

// Posisi peta landing disimpan di localStorage supaya kembali ke tempat semula
// setelah keluar dari halaman detail
const LANDING_CAM_KEY = 'ck-landing-camera'

interface SavedCamera {
  readonly x: number
  readonly y: number
  readonly scale: number
}

function readLandingCamera(): SavedCamera | null {
  try {
    const raw = localStorage.getItem(LANDING_CAM_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedCamera>
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number' || typeof parsed.scale !== 'number') return null
    return { x: parsed.x, y: parsed.y, scale: parsed.scale }
  } catch {
    return null
  }
}

// Peta bersama yang tidak ikut unmount saat pindah route supaya kamera bergerak smooth
export function SharedMap({ isMobile, activeProvinceSlug, mode = 'fire', weekIndex = DEFAULT_WEEK_INDEX }: SharedMapProps) {
  const { camera, enterProvince } = useMapTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 1440, height: 1024 })
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const lastHoveredRef = useRef<string | null>(null)

  // Posisi dan skala peta dalam piksel layar. Transisi route memakai animate(),
  // sedangkan drag menulis langsung tanpa spring supaya berhenti tepat saat dilepas.
  const posX = useMotionValue(-1328)
  const posY = useMotionValue(-61)
  const scaleMV = useMotionValue(1)

  const [isPointerDown, setIsPointerDown] = useState(false)
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null)
  const hasMovedRef = useRef(false)
  const userHasPannedRef = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setViewport({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Faktor zoom pengguna (pinch / keyboard), terpisah dari framing route
  const zoomRef = useRef(1)

  const applyZoom = (factor: number, centerX?: number, centerY?: number) => {
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current * factor))
    if (next === zoomRef.current) return
    const cx = centerX ?? baseFrame.ox
    const cy = centerY ?? baseFrame.oy
    const oldScale = baseFrame.scale * zoomRef.current
    const newScale = baseFrame.scale * next
    // Pertahankan titik peta di bawah kursor saat zoom
    const mapX = (cx - posX.get()) / oldScale
    const mapY = (cy - posY.get()) / oldScale
    zoomRef.current = next
    posX.set(cx - mapX * newScale)
    posY.set(cy - mapY * newScale)
    scaleMV.set(newScale)
  }

  // Hitung framing dasar (skala + pusat kotak peta) dari state route, tanpa zoom
  const baseFrame = (() => {
    if (camera.kind === 'landing') {
      const { top, bottom } = getLandingFitInsets(isMobile)
      const padding = isMobile ? 12 : 0
      const areaW = viewport.width - padding * 2
      const areaH = viewport.height - padding * 2 - top - bottom
      if (isMobile) {
        const s = Math.min(areaW / ALL_PROVINCES_FIT.width, areaH / ALL_PROVINCES_FIT.height)
        return {
          scale: s,
          cx: ALL_PROVINCES_FIT.x + ALL_PROVINCES_FIT.width / 2,
          cy: ALL_PROVINCES_FIT.y + ALL_PROVINCES_FIT.height / 2,
          ox: padding + areaW / 2,
          oy: padding + top + areaH / 2,
        }
      }
      const cover = Math.max(viewport.width / 1440, viewport.height / 1024)
      return {
        scale: cover,
        cx: 1328 + 720,
        cy: 61 + 512,
        ox: viewport.width / 2,
        oy: viewport.height / 2,
      }
    }
    const frame =
      (camera.kind === 'province' && PROVINCE_FRAME[camera.slug]) || PROVINCE_FRAME['kalimantan-barat']
    // Area bebas overlay: bar atas, kartu kanan, dan slider bawah (desktop);
    // bar atas + toggle dan bottom sheet (mobile)
    let freeX: number
    let freeY: number
    let freeW: number
    let freeH: number
    if (isMobile) {
      const padding = 12
      const { top, bottom } = getProvinceFitInsets(isMobile)
      freeX = padding
      freeY = padding + top
      freeW = viewport.width - padding * 2
      freeH = viewport.height - padding * 2 - top - bottom
    } else {
      const ui = Math.min(1.5, Math.max(0.6, viewport.width / 1440))
      const marginX = Math.max(16, 0.0347 * viewport.width)
      const marginTop = Math.max(12, 0.0488 * viewport.height)
      const left = marginX + 60 * ui + 24
      const right = marginX + 434 * ui + 24
      const top = marginTop + 60 * ui + 16
      const bottom = 140 + marginTop + 16
      freeX = left
      freeY = top
      freeW = viewport.width - left - right
      freeH = viewport.height - top - bottom
    }
    // Skala zoom memperhitungkan luas provinsi: sFit mengisi area bebas, sCap membatasi
    // provinsi kecil agar tidak terlalu ngezoom, FIT_MARGIN memberi ruang napas.
    const FIT_MARGIN = 0.85
    const diagRef = 380 // diagonal Kalbar (referensi framing Figma 102:565)
    const sFit = Math.min(freeW / frame.width, freeH / frame.height)
    const diag = Math.hypot(frame.width, frame.height)
    const sCap = (freeW / diagRef) * Math.min(1, diag / diagRef)
    const s = Math.min(sFit, sCap) * FIT_MARGIN
    return {
      scale: s,
      cx: frame.x + frame.width / 2,
      cy: frame.y + frame.height / 2,
      ox: freeX + freeW / 2,
      oy: freeY + freeH / 2,
    }
  })()

  // Transform kamera target = framing dasar dikali zoom, dipusatkan ke tengah area bebas
  const targetTransform = (() => {
    const scale = baseFrame.scale * zoomRef.current
    return {
      scale,
      x: baseFrame.ox - baseFrame.cx * scale,
      y: baseFrame.oy - baseFrame.cy * scale,
    }
  })()

  // Transisi kamera smooth saat route atau ukuran viewport berubah. Ketiga properti
  // (x, y, scale) dianimasikan dari satu progres 0 sampai 1 dan diinterpolasi bersama
  // supaya selalu konsisten (x = ox - cx*scale) dan tidak ada getaran di akhir akibat
  // spring independen yang selesai pada waktu berbeda.
  const camKey = camera.kind === 'province' ? `province:${camera.slug}` : 'landing'
  const prevCamKeyRef = useRef(camKey)
  useEffect(() => {
    const prevCamKey = prevCamKeyRef.current
    prevCamKeyRef.current = camKey
    userHasPannedRef.current = false

    // Simpan kamera landing tepat sebelum masuk halaman detail
    if (prevCamKey === 'landing' && camera.kind === 'province') {
      try {
        const saved: SavedCamera = { x: posX.get(), y: posY.get(), scale: scaleMV.get() }
        localStorage.setItem(LANDING_CAM_KEY, JSON.stringify(saved))
      } catch {
        // abaikan kegagalan storage
      }
    }

    // Saat kembali ke landing, pulihkan kamera tersimpan bila ada
    const savedLanding = camera.kind === 'landing' && prevCamKey !== 'landing' ? readLandingCamera() : null
    zoomRef.current = camera.kind === 'landing' && savedLanding ? savedLanding.scale / baseFrame.scale : 1

    const from = { x: posX.get(), y: posY.get(), s: scaleMV.get() }
    const to = savedLanding
      ? { x: savedLanding.x, y: savedLanding.y, s: savedLanding.scale }
      : { x: targetTransform.x, y: targetTransform.y, s: targetTransform.scale }
    const controls = animate(0, 1, {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        posX.set(from.x + (to.x - from.x) * t)
        posY.set(from.y + (to.y - from.y) * t)
        scaleMV.set(from.s + (to.s - from.s) * t)
      },
    })
    return () => {
      controls.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camKey, viewport.width, viewport.height, isMobile])

  // Marker mengecil di HP
  const markerScale = isMobile ? 0.82 : 1

  const showMarkers = camera.kind === 'landing'

  // Titik api hanya di halaman Kalimantan Barat
  const showFire =
    camera.kind === 'province' && camera.slug === 'kalimantan-barat' && mode === 'fire'

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  // Collision akurat: konversi titik kursor ke koordinat peta, lalu uji isPointInFill
  // pada tiap path sehingga hanya bentuk yang benar-benar berisi titik yang menyala
  // (bukan sekadar tumpang tindih kotak bounding SVG).
  const svgPointRef = useRef<DOMPoint | null>(null)
  const resolveHoveredSlug = (clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return lastHoveredRef.current
    const rect = container.getBoundingClientRect()
    // Kalau kursor di atas UI overlay (bukan dasar peta), pertahankan hover lama
    const top = document.elementFromPoint(clientX, clientY)
    if (top && top instanceof HTMLElement && container.contains(top) && top !== container) {
      return lastHoveredRef.current
    }
    if (!svgPointRef.current) {
      const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svgPointRef.current = tmp.createSVGPoint()
    }
    const pt = svgPointRef.current
    const s = scaleMV.get()
    const mapX = (clientX - rect.left - posX.get()) / s
    const mapY = (clientY - rect.top - posY.get()) / s
    const paths = container.querySelectorAll<SVGPathElement>('path[data-province]')
    for (const path of paths) {
      const svg = path.ownerSVGElement
      if (!svg) continue
      // viewBox svg identik dengan ukuran penempatannya di ruang peta (skala 1:1),
      // jadi koordinat viewBox = koordinat peta dikurangi offset left/top svg
      pt.x = mapX - parseFloat(svg.style.left || '0')
      pt.y = mapY - parseFloat(svg.style.top || '0')
      if (pt.x >= 0 && pt.y >= 0 && path.isPointInFill(pt)) {
        return path.dataset.province ?? null
      }
    }
    return null
  }

  // Pan hanya di landing; di halaman detail peta terkunci pada framing provinsi
  const canPan = camera.kind === 'landing'

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    if (!canPan) return
    // Hentikan animasi transisi route yang masih berjalan supaya drag tidak ditimpa
    posX.stop()
    posY.stop()
    scaleMV.stop()
    setIsPointerDown(true)
    hasMovedRef.current = false
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: posX.get(),
      startY: posY.get(),
    }
    // Tidak memakai setPointerCapture supaya click tetap sampai ke path provinsi saat bukan drag
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    // Hover provinsi hanya aktif di landing; di halaman detail fokus tetap di provinsi aktif
    if (camera.kind !== 'landing') return
    const slug = resolveHoveredSlug(e.clientX, e.clientY)
    if (slug !== lastHoveredRef.current) {
      lastHoveredRef.current = slug
      setHoveredSlug(slug)
    }
  }

  const handlePointerUp = () => {
    dragStartRef.current = null
    setIsPointerDown(false)
  }

  // Saat drag berlangsung, dengarkan gerakan pointer di window supaya tetap terlacak
  // meski kursor keluar dari wadah peta (tanpa setPointerCapture).
  useEffect(() => {
    if (!isPointerDown) return
    const onMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return
      const dx = e.clientX - dragStartRef.current.pointerX
      const dy = e.clientY - dragStartRef.current.pointerY
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        hasMovedRef.current = true
        userHasPannedRef.current = true
      }
      if (!hasMovedRef.current) return
      const s = scaleMV.get()
      const w = MAP_WIDTH * s
      const h = MAP_HEIGHT * s
      posX.set(clamp(dragStartRef.current.startX + dx, Math.min(0, viewport.width - w), 0))
      posY.set(clamp(dragStartRef.current.startY + dy, Math.min(0, viewport.height - h), 0))
    }
    const onUp = () => {
      dragStartRef.current = null
      setIsPointerDown(false)
      // Drag menulis langsung ke motion value tanpa spring, jadi peta berhenti tepat
      // saat dilepas. hasMovedRef tidak di-reset di sini supaya click tepat setelah
      // drag tidak ikut memicu select; di-reset pada pointerdown berikutnya.
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    // Lepas drag juga saat window kehilangan fokus (misal Alt+Tab di tengah drag)
    window.addEventListener('blur', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPointerDown, viewport.width, viewport.height])

  const handlePointerLeave = () => {
    lastHoveredRef.current = null
    setHoveredSlug(null)
  }

  const lastSelectRef = useRef(0)
  const handleProvinceSelect = (slug: string) => {
    if (hasMovedRef.current) return
    // Hindari pemicu ganda dari pointerup + click pada gestur yang sama
    const now = performance.now()
    if (now - lastSelectRef.current < 400) return
    lastSelectRef.current = now
    enterProvince(slug)
  }

  // Pinch di trackpad (ctrl+wheel) dan Cmd +/- men-zoom peta, bukan halaman
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        applyZoom(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        applyZoom(1.25)
      } else if (e.key === '-') {
        e.preventDefault()
        applyZoom(1 / 1.25)
      } else if (e.key === '0') {
        e.preventDefault()
        applyZoom(1 / zoomRef.current)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.width, viewport.height, baseFrame.scale])

  const firePoints = kalbarFirePoints[weekIndex] ?? kalbarFirePoints[DEFAULT_WEEK_INDEX]

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`absolute inset-0 size-full overflow-hidden select-none ${
        canPan ? (isPointerDown ? 'cursor-grabbing' : 'cursor-grab') : ''
      }`}
      style={{ touchAction: 'none' }}
    >
      <m.div
        style={{
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          x: posX,
          y: posY,
          scale: scaleMV,
          transformOrigin: 'top left',
        }}
        className="relative"
      >
        <img
          src={mapRaster}
          alt="Peta Kalimantan"
          draggable={false}
          className="pointer-events-none absolute left-0 top-0 size-full max-w-none"
        />

        {provinceMapItems.map((item) => {
          const isHovered = hoveredSlug === item.slug || activeProvinceSlug === item.slug
          return (
            <svg
              key={item.slug}
              viewBox={item.viewBox}
              className="overflow-visible"
              style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
                pointerEvents: 'none',
              }}
            >
              <path
                d={item.pathData}
                fill={isHovered ? '#d9e1ff' : 'none'}
                fillOpacity={isHovered ? 0.3 : 0}
                stroke="#8aa3d0"
                strokeWidth={2}
                data-province={item.slug}
                className="cursor-pointer transition-colors duration-150"
                style={{ pointerEvents: 'visiblePainted' }}
                onPointerUp={(e) => {
                  // Container menangkap pointer saat down, jadi andalkan pointerup di path
                  e.stopPropagation()
                  handleProvinceSelect(item.slug)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleProvinceSelect(item.slug)
                }}
              />
            </svg>
          )
        })}

        {showFire && <FireLayer points={firePoints} />}

        {showMarkers &&
          provinceMapItems.map((item) => (
            <div
              key={item.slug}
              style={{
                position: 'absolute',
                left: item.markerX,
                top: item.markerY,
                width: 99,
                height: 99,
                transform: `scale(${markerScale})`,
                transformOrigin: 'center center',
              }}
            >
              <ProvinceMarker
                item={item}
                isHovered={hoveredSlug === item.slug}
                onHover={setHoveredSlug}
                onSelect={handleProvinceSelect}
              />
            </div>
          ))}
      </m.div>
    </div>
  )
}
