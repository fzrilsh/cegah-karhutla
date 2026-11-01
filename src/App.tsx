import { BrowserRouter, useLocation } from 'react-router'
import { LazyMotion, MotionConfig, AnimatePresence, domAnimation, m } from 'motion/react'
import { LandingPage } from '@/pages/LandingPage'
import { ProvincePage } from '@/pages/ProvincePage'
import { SharedMap } from '@/components/SharedMap'
import { MapTransitionProvider } from '@/lib/map-transition'
import { useMobile } from '@/hooks/use-mobile'

// Overlay halaman yang crossfade di atas peta bersama
function PageOverlay() {
  const location = useLocation()
  const displayedLocation = location

  const isLanding = displayedLocation.pathname === '/'
  const slug = displayedLocation.pathname.startsWith('/provinsi/')
    ? displayedLocation.pathname.split('/')[2]
    : undefined

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={displayedLocation.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 z-20"
      >
        {isLanding ? (
          <LandingPage key="landing" />
        ) : (
          <ProvincePage key={slug ?? 'province'} slug={slug} />
        )}
      </m.div>
    </AnimatePresence>
  )
}

function Root() {
  const isMobile = useMobile()
  const location = useLocation()
  const slug = location.pathname.startsWith('/provinsi/')
    ? location.pathname.split('/')[2]
    : undefined

  return (
    <div className="fixed inset-0 overflow-hidden bg-stage select-none">
      <SharedMap isMobile={isMobile} activeProvinceSlug={slug} />
      <PageOverlay />
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
