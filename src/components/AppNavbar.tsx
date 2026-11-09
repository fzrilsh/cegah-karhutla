import { useEffect, useRef, useState } from 'react'
import { provinces, type Province } from '@/data/provinces'
import { useMapTransition } from '@/lib/map-transition'
import { WargaLaporModal } from '@/components/WargaLaporModal'
import iconSearch from '@/assets/landing/icon-search.svg'
import iconArrowBack from '@/assets/icons/arrow-back.svg'

interface AppNavbarProps {
  readonly showBack?: boolean
  readonly onBack?: () => void
}

// Navbar desain (node 252:22455), dipakai landing, /peta, dan detail provinsi.
export function AppNavbar({ showBack = false, onBack }: AppNavbarProps) {
  const { goLanding, enterProvince } = useMapTransition()
  const [laporOpen, setLaporOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)

  const results = provinces.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase().trim()),
  )

  const select = (province: Province) => {
    setQuery('')
    setSearchOpen(false)
    enterProvince(province.slug)
  }

  useEffect(() => {
    if (!searchOpen) return
    const onDown = (e: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [searchOpen])

  return (
    <>
      <header className="pointer-events-auto absolute inset-x-0 top-0 z-40 flex h-[64px] items-center justify-between rounded-b-[6px] bg-linear-to-r from-green-900/5 to-black/5 px-4 backdrop-blur-[2px] md:h-[79px] md:px-[max(16px,calc((100%-1120px)/2))]">
        <div className="flex items-center gap-3 md:gap-5">
          {showBack && (
            <button type="button" onClick={onBack ?? goLanding} className="cursor-pointer" aria-label="Kembali">
              <img src={iconArrowBack} alt="" className="size-6 rotate-90 invert md:size-8" />
            </button>
          )}
          {/* Logo ikut tombol kembali, bukan langsung ke landing, supaya klik meleset
              dari panah tidak melempar user ke halaman awal. Di landing tidak ada
              tujuan kembali, jadi logo tidak bisa diklik. */}
          <button
            type="button"
            onClick={showBack ? (onBack ?? goLanding) : undefined}
            disabled={!showBack}
            className={`whitespace-nowrap font-logo text-[20px] leading-none text-white sm:text-[28px] lg:text-[40px] ${
              showBack ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            Cegah Karhutla
          </button>
        </div>

        <nav className="flex items-center gap-4 md:gap-8">
          <div ref={searchRef} className="relative hidden md:block">
            {searchOpen ? (
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim() && results[0]) select(results[0])
                }}
                placeholder="Cari provinsi..."
                aria-label="Cari provinsi"
                className="h-9 w-[200px] border-b border-white/40 bg-transparent font-nav text-[18px] font-medium text-white placeholder:text-white/50 focus:border-white focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex cursor-pointer items-center gap-1 text-white"
                aria-label="Cari provinsi"
              >
                <span className="whitespace-nowrap font-nav text-[18px] font-medium">Cari Provinsi</span>
                <img src={iconSearch} alt="" className="size-6 -translate-y-px" />
              </button>
            )}

            {searchOpen && query.trim() && (
              <ul className="absolute inset-x-0 top-11 flex max-h-[320px] flex-col overflow-y-auto rounded-[10px] bg-paper shadow-card">
                {results.length > 0 ? (
                  results.map((p) => (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => select(p)}
                        className="flex min-h-[40px] w-full cursor-pointer items-center px-4 py-2 text-left font-nav text-[16px] leading-tight text-ink transition-colors hover:bg-hover-blue"
                      >
                        {p.name}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 font-sans text-[13px] text-ink/60">
                    Provinsi tidak ditemukan
                  </li>
                )}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => setLaporOpen(true)}
            className="flex h-8 w-[128px] cursor-pointer items-center justify-center rounded-[6px] bg-white font-nav text-[13px] font-medium text-ink md:h-9 md:w-[182px] md:text-[18px]"
          >
            Warga Lapor
          </button>
        </nav>
      </header>

      <WargaLaporModal open={laporOpen} onClose={() => setLaporOpen(false)} />
    </>
  )
}