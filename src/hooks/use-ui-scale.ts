import { useEffect, useState } from 'react'

const DESIGN_WIDTH = 1440

// Faktor skala UI desktop: 1 di lebar 1440px, mengecil di laptop kecil
export function useUiScale() {
  const [scale, setScale] = useState(() =>
    typeof window === 'undefined' ? 1 : window.innerWidth / DESIGN_WIDTH,
  )

  useEffect(() => {
    const update = () => setScale(window.innerWidth / DESIGN_WIDTH)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return Math.min(1.5, Math.max(0.6, scale))
}