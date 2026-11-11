import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { findProvinceNameAt, formatCoordinate } from '@/lib/geo'
import provincesGeo from '@/data/provinces-geo.json'
import type { Posko } from '@/data/posko-medis'
import type { PoskoRoute } from '@/components/PoskoRouteOverlay'
import iconPin from '@/assets/posko/icon-pin-dot.svg'
import iconPhone from '@/assets/posko/icon-phone.svg'
import iconClose from '@/assets/modal/icon-close.svg'

const OSRM = 'https://router.project-osrm.org/route/v1/driving'
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'
const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }

// Alamat hasil reverse geocode disimpan per posko supaya membuka ulang tidak
// menembak Nominatim lagi (kebijakan pemakaiannya satu permintaan per detik).
const addressCache = new Map<string, string>()

// "Jalan, kelurahan, kecamatan", sesuai permintaan. Google Maps tetap dibuka
// lewat koordinat, nama ini hanya label.
function addressLabel(address: Record<string, string> | undefined) {
  if (!address) return undefined
  // OSM kadang mengisi addr:road dengan nomor rumah saja ("7"), tidak berguna.
  const road = address.road && !/^\d+$/.test(address.road) ? address.road : undefined
  const parts = [
    road,
    address.village ?? address.neighbourhood ?? address.suburb,
    address.city_district ?? address.district ?? address.city ?? address.county,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : undefined
}

function Field({ icon, label, value, href }: { readonly icon: string; readonly label: string; readonly value: string; readonly href?: string }) {
  const content = (
    <>
      <img src={icon} alt="" className="size-[22px] shrink-0" />
      <span className="truncate font-nav text-[18px] font-medium text-ink underline-offset-2 group-hover:underline">{value}</span>
    </>
  )

  return (
    <div className="mt-4 w-full max-w-[475px]">
      <p className="font-nav text-[18px] font-medium text-gray-500">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-1 flex h-[59px] items-center gap-2 rounded-[6px] border-[0.5px] border-white/70 bg-gray-500/20 px-4 hover:bg-green-500/15"
          aria-label={`Buka ${value} di Google Maps`}
        >
          {content}
        </a>
      ) : (
        <div className="mt-1 flex h-[59px] items-center gap-2 rounded-[6px] border-[0.5px] border-white/70 bg-gray-500/20 px-4">
          {content}
        </div>
      )}
    </div>
  )
}

interface PoskoMedisModalProps {
  readonly posko: Posko | null
  readonly onRoute: (route: PoskoRoute | null) => void
  readonly onClose: () => void
}

function Panel({ posko, onRoute, onClose }: Omit<PoskoMedisModalProps, 'posko'> & { posko: Posko }) {
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null)
  const cacheKey = `${posko.lat},${posko.lng}`
  const [address, setAddress] = useState<string | undefined>(() => addressCache.get(cacheKey))

  // Nama jalan, kelurahan, kecamatan dari koordinat posko. Gagal atau lambat,
  // field Lokasi tetap memakai kota atau koordinat bawaan.
  useEffect(() => {
    if (addressCache.has(cacheKey)) return
    const controller = new AbortController()
    fetch(`${NOMINATIM}?format=jsonv2&zoom=18&addressdetails=1&lat=${posko.lat}&lon=${posko.lng}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { address?: Record<string, string> } | null) => {
        const label = addressLabel(data?.address)
        if (!label) return
        addressCache.set(cacheKey, label)
        setAddress(label)
      })
      .catch(() => {
        // Tanpa alamat, field Lokasi tetap menampilkan kota atau koordinat.
      })
    return () => controller.abort()
  }, [cacheKey, posko.lat, posko.lng])

  // Rute hanya untuk posko di provinsi yang sama dengan lokasi user.
  const poskoProvince = findProvinceNameAt(provincesGeo.features, posko.lng, posko.lat)

  const startRoute = () => {
    if (!('geolocation' in navigator)) {
      setStatus({ text: 'Perangkat tidak mendukung lokasi', error: true })
      return
    }
    setStatus({ text: 'Mengambil rute...', error: false })
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        const from = [longitude, latitude] as const
        if (findProvinceNameAt(provincesGeo.features, longitude, latitude) !== poskoProvince) {
          setStatus({ text: 'Lokasi kamu di luar provinsi posko ini, rute tidak ditampilkan', error: true })
          return
        }
        const to = [posko.lng, posko.lat] as const
        try {
          const response = await fetch(`${OSRM}/${from.join(',')};${to.join(',')}?overview=full&geometries=geojson`)
          if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`)
          const data = (await response.json()) as { routes?: { geometry: GeoJSON.LineString }[] }
          onRoute({ label: posko.name, from, to, geometry: data.routes?.[0]?.geometry ?? null })
          setStatus(null)
        } catch {
          // Rute gagal dimuat, peta tetap diarahkan ke dua titik.
          onRoute({ label: posko.name, from, to, geometry: null })
          setStatus({ text: 'Rute gagal dimuat, peta tetap menampilkan dua titik', error: true })
        }
      },
      () => setStatus({ text: 'Lokasi tidak tersedia, izinkan akses lokasi', error: true }),
      GEO_OPTIONS,
    )
  }

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="posko-title"
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative max-h-[92vh] w-full max-w-[816px] overflow-y-auto rounded-[6px] bg-gradient-to-b from-[#f1f1f1] to-[#dfffe6] p-5 md:p-[26px_30px]"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="posko-title" className="font-heading text-[28px] leading-[40px] font-semibold tracking-[-0.72px] text-ink md:text-[36px]">
          {posko.name}
        </h2>
        <button type="button" onClick={onClose} aria-label="Tutup posko medis" className="mt-1 shrink-0 cursor-pointer">
          <img src={iconClose} alt="" className="size-[30px] md:size-[37px]" />
        </button>
      </div>

      <div className="mt-3 h-px w-full bg-ink" />


      <div className="flex flex-col items-center">
        <Field
          icon={iconPin}
          label="Lokasi"
          value={address ?? posko.city ?? formatCoordinate(posko.lat, posko.lng)}
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(posko.name)}`}
        />
        <Field icon={iconPhone} label="Telepon" value={posko.phone || 'Belum tersedia'} />
        <button
          type="button"
          onClick={startRoute}
          className="mt-8 h-[59px] w-full max-w-[475px] cursor-pointer rounded-[6px] border-[0.5px] border-white/70 bg-gradient-to-r from-green-500 to-green-600 font-nav text-[18px] font-medium text-paper"
        >
          Tunjukkan Rute
        </button>
        {status && (
          <p
            role={status.error ? 'alert' : 'status'}
            className={`mt-3 text-center font-nav text-[14px] font-medium ${status.error ? 'text-danger' : 'text-gray-500'}`}
          >
            {status.text}
          </p>
        )}
      </div>
    </m.div>
  )
}

export function PoskoMedisModal({ posko, onRoute, onClose }: PoskoMedisModalProps) {
  return (
    <AnimatePresence>
      {posko && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4">
          <m.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/50"
          />
          <Panel posko={posko} onRoute={onRoute} onClose={onClose} />
        </div>
      )}
    </AnimatePresence>
  )
}