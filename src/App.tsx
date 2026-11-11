import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, useLocation } from 'react-router'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import { SplashScreen } from '@/components/SplashScreen'
import { LandingPage } from '@/pages/LandingPage'
import { NationalMapPage } from '@/pages/NationalMapPage'
import { ProvincePage } from '@/pages/ProvincePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SharedMap } from '@/components/SharedMap'
import { Seo } from '@/components/Seo'
import { MapTransitionProvider } from '@/lib/map-transition'
import { routeFromPath } from '@/lib/path'
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
  // Route hasil prerender memakai trailing slash ('/peta/'), routeFromPath menormalkan.
  const route = routeFromPath(location.pathname)
  const isLanding = route.kind === 'landing'
  const isNational = route.kind === 'national'
  const slug = route.kind === 'province' ? route.slug : undefined

  // Minggu terpilih disimpan di sini supaya slider di halaman provinsi dan peta memakai nilai yang sama.
  // Pindah halaman (termasuk ke landing) mengembalikannya ke minggu default.
  const [selection, setSelection] = useState({ slug, weekIndex: DEFAULT_WEEK_INDEX })
  if (selection.slug !== slug) setSelection({ slug, weekIndex: DEFAULT_WEEK_INDEX })
  const weekIndex = selection.slug === slug ? selection.weekIndex : DEFAULT_WEEK_INDEX
  const handleWeekChange = (index: number) => setSelection({ slug, weekIndex: index })

  // Splash tampil tiap masuk /peta, bukan landing atau provinsi.
  // Peta sudah selesai load kalau user datang dari landing (SharedMap mount sekali),
  // jadi beri waktu tampil minimum supaya splash terlihat, bukan berkedip.
  // Batas atas 2,5 detik sesuai docs/DATA-SOURCES.md.
  const SPLASH_MIN_MS = 900
  const SPLASH_MAX_MS = 2500
  const [mapReady, setMapReady] = useState(false)
  // location.key unik per navigasi, jadi ini mereset splash tiap kali /peta
  // dibuka.
  const [dismissedSplashKey, setDismissedSplashKey] = useState<string | null>(null)
  // Kembali dari detail provinsi tidak perlu splash: peta sudah tampil di
  // belakang sheet, splash cuma bikin kedip. Penandanya dari navigate state
  // di goNational, bukan menebak route sebelumnya.
  const fromProvince = (location.state as { fromProvince?: boolean } | null)?.fromProvince === true
  const splashVisible = isNational && dismissedSplashKey !== location.key && !fromProvince
  const splashStartRef = useRef(0)

  useEffect(() => {
    if (splashVisible) splashStartRef.current = performance.now()
  }, [splashVisible])

  useEffect(() => {
    if (!splashVisible) return
    const elapsed = performance.now() - splashStartRef.current
    const budget = mapReady ? SPLASH_MIN_MS : SPLASH_MAX_MS
    const timer = setTimeout(
      () => setDismissedSplashKey(location.key),
      Math.max(0, budget - elapsed),
    )
    return () => clearTimeout(timer)
  }, [splashVisible, mapReady, location.key])

  return (
    <div className="fixed inset-0 overflow-hidden bg-stage select-none">
      <Seo />
      {/* SharedMap selalu di-mount sekali, persist camera state antar route */}
      <SharedMap
        isMobile={isMobile}
        activeProvinceSlug={slug}
        weekIndex={weekIndex}
        onReady={() => setMapReady(true)}
      />
      {/* Overlay berubah sesuai route, peta tetap */}
      {isLanding && <LandingOverlay />}
      {isNational && <NationalOverlay />}
      {slug && <ProvinceOverlay weekIndex={weekIndex} onWeekChange={handleWeekChange} />}
      {route.kind === 'not-found' && <NotFoundPage />}
      <AnimatePresence>{splashVisible && <SplashScreen />}</AnimatePresence>
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
