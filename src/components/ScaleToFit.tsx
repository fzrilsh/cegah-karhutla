import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ScaleToFitProps {
  readonly designWidth: number
  readonly designHeight: number
  readonly className?: string
  readonly children: ReactNode
}

// Menskalakan konten berukuran tetap (piksel Figma) agar muat selebar wadahnya
export function ScaleToFit({
  designWidth,
  designHeight,
  className,
  children,
}: ScaleToFitProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(designWidth)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const factor = width / designWidth

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: designHeight * factor }}
    >
      <div
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${factor})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}
