import { m } from 'motion/react'

export type MapLayerMode = 'fire' | 'smoke'

interface ToggleProps {
  readonly mode: MapLayerMode
  readonly onChange: (mode: MapLayerMode) => void
  readonly className?: string
}

export function Toggle({ mode, onChange, className }: ToggleProps) {
  return (
    <div
      className={`relative flex h-[60px] w-[434px] items-center rounded-[10px] border border-navy-700 bg-linear-to-r from-navy-800 to-navy-700 p-[9px] shadow-glow select-none ${
        className ?? ''
      }`}
    >
      {/* Sliding Active Pill */}
      <m.div
        className="absolute top-[9px] h-[42px] w-[189px] rounded-[6px] bg-paper"
        initial={false}
        animate={{ x: mode === 'fire' ? 0 : 227 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      />

      {/* Button Titik Api */}
      <button
        type="button"
        onClick={() => onChange('fire')}
        className={`relative z-10 flex h-[42px] w-[189px] cursor-pointer items-center justify-center font-display text-[20px] leading-none transition-colors duration-150 ${
          mode === 'fire' ? 'text-ink' : 'text-paper-2 hover:text-paper'
        }`}
      >
        Titik Api
      </button>

      {/* Spacing gap between buttons */}
      <div className="w-[38px]" />

      {/* Button Arah Asap */}
      <button
        type="button"
        onClick={() => onChange('smoke')}
        className={`relative z-10 flex h-[42px] w-[189px] cursor-pointer items-center justify-center font-display text-[20px] leading-none transition-colors duration-150 ${
          mode === 'smoke' ? 'text-ink' : 'text-paper-2 hover:text-paper'
        }`}
      >
        Arah Asap
      </button>
    </div>
  )
}
