import type { ReactNode } from 'react'

interface ScaledProps {
  readonly scale: number
  readonly width: number
  readonly height: number
  readonly className?: string
  readonly children: ReactNode
}

// Membungkus komponen berukuran Figma agar ikut mengecil tanpa mengubah layoutnya
export function Scaled({ scale, width, height, className, children }: ScaledProps) {
  return (
    <div style={{ width: width * scale, height: height * scale, flex: 'none' }} className={className}>
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}