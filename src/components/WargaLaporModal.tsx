import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { cn } from '@/lib/cn'
import { findProvinceNameAt, formatCoordinate } from '@/lib/geo'
import provincesGeo from '@/data/provinces-geo.json'
import iconPin from '@/assets/modal/icon-pin.svg'
import iconCamera from '@/assets/modal/icon-camera.svg'
import iconClose from '@/assets/modal/icon-close.svg'

const KATEGORI = ['Titik Api Baru', 'Butuh Medis', 'Sudah Padam'] as const

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }

type LokasiState =
  | { status: 'loading' }
  | { status: 'ok'; text: string }
  | { status: 'error'; text: string }

// GPS lewat browser, lalu titik dicocokkan ke poligon provinsi untuk dapat namanya.
function useLokasi(open: boolean): LokasiState {
  const [state, setState] = useState<LokasiState>(() =>
    'geolocation' in navigator
      ? { status: 'loading' }
      : { status: 'error', text: 'Perangkat tidak mendukung lokasi' },
  )

  useEffect(() => {
    if (!open) return
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        const province = findProvinceNameAt(provincesGeo.features, longitude, latitude)
        setState({
          status: 'ok',
          text: `${province ?? 'Luar Indonesia'} | ${formatCoordinate(latitude, longitude)}`,
        })
      },
      () => setState({ status: 'error', text: 'Lokasi tidak tersedia, izinkan akses lokasi' }),
      GEO_OPTIONS,
    )
  }, [open])

  return state
}

interface WargaLaporModalProps {
  readonly open: boolean
  readonly onClose: () => void
}

// Isi form dipisah supaya state ikut ter-reset saat panel di-unmount setelah animasi keluar.
function LaporPanel({ onClose }: { readonly onClose: () => void }) {
  const [kategori, setKategori] = useState<string | null>(null)
  const [foto, setFoto] = useState('')
  const [terkirim, setTerkirim] = useState(false)
  const lokasi = useLokasi(true)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <m.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="warga-lapor-title"
      tabIndex={-1}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 12 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative max-h-[92vh] w-full max-w-[813px] overflow-y-auto rounded-[6px] bg-linear-to-b from-paper to-green-200 p-5 outline-none md:p-[26px_27px_26px_30px]"
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          id="warga-lapor-title"
          className="font-heading text-[28px] leading-[40px] font-semibold tracking-[-0.72px] text-ink md:text-[36px]"
        >
          Warga Lapor
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup formulir"
          className="mt-1 shrink-0 cursor-pointer md:mt-[6px]"
        >
          <img src={iconClose} alt="" className="size-[30px] md:size-[37px]" />
        </button>
      </div>

      <div className="mt-[23px] h-px w-full bg-ink" />

      <p className="mt-4 font-nav text-[18px] font-medium text-gray-500">Lokasi</p>
      <div
        aria-live="polite"
        className="mt-1 flex min-h-[59px] w-full max-w-[475px] items-center gap-2 rounded-[6px] border-[0.5px] border-white/70 bg-gray-500/50 px-3 py-2"
      >
        <img src={iconPin} alt="" className="size-[34px] shrink-0" />
        <span
          className={cn(
            'font-nav text-[18px] font-medium',
            lokasi.status === 'ok' ? 'text-ink' : 'text-ink/60',
          )}
        >
          {lokasi.status === 'loading' ? 'Mencari lokasi...' : lokasi.text}
        </span>
      </div>

      <p className="mt-5 font-nav text-[18px] font-medium text-gray-500">Kategori Laporan</p>
      <div
        role="group"
        aria-label="Kategori Laporan"
        className="mt-1 grid max-w-[687px] gap-3 sm:grid-cols-3 sm:gap-[30px]"
      >
        {KATEGORI.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={kategori === item}
            onClick={() => setKategori(item)}
            className={cn(
              'h-[59px] cursor-pointer rounded-[6px] border border-gray-500/50 font-nav text-[18px] font-medium text-ink',
              kategori === item && 'border-green-600 bg-green-500/15',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="mt-3 font-nav text-[18px] font-medium text-gray-500">Unggah Foto Bukti</p>
      <label className="mt-1 flex h-[94px] w-full max-w-[344px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[6px] border border-dashed border-gray-500/50">
        <img src={iconCamera} alt="" className="size-6" />
        <span className="max-w-[90%] truncate font-nav text-[16px] font-medium text-gray-500">
          {foto || 'Klik untuk memilih foto'}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFoto(e.target.files?.[0]?.name ?? '')}
        />
      </label>

      <button
        type="button"
        disabled={!kategori || !foto}
        onClick={() => {
          setTerkirim(true)
          setTimeout(onClose, 1600)
        }}
        className="mt-5 h-[59px] w-full max-w-[475px] cursor-pointer rounded-[6px] border-[0.5px] border-white/70 bg-linear-to-r from-green-500 to-green-600 font-nav text-[18px] font-medium text-paper disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-500"
      >
        Kirim Laporan
      </button>

      {terkirim && (
        <m.div
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[6px] bg-linear-to-b from-paper to-green-200"
        >
          <m.svg viewBox="0 0 64 64" className="size-16" initial="hidden" animate="visible">
            <m.circle
              cx="32"
              cy="32"
              r="29"
              fill="none"
              stroke="#3aa852"
              strokeWidth="4"
              variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <m.path
              d="M20 33.5L28 41.5L44 24"
              fill="none"
              stroke="#1d7d32"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
              transition={{ duration: 0.35, delay: 0.4, ease: 'easeOut' }}
            />
          </m.svg>
          <m.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.55 }}
            className="font-nav text-[20px] font-medium text-ink"
          >
            Laporan Terkirim
          </m.p>
        </m.div>
      )}
    </m.div>
  )
}

export function WargaLaporModal({ open, onClose }: WargaLaporModalProps) {
  return (
    <AnimatePresence>
      {open && (
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
          <LaporPanel onClose={onClose} />
        </div>
      )}
    </AnimatePresence>
  )
}