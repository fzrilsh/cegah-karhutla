import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 767px)'

// true hanya untuk HP. Tablet tetap memakai layout lebar supaya panel tidak menutup peta.
export function useMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY)
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
