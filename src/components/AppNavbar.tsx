import { useState } from 'react'
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
  const { goLanding } = useMapTransition()
  const [laporOpen, setLaporOpen] = useState(false)

  return (
    <>
      <header className="pointer-events-auto absolute inset-x-0 top-0 z-40 flex h-[64px] items-center justify-between rounded-b-[6px] bg-linear-to-r from-green-900/5 to-black/5 px-4 backdrop-blur-[2px] md:h-[79px] md:px-[50px]">
        <div className="flex items-center gap-3 md:gap-5">
          {showBack && (
            <button type="button" onClick={onBack ?? goLanding} className="cursor-pointer" aria-label="Kembali">
              <img src={iconArrowBack} alt="" className="size-6 rotate-90 invert md:size-8" />
            </button>
          )}
          <button
            type="button"
            onClick={goLanding}
            className="cursor-pointer font-logo text-[28px] leading-none text-white md:text-[40px]"
          >
            Cegah Karhutla
          </button>
        </div>

        <nav className="flex items-center gap-4 md:gap-8">
          <button
            type="button"
            className="hidden cursor-pointer items-center gap-1 text-white md:flex"
            aria-label="Cari provinsi"
          >
            <span className="font-nav text-[18px] font-medium">Cari Provinsi</span>
            <img src={iconSearch} alt="" className="size-6 -translate-y-px" />
          </button>

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
