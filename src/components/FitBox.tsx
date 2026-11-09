import { useEffect, useRef, useState, type ReactNode } from 'react'

// Konten digambar ukuran desain (px) lalu diskalakan mengikuti kotak kontainer, mana pun
// yang lebih sempit (lebar atau tinggi). Anchor menentukan sisi yang menempel margin.
export function FitBox({
  width,
  height,
  align = 'left',
  valign = 'top',
  className,
  children,
}: {
  readonly width: number
  readonly height: number
  readonly align?: 'left' | 'right'
  readonly valign?: 'top' | 'bottom'
  readonly className?: string
  readonly children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      setScale(Math.min(w / width, h / height))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [width, height])

  const horizontal = align === 'right' ? 'right' : 'left'
  const vertical = valign === 'bottom' ? 'bottom' : 'top'

  return (
    <div
      ref={ref}
      className={className}
      style={{ position: 'relative', overflow: 'hidden', aspectRatio: `${width} / ${height}`, maxHeight: '100%' }}
    >
      <div
        style={{
          position: 'absolute',
          [horizontal]: 0,
          [vertical]: 0,
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: `${vertical} ${horizontal}`,
        }}
      >
        {children}
      </div>
    </div>
  )
}