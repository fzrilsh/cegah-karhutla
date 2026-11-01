import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { m, useMotionValue, useSpring } from 'motion/react'
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

// Peta bersama yang tidak ikut unmount saat pindah route supaya kamera bergerak smooth
export function SharedMap({ isMobile, activeProvinceSlug, mode = 'fire', weekIndex = DEFAULT_WEEK_INDEX }: SharedMapProps) {
  const { camera, enterProvince } = useMapTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 1440, height: 1024 })
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const lastHoveredRef = useRef<string | null>(null)

  // Posisi dan skala peta dalam piksel layar
  const posX = useMotionValue(-1328)
  const posY = useMotionValue(-61)
  const scaleMV = useMotionValue(1)
  const posXSpring = useSpring(posX, { stiffness: 55, damping: 18, mass: 1 })
  const posYSpring = useSpring(posY, { stiffness: 55, damping: 18, mass: 1 })
  const scaleSpring = useSpring(scaleMV, { stiffness: 55, damping: 18, mass: 1 })

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
    const cx = centerX ?? viewport.width / 2
    const cy = centerY ?? viewport.height / 2
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
        }
      }
      const cover = Math.max(viewport.width / 1440, viewport.height / 1024)
      return { scale: cover, cx: 1328 + 720, cy: 61 + 512 }
    }
    const frame =
      (camera.kind === 'province' && PROVINCE_FRAME[camera.slug]) || PROVINCE_FRAME['kalimantan-barat']
    const { top, bottom } = getProvinceFitInsets(isMobile)
    const padding = isMobile ? 12 : 0
    const areaW = viewport.width - padding * 2
    const areaH = viewport.height - padding * 2 - top - bottom
    const s = Math.min(areaW / frame.width, areaH / frame.height)
    return { scale: s, cx: frame.x + frame.width / 2, cy: frame.y + frame.height / 2 }
  })()

  // Transform kamera target = framing dasar dikali zoom, dipusatkan ke kotak peta
  const targetTransform = (() => {
    const scale = baseFrame.scale * zoomRef.current
    return {
      scale,
      x: viewport.width / 2 - baseFrame.cx * scale,
      y: viewport.height / 2 - baseFrame.cy * scale,
    }
  })()

  // Terapkan kamera target saat route, ukuran viewport, atau zoom berubah.
  const camKey = camera.kind === 'province' ? `province:${camera.slug}` : 'landing'
  useEffect(() => {
    userHasPannedRef.current = false
    zoomRef.current = 1
    posX.set(targetTransform.x)
    posY.set(targetTransform.y)
    scaleMV.set(targetTransform.scale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camKey, viewport.width, viewport.height, isMobile])

  // Marker mengecil di HP
  const markerScale = isMobile ? 0.82 : 1

  const showMarkers = camera.kind === 'landing'

  // Titik api hanya di halaman Kalimantan Barat
  const showFire =
    camera.kind === 'province' && camera.slug === 'kalimantan-barat' && mode === 'fire'

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  const resolveHoveredSlug = (clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return lastHoveredRef.current
    const stack = document.elementsFromPoint(clientX, clientY)
    for (const el of stack) {
      if (!(el instanceof Element)) continue
      if (el instanceof SVGElement && el.dataset.province) return el.dataset.province
      if (el === container) return null
      if (!container.contains(el)) return lastHoveredRef.current
      if (el instanceof HTMLElement) return lastHoveredRef.current
    }
    return lastHoveredRef.current
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
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
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
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
        isPointerDown ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ touchAction: 'none' }}
    >
      <m.div
        style={{
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          x: posXSpring,
          y: posYSpring,
          scale: scaleSpring,
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
