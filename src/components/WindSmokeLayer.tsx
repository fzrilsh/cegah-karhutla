import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { nearestWind, type ProvinceWeather } from '@/lib/open-meteo'

type HeatCells = readonly (readonly [number, number, number])[]

interface WindSmokeLayerProps {
  readonly map: maplibregl.Map | null
  readonly weather: readonly ProvinceWeather[]
  readonly cells: HeatCells
  readonly enabled: boolean
  readonly isMobile: boolean
}

interface Particle {
  lng: number
  lat: number
  life: number
  maxLife: number
  dx: number
  dy: number
  // Panjang ekor di layar. Kecepatan angin asli cuma ~10 km/jam, jadi per frame
  // partikel bergerak di bawah 0,5 px. Tanpa ekor tetap, garisnya tak terlihat.
  len: number
}

const OFFSET = 24

// Arah angin dan sebaran asap digambar di canvas 2D, bukan ratusan elemen DOM.
// Partikel angin dan asap memakai sampel angin yang sama, jadi asap terlihat
// terbawa angin yang tergambar di sekitarnya. Kecepatan layar sengaja tidak
// memakai skala meter asli (angin 6 km/jam praktis diam di zoom 4).
export function WindSmokeLayer({ map, weather, cells, enabled, isMobile }: WindSmokeLayerProps) {
  useEffect(() => {
    // Tanpa data angin tidak ada yang digambar: arah karangan lebih buruk
    // daripada lapisan kosong.
    if (!map || !enabled || weather.length === 0) return

    // Kanvas disisipkan ke canvas-container MapLibre supaya duduk di atas peta
    // dan di bawah bubble provinsi.
    const container = map.getCanvasContainer()
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    // Sisipkan tepat sesudah kanvas WebGL: di atas peta, di bawah bubble provinsi
    // yang juga anak container ini.
    canvas.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;'
    container.insertBefore(canvas, container.children[1] ?? null)

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      canvas.remove()
      return
    }

    let width = 0
    let height = 0
    const resize = () => {
      // Ukur kontainer peta, bukan canvas container: yang kedua tingginya 0
      // karena anak-anaknya absolute.
      const rect = map.getContainer().getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(map.getContainer())

    const randomPoint = () => map.unproject([Math.random() * width, Math.random() * height])

    // Kecepatan layar piksel per detik dari sampel angin terdekat, arah dari
    // komponen u (timur) dan v (utara) menjadi dx, dy layar (y ke bawah).
    const driftAt = (lng: number, lat: number, base: number, gain: number) => {
      const wind = nearestWind(lat, lng, weather)
      const speed = wind ? Math.hypot(wind.u, wind.v) : 0
      const px = base + Math.min(speed * gain, base * 2.2)
      const angle = wind ? Math.atan2(wind.u, wind.v) : 0
      return { dx: Math.sin(angle) * px, dy: -Math.cos(angle) * px, speed }
    }

    const makeWind = (): Particle => {
      const point = randomPoint()
      const drift = driftAt(point.lng, point.lat, 12, 1.5)
      return {
        lng: point.lng,
        lat: point.lat,
        life: 0,
        maxLife: 2.5 + Math.random() * 3,
        dx: drift.dx,
        dy: drift.dy,
        len: 4 + Math.min(drift.speed, 20) * 1.1,
      }
    }

    // Asap keluar dari sel titik api terpadat, bukan dari semua sel.
    const hot = [...cells].sort((a, b) => b[2] - a[2]).slice(0, 60)

    const makeSmoke = (): Particle | null => {
      const cell = hot[Math.floor(Math.random() * hot.length)]
      if (!cell) return null
      const lng = cell[0] + (Math.random() - 0.5) * 0.12
      const lat = cell[1] + (Math.random() - 0.5) * 0.12
      const drift = driftAt(lng, lat, 8, 1.6)
      return {
        lng,
        lat,
        life: 0,
        maxLife: 5 + Math.random() * 4,
        dx: drift.dx,
        dy: drift.dy,
        len: 0,
      }
    }

    const winds: Particle[] = Array.from({ length: isMobile ? 90 : 220 }, makeWind)
    const smokes: Particle[] = []
    const smokeLimit = isMobile ? 40 : 90

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const drawFrame = (dt: number, animated: boolean) => {
      ctx.clearRect(0, 0, width, height)

      if (animated) {
        ctx.strokeStyle = 'rgba(236, 255, 244, 0.85)'
        ctx.lineWidth = 1.3
        ctx.beginPath()
        for (const particle of winds) {
          particle.life += dt
          const screen = map.project([particle.lng, particle.lat])
          const nx = screen.x + particle.dx * dt
          const ny = screen.y + particle.dy * dt
          if (
            particle.life > particle.maxLife ||
            nx < -OFFSET || nx > width + OFFSET || ny < -OFFSET || ny > height + OFFSET
          ) {
            Object.assign(particle, makeWind())
            continue
          }
          // Ekor digambar di belakang arah gerak, panjangnya tetap di layar.
          const length = Math.hypot(particle.dx, particle.dy) || 1
          ctx.moveTo(nx - (particle.dx / length) * particle.len, ny - (particle.dy / length) * particle.len)
          ctx.lineTo(nx, ny)
          const next = map.unproject([nx, ny])
          particle.lng = next.lng
          particle.lat = next.lat
        }
        ctx.stroke()
      }

      ctx.fillStyle = 'rgb(196, 202, 198)'
      for (const smoke of smokes) {
        smoke.life += dt
        const screen = map.project([smoke.lng, smoke.lat])
        const t = Math.min(smoke.life / smoke.maxLife, 1)
        ctx.globalAlpha = (1 - t) * 0.5
        ctx.beginPath()
        ctx.arc(screen.x, screen.y, 4 + t * 34, 0, Math.PI * 2)
        ctx.fill()
        if (smoke.life < smoke.maxLife && animated) {
          const next = map.unproject([screen.x + smoke.dx * dt, screen.y + smoke.dy * dt])
          smoke.lng = next.lng
          smoke.lat = next.lat
        }
      }
      ctx.globalAlpha = 1
    }

    if (reduceMotion) {
      // Satu frame diam: asap dan garis arah angin pendek, tanpa animasi.
      for (let index = 0; index < smokeLimit; index += 1) {
        const smoke = makeSmoke()
        if (smoke) smokes.push(smoke)
      }
      drawFrame(0, false)
      ctx.strokeStyle = 'rgba(236, 255, 244, 0.85)'
      ctx.lineWidth = 1.3
      ctx.beginPath()
      for (const particle of winds) {
        const screen = map.project([particle.lng, particle.lat])
        const length = Math.hypot(particle.dx, particle.dy) || 1
        ctx.moveTo(screen.x, screen.y)
        ctx.lineTo(
          screen.x - (particle.dx / length) * particle.len,
          screen.y - (particle.dy / length) * particle.len,
        )
      }
      ctx.stroke()
      return () => {
        observer.disconnect()
        canvas.remove()
      }
    }

    let last = 0
    let frame = 0
    const step = (time: number) => {
      const dt = last === 0 ? 0 : Math.min((time - last) / 1000, 0.05)
      last = time
      if (!document.hidden) {
        while (smokes.length < smokeLimit) {
          const smoke = makeSmoke()
          if (!smoke) break
          smokes.push(smoke)
        }
        for (let index = smokes.length - 1; index >= 0; index -= 1) {
          if (smokes[index].life >= smokes[index].maxLife) smokes.splice(index, 1)
        }
        drawFrame(dt, true)
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.remove()
    }
  }, [map, weather, cells, enabled, isMobile])

  return null
}