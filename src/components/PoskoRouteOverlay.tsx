import { m } from 'motion/react'
import dotStart from '@/assets/posko/dot-start.svg'
import dotEnd from '@/assets/posko/dot-end.svg'

export interface PoskoRoute {
  readonly label: string
  readonly from: readonly [number, number]
  readonly to: readonly [number, number]
  readonly geometry: GeoJSON.LineString | null
}

function Row({ dot, label, position }: { readonly dot: string; readonly label: string; readonly position: 'top' | 'bottom' }) {
  return (
    <div
      className={`flex h-[38px] w-full items-center gap-3 border border-[#3aa852] px-3 ${
        position === 'top' ? 'rounded-t-[6px] border-b-0' : 'rounded-b-[6px]'
      }`}
    >
      <img src={dot} alt="" className="size-[10px] shrink-0" />
      <span className="truncate font-nav text-[13px] font-medium text-ink">{label}</span>
    </div>
  )
}

// Overlay rute posko, node Figma 301:6139. Dikecilkan dan ditempel di bawah
// supaya tidak menutupi peta; peta tetap bisa digeser.
export function PoskoRouteOverlay({ route, onClose }: { readonly route: PoskoRoute; readonly onClose: () => void }) {
  return (
    <m.div
      role="dialog"
      aria-label="Rute posko medis"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="pointer-events-auto w-full max-w-[380px] rounded-[6px] bg-gradient-to-b from-[#f1f1f1] to-[#dfffe6] p-3 shadow-card"
    >
      <div className="flex w-full flex-col">
        <Row dot={dotStart} label="Lokasi Saya" position="top" />
        <Row dot={dotEnd} label={route.label} position="bottom" />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full cursor-pointer text-center font-nav text-[13px] font-medium text-ink"
      >
        Tutup Rute
      </button>
    </m.div>
  )
}