import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Toggle, type MapLayerMode } from '@/components/Toggle'
import { Search } from '@/components/Search'
import { SupportButtons } from '@/components/SupportButtons'
import { MobileTopBar } from '@/components/MobileTopBar'
import { MobileToggle } from '@/components/MobileToggle'
import { useMobile } from '@/hooks/use-mobile'
import { useUiScale } from '@/hooks/use-ui-scale'
import { Scaled } from '@/components/Scaled'

export function LandingPage() {
  const isMobile = useMobile()
  const ui = useUiScale()
  const [mode, setMode] = useState<MapLayerMode>('fire')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  if (isMobile) {
    return (
      <div className="pointer-events-none absolute inset-0 select-none">
        <MobileTopBar variant="landing" className="pointer-events-auto" />
        <MobileToggle
          mode={mode}
          onChange={setMode}
          className="pointer-events-auto absolute inset-x-3 top-[72px] z-30"
        />
        <div className="pointer-events-auto absolute inset-x-3 bottom-0 z-30 flex gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => showToast('Peta navigasi posko kesehatan terdekat akan dibuka.')}
            className="flex h-[52px] flex-1 cursor-pointer items-center justify-center rounded-[12px] border border-navy-700 bg-paper font-display text-[15px] text-ink shadow-glow transition-transform active:scale-[0.98]"
          >
            Posko Kesehatan
          </button>
          <button
            type="button"
            onClick={() => showToast('Formulir pelaporan titik api karhutla dibuka.')}
            className="flex h-[52px] flex-1 cursor-pointer items-center justify-center rounded-[12px] border border-navy-700 bg-paper font-display text-[15px] text-ink shadow-glow transition-transform active:scale-[0.98]"
          >
            Lapor Titik Api
          </button>
        </div>
        {toastMessage && (
          <div className="pointer-events-auto absolute bottom-[76px] left-1/2 z-50 w-max max-w-[90vw] -translate-x-1/2 rounded-[12px] border border-navy-700 bg-navy-800/95 px-5 py-3 text-center font-display text-[14px] text-paper shadow-glow backdrop-blur-md">
            {toastMessage}
          </div>
        )}
      </div>
    )
  }

  // Layout desktop/tablet fluid
  const marginX = 'max(16px, 3.47vw)'
  const marginTop = 'max(12px, 4.88vh)'

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* Baris atas */}
      <div
        style={{ left: marginX, right: marginX, top: marginTop }}
        className="absolute z-20 flex items-start justify-between gap-4"
      >
        <Scaled scale={ui} width={433} height={60} className="pointer-events-auto">
          <Navbar />
        </Scaled>
        <Scaled scale={ui} width={434} height={60} className="pointer-events-auto">
          <Toggle mode={mode} onChange={setMode} />
        </Scaled>
        <Scaled scale={ui} width={434} height={60} className="pointer-events-auto">
          <Search />
        </Scaled>
      </div>

      {/* Tombol aksi kanan (z lebih rendah dari baris atas supaya dropdown search menutupinya) */}
      <div
        style={{ right: marginX, top: `calc(${marginTop} + ${60 * ui + 16}px)` }}
        className="pointer-events-auto absolute z-10"
      >
        <Scaled scale={ui} width={434} height={60}>
          <SupportButtons
            onHealthPostClick={() =>
              showToast('Peta navigasi posko kesehatan terdekat akan dibuka.')
            }
            onReportFireClick={() =>
              showToast('Formulir pelaporan titik api karhutla dibuka.')
            }
          />
        </Scaled>
      </div>

      {toastMessage && (
        <div className="pointer-events-auto absolute bottom-[3.9vh] left-1/2 z-50 -translate-x-1/2 rounded-[10px] border border-navy-700 bg-navy-800/95 px-6 py-3 font-display text-[16px] text-paper shadow-glow backdrop-blur-md">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
