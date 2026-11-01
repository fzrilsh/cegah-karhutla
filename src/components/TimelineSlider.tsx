import { useRef, useState, useLayoutEffect, type PointerEvent as ReactPointerEvent } from 'react'
import { m, useMotionValue, useSpring } from 'motion/react'
import knobImg from '@/assets/slider/knob.svg'
import type { WeeklyMetric } from '@/data/kalbar-weekly-metrics'

interface TimelineSliderProps {
  readonly metrics: readonly WeeklyMetric[]
  readonly activeIndex: number
  readonly onChange: (index: number) => void
  readonly className?: string
}

const STEP_COUNT = 7
const TOTAL_TICKS = 91

// Geometri mengikuti lebar wadah supaya fluid di semua ukuran layar
function trackGeometry(width: number) {
  const margin = Math.max(30, width * 0.05299) // 71/1340
  const start = margin
  const end = width - margin * 0.55 // ruang untuk knob kanan
  const step = (end - start) / (STEP_COUNT - 1)
  return { start, end, step }
}

export function TimelineSlider({
  metrics,
  activeIndex,
  onChange,
  className,
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

  const { start, end, step } = trackGeometry(width)

  // Posisi knob dalam piksel, dikontrol langsung saat drag dan di-snap lewat spring saat lepas
  const knobX = useMotionValue(start + activeIndex * step)
  const knobSpring = useSpring(knobX, { stiffness: 400, damping: 38, mass: 0.7 })

  // Sinkronkan posisi knob saat index berubah dari luar (bukan saat drag)
  useLayoutEffect(() => {
    if (!isDragging) {
      knobX.set(start + activeIndex * step)
    }
  }, [activeIndex, isDragging, start, step, knobX])

  const activeCenter = start + activeIndex * step

  const positionToIndex = (x: number): number => {
    const rawIndex = Math.round((x - start) / step)
    return Math.max(0, Math.min(STEP_COUNT - 1, rawIndex))
  }

  const pointerToTrackX = (clientX: number): number => {
    if (!containerRef.current) return start
    const rect = containerRef.current.getBoundingClientRect()
    return Math.max(start, Math.min(end, clientX - rect.left))
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
    knobX.set(start + positionToIndex(knobX.get()) * step)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const knobSize = Math.min(60, Math.max(44, width * 0.0448))

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative h-[140px] w-full select-none rounded-[10px] border border-navy-700 bg-paper shadow-glow cursor-pointer ${
        className ?? ''
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Main Track Line (2px Navy-700) */}
      <div
        style={{ left: start, width: end - start }}
        className="absolute top-[50px] h-[2px] bg-navy-700 pointer-events-none"
      />

      {/* 91 Dynamic Tick Lines */}
      <div
        style={{ left: start, width: end - start }}
        className="absolute top-[50px] h-[40px] pointer-events-none"
      >
        {Array.from({ length: TOTAL_TICKS }).map((_, idx) => {
          const tickX = (idx / (TOTAL_TICKS - 1)) * (end - start)
          const distToKnob = Math.abs(tickX + start - activeCenter)
          // Tick yang dekat dengan knob memanjang ke bawah, sisanya pendek
          const isNear = distToKnob < (end - start) * 0.055
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
          top: '20px',
          x: knobSpring,
          left: -knobSize / 2,
        }}
        className="pointer-events-none absolute z-10 flex items-center justify-center"
      >
        <img src={knobImg} alt="" className="size-full" />
      </m.div>

      {/* Date Labels */}
      <div className="absolute left-0 top-[96px] w-full pointer-events-none">
        {metrics.map((mItem, idx) => {
          const center = start + idx * step
          const isActive = idx === activeIndex

          return (
            <div
              key={mItem.dateIso}
              style={{
                left: `${center}px`,
                transform: 'translateX(-50%)',
              }}
              className="absolute flex items-center justify-center"
            >
              <span
                className={`font-display whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'text-[16.3px] font-bold text-navy-700'
                    : 'text-[12px] text-navy-700/70 hover:text-navy-700'
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
