import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useNavigate } from 'react-router'
import { provinceMapItems } from '@/data/provinces-map-data'
import { ProvinceMarker } from '@/components/ProvinceMarker'
import mapRaster from '@/assets/map/kalimantan.webp'

interface MapFit {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

// Ruang piksel di dalam wadah yang dikurangi dari area fit (bar atas, UI bawah)
interface FitInsets {
  readonly top?: number
  readonly bottom?: number
  readonly left?: number
  readonly right?: number
}

interface InteractiveMapProps {
  readonly scale?: number
  readonly initialX?: number
  readonly initialY?: number
  readonly center?: { readonly x: number; readonly y: number }
  readonly fillViewport?: boolean
  readonly fit?: MapFit
  readonly fitMode?: 'contain' | 'cover'
  readonly fitInsets?: FitInsets
  readonly markerScale?: number
  readonly showMarkers?: boolean
  readonly activeProvinceSlug?: string
  readonly children?: ReactNode
  readonly className?: string
}

const MAP_WIDTH = 4096
const MAP_HEIGHT = 1365
const DRAG_THRESHOLD = 5

export function InteractiveMap({
  scale = 1,
  initialX = -1328,
  initialY = -61,
  center,
  fillViewport = false,
  fit,
  fitMode = 'contain',
  fitInsets,
  markerScale = 1,
  showMarkers = true,
  activeProvinceSlug,
  children,
  className,
}: InteractiveMapProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  const [viewport, setViewport] = useState({ width: 1440, height: 1024 })
  const [pos, setPos] = useState({ x: initialX, y: initialY })
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [isPointerDown, setIsPointerDown] = useState(false)

  const dragStartRef = useRef<{
    pointerX: number
    pointerY: number
    startX: number
    startY: number
  } | null>(null)
  const hasMovedRef = useRef(false)
  const userHasPannedRef = useRef(false)
  // Hover ditentukan dari elemen yang benar-benar tertimpa kursor, bukan dari kotak
  // bounding SVG provinsi, supaya provinsi yang tumpang tindih tidak salah menyala
  const lastHoveredRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setViewport({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Mode fit: skala dan posisi dihitung dari kotak sasaran supaya selalu terlihat utuh
  const fitPadding = viewport.width < 768 ? 12 : 0
  const insetX = (fitInsets?.left ?? 0) + (fitInsets?.right ?? 0)
  const insetY = (fitInsets?.top ?? 0) + (fitInsets?.bottom ?? 0)
  const fitScaleX = fit ? (viewport.width - fitPadding * 2 - insetX) / fit.width : 0
  const fitScaleY = fit ? (viewport.height - fitPadding * 2 - insetY) / fit.height : 0
  const autoScale = fit
    ? fitMode === 'cover'
      ? Math.max(fitScaleX, fitScaleY)
      : Math.min(fitScaleX, fitScaleY)
    : scale
  const fitAreaX = fitPadding + (fitInsets?.left ?? 0)
  const fitAreaY = fitPadding + (fitInsets?.top ?? 0)
  const fitAreaWidth = viewport.width - fitPadding * 2 - insetX
  const fitAreaHeight = viewport.height - fitPadding * 2 - insetY
  const autoPos = fit
    ? {
        x: fitAreaX + (fitAreaWidth - fit.width * autoScale) / 2 - fit.x * autoScale,
        y: fitAreaY + (fitAreaHeight - fit.height * autoScale) / 2 - fit.y * autoScale,
      }
    : { x: initialX, y: initialY }

  // Skala kamera: scale prop dikali faktor penutup viewport bila fillViewport aktif
  const coverFactor = fillViewport
    ? Math.max(viewport.width / 1440, viewport.height / 1024)
    : 1
  const cameraScale = fit ? autoScale : scale * coverFactor
  const cameraPos = center
    ? {
        x: viewport.width / 2 - center.x * cameraScale,
        y: viewport.height / 2 - center.y * cameraScale,
      }
    : { x: initialX * coverFactor, y: initialY * coverFactor }

  const activeScale = fit ? autoScale : cameraScale
  const activePos =
    (fit || center || fillViewport) && !userHasPannedRef.current
      ? fit
        ? autoPos
        : cameraPos
      : pos

  // Terapkan posisi awal ulang saat viewport berubah (misal rotasi HP), jika user belum menggeser manual
  useEffect(() => {
    if (userHasPannedRef.current) return
    if (fit) {
      setPos(autoPos)
    } else if (center || fillViewport) {
      setPos(cameraPos)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPos.x, autoPos.y, cameraPos.x, cameraPos.y, fit, center, fillViewport])

  const scaledWidth = MAP_WIDTH * activeScale
  const scaledHeight = MAP_HEIGHT * activeScale
  const minX = Math.min(0, viewport.width - scaledWidth)
  const maxX = 0
  const minY = Math.min(0, viewport.height - scaledHeight)
  const maxY = 0

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val))

  // Hover dari elemen yang tertimpa kursor. Kalau bukan elemen peta (UI overlay,
  // di luar wadah, atau antar-elemen saat gerak cepat), hover lama dipertahankan.
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
      startX: activePos.x,
      startY: activePos.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') {
      const slug = resolveHoveredSlug(e.clientX, e.clientY)
      if (slug !== lastHoveredRef.current) {
        lastHoveredRef.current = slug
        setHoveredSlug(slug)
      }
    }

    if (!dragStartRef.current) return

    const dx = e.clientX - dragStartRef.current.pointerX
    const dy = e.clientY - dragStartRef.current.pointerY

    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      hasMovedRef.current = true
      userHasPannedRef.current = true
    }

    if (!hasMovedRef.current) return

    const nextX = clamp(dragStartRef.current.startX + dx, minX, maxX)
    const nextY = clamp(dragStartRef.current.startY + dy, minY, maxY)
    setPos({ x: nextX, y: nextY })
  }

  const handlePointerLeave = () => {
    lastHoveredRef.current = null
    setHoveredSlug(null)
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartRef.current = null
    setIsPointerDown(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handleProvinceSelect = (slug: string) => {
    if (hasMovedRef.current) return
    navigate(`/provinsi/${slug}`)
  }

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
      } ${className ?? ''}`}
      style={{ touchAction: 'none' }}
    >
      {/* Peta Kalimantan dan layer elemen yang ikut bergerak saat di-pan */}
      <div
        style={{
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          transform: `translate3d(${activePos.x}px, ${activePos.y}px, 0) scale(${activeScale})`,
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

        {/* Lapisan SVG provinsi interaktif */}
        {provinceMapItems.map((item) => {
          const isHovered =
            hoveredSlug === item.slug || activeProvinceSlug === item.slug

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
                onClick={(e) => {
                  e.stopPropagation()
                  handleProvinceSelect(item.slug)
                }}
              />
            </svg>
          )
        })}

        {/* Lapisan kustom tambahan (misalnya titik api di halaman provinsi) */}
        {children}

        {/* Tombol marker provinsi */}
        {showMarkers &&
          provinceMapItems.map((item) => (
            <div
              key={item.slug}
              style={{
                position: 'absolute',
                left: item.markerX - (99 * markerScale - 99) / 2,
                top: item.markerY - (99 * markerScale - 99) / 2,
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
      </div>
    </div>
  )
}
