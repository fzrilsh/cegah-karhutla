import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router'

export type MapCameraState =
  | { readonly kind: 'landing' }
  | { readonly kind: 'province'; readonly slug: string }

interface MapTransitionApi {
  readonly camera: MapCameraState
  readonly enterProvince: (slug: string) => void
  readonly goLanding: () => void
}

const MapTransitionContext = createContext<MapTransitionApi | null>(null)

// Kamera derive dari route supaya transisi dan URL selalu sinkron (deep-link tetap jalan)
function cameraFromPath(pathname: string): MapCameraState {
  if (pathname.startsWith('/provinsi/')) {
    const slug = pathname.split('/')[2]
    if (slug) return { kind: 'province', slug }
  }
  return { kind: 'landing' }
}

export function MapTransitionProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const camera = cameraFromPath(location.pathname)

  const enterProvince = useCallback(
    (slug: string) => {
      navigate(`/provinsi/${slug}`)
    },
    [navigate],
  )

  const goLanding = useCallback(() => {
    navigate('/')
  }, [navigate])

  const api = useMemo(
    () => ({ camera, enterProvince, goLanding }),
    [camera, enterProvince, goLanding],
  )

  return (
    <MapTransitionContext.Provider value={api}>
      {children}
    </MapTransitionContext.Provider>
  )
}

export function useMapTransition() {
  const ctx = useContext(MapTransitionContext)
  if (!ctx) throw new Error('useMapTransition harus dipakai di dalam MapTransitionProvider')
  return ctx
}
