import { m } from 'motion/react'
import type { MapLayerMode } from '@/components/Toggle'

interface MobileToggleProps {
  readonly mode: MapLayerMode
  readonly onChange: (mode: MapLayerMode) => void
  readonly className?: string
}

export function MobileToggle({ mode, onChange, className }: MobileToggleProps) {
  return (
    <div
      className={`flex h-[48px] w-full items-center rounded-[12px] border border-navy-700 bg-linear-to-r from-navy-800 to-navy-700 p-1 shadow-glow select-none ${
        className ?? ''
      }`}
    >
      {(['fire', 'smoke'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className="relative flex-1 h-[40px] cursor-pointer"
        >
          {mode === value && (
            <m.span
              layoutId="mobile-toggle-pill"
              className="absolute inset-0 rounded-[8px] bg-paper"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          )}
          <span
            className={`relative z-10 flex h-full w-full items-center justify-center font-display text-[15px] transition-colors ${
              mode === value ? 'text-ink' : 'text-paper-2'
            }`}
          >
            {value === 'fire' ? 'Titik Api' : 'Arah Asap'}
          </span>
        </button>
      ))}
    </div>
  )
}
