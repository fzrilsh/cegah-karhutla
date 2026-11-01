import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'

interface BottomSheetProps {
  readonly collapsedHeight: number
  readonly maxRatio?: number
  readonly className?: string
  readonly children: ReactNode
}

// Lembar bawah dengan handle yang bisa ditarik untuk membuka dan menutup konten
export function BottomSheet({
  collapsedHeight,
  maxRatio = 0.85,
  className,
  children,
}: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const [dragHeight, setDragHeight] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(
    () => (typeof window !== 'undefined' ? window.innerHeight : 1024),
  )

  const dragRef = useRef<{
    startY: number
    startHeight: number
    maxHeight: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const maxHeight = viewportHeight * maxRatio
  const sheetHeight = dragHeight ?? (expanded ? maxHeight : collapsedHeight)

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { startY: e.clientY, startHeight: sheetHeight, maxHeight, moved: false }
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const delta = drag.startY - e.clientY
    if (Math.abs(delta) > 4) drag.moved = true
    const next = Math.max(collapsedHeight, Math.min(drag.maxHeight, drag.startHeight + delta))
    setDragHeight(next)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    setIsDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (!drag) return

    if (!drag.moved) {
      setExpanded((v) => !v)
      setDragHeight(null)
      return
    }
    const midpoint = (collapsedHeight + drag.maxHeight) / 2
    setExpanded(sheetHeight >= midpoint)
    setDragHeight(null)
  }

  return (
    <div
      style={{ height: sheetHeight, transition: isDragging ? 'none' : 'height 0.25s ease-out' }}
      className={`absolute inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[16px] border-t border-navy-700 bg-navy-800/97 shadow-glow backdrop-blur-md ${
        className ?? ''
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={expanded ? 'Tutup panel informasi' : 'Buka panel informasi'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded((v) => !v)
          }
        }}
        className="flex h-[28px] shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <span className="h-[4px] w-[44px] rounded-full bg-paper/40" />
      </div>
      <div className="flex-1 overflow-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  )
}
