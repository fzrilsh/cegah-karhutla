import { useState } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { useMapTransition } from '@/lib/map-transition'
import chevronDown from '@/assets/icons/chevron-down.svg'

interface NavbarProps {
  readonly className?: string
}

export function Navbar({ className }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { goLanding } = useMapTransition()

  return (
    <div className={`relative z-30 select-none ${className ?? ''}`}>
      {/* Header Bar */}
      <div className="flex h-[60px] w-[433px] items-center justify-between rounded-[10px] border border-navy-700 bg-linear-to-r from-navy-800 to-navy-700 px-[22px] shadow-glow">
        <button
          type="button"
          onClick={goLanding}
          className="font-display text-[32px] leading-none text-paper"
        >
          Cegah Karhutla
        </button>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex size-[24px] cursor-pointer items-center justify-center transition-transform"
          aria-label="Buka menu navigasi"
          aria-expanded={isOpen}
        >
          <img
            src={chevronDown}
            alt=""
            className={`size-[24px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-[229px] top-[70px] flex h-[120px] w-[204px] flex-col overflow-hidden rounded-[10px] bg-paper shadow-glow"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-[40px] w-full cursor-pointer items-center justify-center font-display text-[16px] text-ink transition-colors hover:bg-hover-blue"
            >
              Tentang Cegah Karhutla
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-[40px] w-full cursor-pointer items-center justify-center font-display text-[16px] text-ink transition-colors hover:bg-hover-blue"
            >
              Cara Baca Data
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-[40px] w-full cursor-pointer items-center justify-center font-display text-[16px] text-ink transition-colors hover:bg-hover-blue"
            >
              Penjelasan Fitur
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
