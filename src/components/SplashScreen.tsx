import { useEffect, useState } from 'react'
import { m } from 'motion/react'
import heroPhoto from '@/assets/landing/hero-forest.webp'

// Teks berganti seperti variant di Figma (node 354:8279): Loading lalu titik bertambah.
const LOADING_TEXTS = [
  'Loading...',
  'Menyiapkan untukmu',
  'Menyiapkan untukmu.',
  'Menyiapkan untukmu..',
  'Menyiapkan untukmu...',
]

export function SplashScreen() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((value) => (value + 1) % LOADING_TEXTS.length),
      450,
    )
    return () => clearInterval(timer)
  }, [])

  return (
    <m.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="pointer-events-auto absolute inset-0 z-50 overflow-hidden bg-black"
    >
      {/* Foto Figma digambar 3438x1934 pada frame 1440x1024 lalu digeser ke kiri atas. */}
      <img
        src={heroPhoto}
        alt=""
        className="absolute max-w-none"
        style={{ width: '238.75%', height: '188.87%', left: '-138.75%', top: '-56.54%' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 76.2% 76.2% at 50% 50%, rgb(0 0 0 / 0.4) 16.2%, #000 100%)',
        }}
      />
      <p
        role="status"
        aria-live="polite"
        className="absolute top-[53.6%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-nav text-[18px] font-medium whitespace-nowrap text-[#f1f1f1]"
      >
        {LOADING_TEXTS[index]}
      </p>
    </m.div>
  )
}