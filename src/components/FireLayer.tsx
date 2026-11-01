import type { MapFirePoint } from '@/data/fire-points'
import { FIRE_POINT_RADIUS } from '@/data/fire-points'

interface FireLayerProps {
  readonly points: readonly MapFirePoint[]
  readonly className?: string
}

// Titik api dalam koordinat peta 4096x1365, ikut ter-scale dan ter-pan bersama peta
export function FireLayer({ points, className }: FireLayerProps) {
  return (
    <svg
      viewBox="0 0 4096 1365"
      className={`pointer-events-none absolute inset-0 size-full overflow-visible ${className ?? ''}`}
    >
      <defs>
        <radialGradient id="fireDotGradient">
          <stop offset="0%" stopColor="#e30000" stopOpacity="1" />
          <stop offset="45%" stopColor="#e30000" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e30000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {points.map(([cx, cy], i) => (
        <circle
          key={`${cx.toFixed(1)}-${cy.toFixed(1)}-${i}`}
          cx={cx}
          cy={cy}
          r={FIRE_POINT_RADIUS}
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
