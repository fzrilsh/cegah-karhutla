import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { provinces, type Province } from '@/data/provinces'
import { useMapTransition } from '@/lib/map-transition'
import searchIcon from '@/assets/icons/search.svg'
import arrowBack from '@/assets/icons/arrow-back.svg'

interface MobileTopBarProps {
  readonly variant: 'landing' | 'back'
  readonly currentProvinceSlug?: string
  readonly className?: string
}

export function MobileTopBar({
  variant,
  currentProvinceSlug,
  className,
}: MobileTopBarProps) {
  const { enterProvince, goLanding } = useMapTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const barRef = useRef<HTMLDivElement>(null)

  const activeProvince = provinces.find((p) => p.slug === currentProvinceSlug)

  const filtered = provinces.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase().trim()),
  )

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setSearchOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const handleSelect = (province: Province) => {
    setSearchOpen(false)
    setQuery('')
    enterProvince(province.slug)
  }

  return (
    <div ref={barRef} className={`absolute inset-x-3 top-3 z-30 ${className ?? ''}`}>
      <div className="flex h-[52px] items-center justify-between rounded-[12px] border border-navy-700 bg-linear-to-r from-navy-800 to-navy-700 px-4 shadow-glow">
        {variant === 'landing' ? (
          <span className="font-display text-[20px] leading-none text-paper">
            Cegah Karhutla
          </span>
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={goLanding}
              aria-label="Kembali ke halaman utama"
              className="flex size-[36px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-paper transition-colors active:bg-paper-2"
            >
              <img src={arrowBack} alt="" className="size-[18px] rotate-90" />
            </button>
            <span className="truncate font-display text-[18px] text-paper">
              {activeProvince ? activeProvince.name : 'Provinsi'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Cari provinsi"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((v) => !v)
              setMenuOpen(false)
            }}
            className="flex size-[36px] cursor-pointer items-center justify-center rounded-[8px] transition-colors hover:bg-white/10"
          >
            <img src={searchIcon} alt="" className="size-[22px]" />
          </button>

          {variant === 'landing' && (
            <button
              type="button"
              aria-label="Buka menu navigasi"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((v) => !v)
                setSearchOpen(false)
              }}
              className="flex size-[36px] cursor-pointer flex-col items-center justify-center gap-[5px] rounded-[8px] transition-colors hover:bg-white/10"
            >
              <span
                className={`h-[2px] w-[18px] bg-paper transition-transform ${
                  menuOpen ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`h-[2px] w-[18px] bg-paper transition-opacity ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`h-[2px] w-[18px] bg-paper transition-transform ${
                  menuOpen ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && variant === 'landing' && (
          <m.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute inset-x-0 top-[60px] overflow-hidden rounded-[12px] bg-paper shadow-glow"
          >
            {['Tentang Cegah Karhutla', 'Cara Baca Data', 'Penjelasan Fitur'].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-[48px] w-full cursor-pointer items-center justify-center font-display text-[16px] text-ink transition-colors active:bg-hover-blue"
                >
                  {label}
                </button>
              ),
            )}
          </m.div>
        )}

        {searchOpen && (
          <m.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute inset-x-0 top-[60px] overflow-hidden rounded-[12px] border border-navy-700 bg-navy-800/97 shadow-glow backdrop-blur-md"
          >
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari Provinsi..."
              className="h-[48px] w-full bg-transparent px-4 font-display text-[16px] text-paper placeholder:text-paper placeholder:opacity-40 focus:outline-none"
            />
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="flex h-[44px] w-full cursor-pointer items-center px-4 text-left font-display text-[16px] text-paper transition-colors active:bg-navy-700"
                >
                  {p.name}
                </button>
              ))
            ) : (
              <p className="px-4 pb-4 font-sans text-[13px] text-paper-2">
                Provinsi tidak ditemukan
              </p>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
