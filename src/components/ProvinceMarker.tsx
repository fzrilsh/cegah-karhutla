import { m } from 'motion/react'
import markerRing from '@/assets/map/marker-ring.svg'
import markerCore from '@/assets/map/marker-core.svg'
import type { ProvinceMapItem } from '@/data/provinces-map-data'

interface ProvinceMarkerProps {
  readonly item: ProvinceMapItem
  readonly isHovered: boolean
  readonly onHover: (slug: string | null) => void
  readonly onSelect: (slug: string) => void
}

export function ProvinceMarker({
  item,
  isHovered,
  onHover,
  onSelect,
}: ProvinceMarkerProps) {
  return (
    <div className="size-[99px] select-none">
      <m.button
        type="button"
        onMouseEnter={() => onHover(item.slug)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(item.slug)}
        onBlur={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(item.slug)
        }}
        initial={false}
        animate={{ scale: isHovered ? 1.111 : 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="group relative flex size-full cursor-pointer items-center justify-center outline-none"
        aria-label={`Buka data ${item.name}`}
      >
        {/* Outer Ring */}
        <img
          src={markerRing}
          alt=""
          className="pointer-events-none absolute inset-0 size-full"
        />

        {/* Inner Core */}
        <img
          src={markerCore}
          alt=""
          className="pointer-events-none absolute inset-[10px] size-[79px]"
        />

        {/* Label */}
        <div className="pointer-events-none relative z-10 flex h-[50px] w-[74px] flex-col items-center justify-center font-display text-[12px] leading-[14px] text-map-label text-center">
          <p className="mb-0">{item.line1}</p>
          <p>{item.line2}</p>
        </div>
      </m.button>
    </div>
  )
}
