import { useState } from 'react'
import { BrowserRouter, useLocation } from 'react-router'
import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import { LandingPage } from '@/pages/LandingPage'
import { NationalMapPage } from '@/pages/NationalMapPage'
import { ProvincePage } from '@/pages/ProvincePage'
import { SharedMap } from '@/components/SharedMap'
import { MapTransitionProvider } from '@/lib/map-transition'
import { useMobile } from '@/hooks/use-mobile'
import { DEFAULT_WEEK_INDEX } from '@/data/weekly-metrics'

// Semua overlay route wajib z-20, SharedMap memakai z-10.
function LandingOverlay() {
  return (
    <div className="absolute inset-0 z-20">
      <LandingPage />
    </div>
  )
}

function NationalOverlay() {
  return (
    // pointer-events-none wajib: wrapper ini menutupi peta, tanpa ini drag peta mati.
    <div className="pointer-events-none absolute inset-0 z-20">
      <NationalMapPage />
    </div>
  )
}

// Overlay detail provinsi: kartu info, slider, dll
interface ProvinceOverlayProps {
  readonly weekIndex: number
  readonly onWeekChange: (index: number) => void
}

function ProvinceOverlay({ weekIndex, onWeekChange }: ProvinceOverlayProps) {
  const location = useLocation()
  const displayedLocation = location

  const slug = displayedLocation.pathname.startsWith('/provinsi/')
    ? displayedLocation.pathname.split('/')[2]
    : undefined

  // Fade masuk bersamaan dengan terbangnya kamera (750ms di SharedMap).
  // Sengaja tanpa AnimatePresence: exit bertahap membuat transisi terasa pindah halaman.
  return (
    <m.div
      key={displayedLocation.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      className="pointer-events-none absolute inset-0 z-20"
    >
      <ProvincePage
        slug={slug}
        weekIndex={weekIndex}
        onWeekChange={onWeekChange}
      />
    </m.div>
  )
}

function Root() {
  const isMobile = useMobile()
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const isNational = location.pathname === '/peta'
  const slug = location.pathname.startsWith('/provinsi/')
    ? location.pathname.split('/')[2]
    : undefined

  // Minggu terpilih disimpan di sini supaya slider di halaman provinsi dan peta memakai nilai yang sama.
  // Pindah halaman (termasuk ke landing) mengembalikannya ke minggu default.
  const [selection, setSelection] = useState({ slug, weekIndex: DEFAULT_WEEK_INDEX })
  if (selection.slug !== slug) setSelection({ slug, weekIndex: DEFAULT_WEEK_INDEX })
  const weekIndex = selection.slug === slug ? selection.weekIndex : DEFAULT_WEEK_INDEX
  const handleWeekChange = (index: number) => setSelection({ slug, weekIndex: index })

  return (
    <div className="fixed inset-0 overflow-hidden bg-stage select-none">
      {/* SharedMap selalu di-mount sekali, persist camera state antar route */}
      <SharedMap isMobile={isMobile} activeProvinceSlug={slug} />
      {/* Overlay berubah sesuai route, peta tetap */}
      {isLanding && <LandingOverlay />}
      {isNational && <NationalOverlay />}
      {slug && <ProvinceOverlay weekIndex={weekIndex} onWeekChange={handleWeekChange} />}
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <MapTransitionProvider>
            <Root />
          </MapTransitionProvider>
        </BrowserRouter>
      </LazyMotion>
    </MotionConfig>
  )
}
