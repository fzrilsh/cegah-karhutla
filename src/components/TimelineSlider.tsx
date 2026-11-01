import { useRef, useState, useLayoutEffect, type PointerEvent as ReactPointerEvent } from 'react'
import { m, useMotionValue, useSpring } from 'motion/react'
import knobImg from '@/assets/slider/knob.svg'
import type { WeeklyMetric } from '@/data/kalbar-weekly-metrics'

interface TimelineSliderProps {
  readonly metrics: readonly WeeklyMetric[]
  readonly activeIndex: number
  readonly onChange: (index: number) => void
  readonly className?: string
  readonly compact?: boolean
}

const STEP_COUNT = 7
const TOTAL_TICKS = 91

// Geometri mengikuti lebar wadah supaya fluid di semua ukuran layar
function trackGeometry(width: number, compact: boolean) {
  const margin = compact
    ? Math.max(20, width * 0.07)
    : Math.max(30, width * 0.05299) // 71/1340
  const start = margin
  const end = width - margin * (compact ? 1 : 0.55) // ruang untuk knob kanan
  return { start, end }
}

export function TimelineSlider({
  metrics,
  activeIndex,
  onChange,
  className,
  compact = false,
}: TimelineSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1340)
  const [isDragging, setIsDragging] = useState(false)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { start, end } = trackGeometry(width, compact)

  const knobSize = compact
    ? Math.min(48, Math.max(36, width * 0.11))
    : Math.min(60, Math.max(44, width * 0.0448))
  const knobRadius = knobSize / 2

  const trackY = compact ? 38 : 50
  const labelsY = compact ? 74 : 96

  // Track disisihkan sebesar radius knob dari tepi kartu supaya knob tidak keluar kartu
  const trackStart = start + (compact ? knobRadius * 0.6 : 0)
  const trackEnd = end - (compact ? knobRadius * 0.6 : 0)
  const trackStep = (trackEnd - trackStart) / (STEP_COUNT - 1)

  // Posisi knob dalam piksel, dikontrol langsung saat drag dan di-snap lewat spring saat lepas
  const knobX = useMotionValue(trackStart + activeIndex * trackStep)
  const knobSpring = useSpring(knobX, { stiffness: 400, damping: 38, mass: 0.7 })

  // Sinkronkan posisi knob saat index berubah dari luar (bukan saat drag)
  useLayoutEffect(() => {
    if (!isDragging) {
      knobX.set(trackStart + activeIndex * trackStep)
    }
  }, [activeIndex, isDragging, trackStart, trackStep, knobX])

  const activeCenter = trackStart + activeIndex * trackStep

  const positionToIndex = (x: number): number => {
    const rawIndex = Math.round((x - trackStart) / trackStep)
    return Math.max(0, Math.min(STEP_COUNT - 1, rawIndex))
  }

  const pointerToTrackX = (clientX: number): number => {
    if (!containerRef.current) return trackStart
    const rect = containerRef.current.getBoundingClientRect()
    return Math.max(trackStart, Math.min(trackEnd, clientX - rect.left))
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    setIsDragging(true)
    knobX.stop()
    const trackX = pointerToTrackX(e.clientX)
    knobX.set(trackX)
    onChange(positionToIndex(trackX))
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const trackX = pointerToTrackX(e.clientX)
    knobX.set(trackX)
    const newIndex = positionToIndex(trackX)
    if (newIndex !== activeIndex) {
      onChange(newIndex)
    }
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    knobX.set(trackStart + positionToIndex(knobX.get()) * trackStep)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full select-none rounded-[10px] border border-navy-700 bg-paper shadow-glow cursor-pointer ${
        compact ? 'h-[108px]' : 'h-[140px]'
      } ${className ?? ''}`}
      style={{ touchAction: 'none' }}
    >
      {/* Main Track Line (2px Navy-700) */}
      <div
        style={{ left: trackStart, width: trackEnd - trackStart, top: trackY }}
        className="absolute h-[2px] bg-navy-700 pointer-events-none"
      />

      {/* 91 Dynamic Tick Lines */}
      <div
        style={{ left: trackStart, width: trackEnd - trackStart, top: trackY }}
        className="absolute h-[40px] pointer-events-none"
      >
        {Array.from({ length: TOTAL_TICKS }).map((_, idx) => {
          const tickX = (idx / (TOTAL_TICKS - 1)) * (trackEnd - trackStart)
          const distToKnob = Math.abs(tickX + trackStart - activeCenter)
          // Tick yang dekat dengan knob memanjang ke bawah, sisanya pendek
          const isNear = distToKnob < (trackEnd - trackStart) * 0.055
          const height = isNear ? 32 : 16

          return (
            <div
              key={idx}
              style={{
                left: `${tickX}px`,
                height: `${height}px`,
              }}
              className={`absolute top-0 w-[2px] transition-all duration-150 ${
                isNear ? 'bg-navy-700' : 'bg-navy-700/40'
              }`}
            />
          )
        })}
      </div>

      {/* Interactive Slider Knob */}
      <m.div
        style={{
          width: knobSize,
          height: knobSize,
          top: compact ? trackY - knobSize / 2 + 1 : '20px',
          x: knobSpring,
          left: -knobSize / 2,
        }}
        className="pointer-events-none absolute z-10 flex items-center justify-center"
      >
        <img src={knobImg} alt="" className="size-full" />
      </m.div>

      {/* Date Labels */}
      <div
        style={{ top: labelsY }}
        className="absolute left-0 w-full pointer-events-none"
      >
        {metrics.map((mItem, idx) => {
          const center = trackStart + idx * trackStep
          const isActive = idx === activeIndex
          // Di compact, label non-aktif disembunyikan bila terlalu rapat supaya tidak bertumpuk
          const hideInCompact =
            compact && !isActive && trackStep < 64 && idx !== 0 && idx !== metrics.length - 1
          if (hideInCompact) return null

          // Label tepi dikunci ke dalam kartu supaya tidak terpotong
          const anchor =
            compact && idx === 0 ? 'left' : compact && idx === metrics.length - 1 ? 'right' : 'center'

          return (
            <div
              key={mItem.dateIso}
              style={{
                left: `${center}px`,
                transform:
                  anchor === 'left'
                    ? 'translateX(-6px)'
                    : anchor === 'right'
                      ? 'translateX(calc(-100% + 6px))'
                      : 'translateX(-50%)',
              }}
              className="absolute flex items-center justify-center"
            >
              <span
                className={`font-display whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? `${compact ? 'text-[13px]' : 'text-[16.3px]'} font-bold text-navy-700`
                    : `${compact ? 'text-[10px]' : 'text-[12px]'} text-navy-700/70 hover:text-navy-700`
                }`}
              >
                {mItem.dateShort}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
