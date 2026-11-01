import { useMemo } from 'react'
import type { FirePoint } from '@/data/kalbar-fire-points'

interface FireLayerProps {
  readonly points: readonly FirePoint[]
  readonly className?: string
}

const KALBAR_OFFSET_X = 3404.09375
const KALBAR_OFFSET_Y = 1079.00098
const KALBAR_SCALE = 2.12089

// Konversi koordinat layar 1440x1024 ke koordinat peta dasar 4096x1365
function screenToMapCoord([sx, sy]: FirePoint): readonly [number, number] {
  const mx = (sx + KALBAR_OFFSET_X) / KALBAR_SCALE + 31.5 / KALBAR_SCALE
  const my = (sy + KALBAR_OFFSET_Y) / KALBAR_SCALE + 31.5 / KALBAR_SCALE
  return [mx, my] as const
}

const MAP_RADIUS = 31.5 / KALBAR_SCALE

export function FireLayer({ points, className }: FireLayerProps) {
  const mapPoints = useMemo(() => points.map(screenToMapCoord), [points])

  return (
    <svg
      viewBox="0 0 4096 1365"
      className={`pointer-events-none absolute inset-0 size-full overflow-visible ${className ?? ''}`}
    >
      <defs>
        <radialGradient
          id="fireDotGradient"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform={`scale(${MAP_RADIUS})`}
        >
          <stop offset="0%" stopColor="#e30000" stopOpacity="1" />
          <stop offset="45%" stopColor="#e30000" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e30000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {mapPoints.map(([cx, cy], i) => (
        <circle
          key={`${cx.toFixed(1)}-${cy.toFixed(1)}-${i}`}
          cx={cx}
          cy={cy}
          r={MAP_RADIUS}
          fill="url(#fireDotGradient)"
          className="animate-pulse"
          style={{
            animationDuration: `${2 + (i % 5) * 0.4}s`,
            animationDelay: `${(i % 7) * 0.15}s`,
          }}
        />
      ))}
    </svg>
  )
}
