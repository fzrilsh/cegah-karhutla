import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useMapTransition } from '@/lib/map-transition'
import { useMobile } from '@/hooks/use-mobile'
import { findProvince } from '@/data/provinces'
import {
  aqiWeeklyFor,
  burnedWeeklyHaFor,
  hotspotWeeklyFor,
  hotspotWeeks,
  pm25WeeklyFor,
} from '@/data/hotspot-history'
import { provincePopulation } from '@/data/province-population'
import { aqiCategory } from '@/lib/air-quality'
import { estimateIspaCases } from '@/lib/health'
import { AppNavbar } from '@/components/AppNavbar'
import { FitBox } from '@/components/FitBox'
import areaBurnedIcon from '@/assets/detail/area-burned.svg'
import personA from '@/assets/detail/person-a.svg'
import personB from '@/assets/detail/person-b.svg'
import personC from '@/assets/detail/person-c.svg'
import gaugeArc from '@/assets/detail/gauge.png'

interface ProvincePageProps {
  readonly slug?: string
  readonly weekIndex: number
  readonly onWeekChange: (index: number) => void
}

// Geometri dari frame Figma 1440x1024 (node 291:15990).
const CHART_W = 517
const CHART_H = 103.5
const AQI_MAX = 260
const GAUGE_R = 121

export function ProvincePage({ slug, weekIndex, onWeekChange }: ProvincePageProps) {
  const isMobile = useMobile()
  const { goNational } = useMapTransition()

  const province = findProvince(slug)
  const values = hotspotWeeklyFor(slug)
  const aqiValues = aqiWeeklyFor(slug)
  const week = hotspotWeeks[weekIndex] ?? hotspotWeeks[hotspotWeeks.length - 1]
  const [line1, ...rest] = (province?.name ?? 'Kalimantan Barat').split(' ')
  // AQI dan tanggal ikut minggu grafik histori, bukan tabel metrik lama.
  const aqi = aqiValues[weekIndex] ?? 0
  const category = aqiCategory(aqi)
  const info = {
    line1,
    line2: rest.join(' '),
    date: week.dateFull,
    aqi,
    category: category.label,
    categoryColor: category.color,
  }
  const pm25 = pm25WeeklyFor(slug)[weekIndex] ?? 0
  const impact = {
    burnedHa: burnedWeeklyHaFor(slug)[weekIndex] ?? 0,
    weekLabel: week.dateShort,
    pm25,
    ispaCases: estimateIspaCases(provincePopulation[slug ?? ''] ?? 0, pm25),
  }

  // Switch Posko Medis mengirim slug ke SharedMap, yang menggambar marker.
  const [poskoActive, setPoskoActive] = useState(false)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('posko-layer', { detail: { slug: poskoActive ? slug : null } }))
    return () => {
      window.dispatchEvent(new CustomEvent('posko-layer', { detail: { slug: null } }))
    }
  }, [poskoActive, slug])
  const togglePosko = () => setPoskoActive((value) => !value)
  // Mobile: sheet ringkas AQI saja, histori dan dampak disembunyikan sampai dibuka.
  // ProvinceOverlay memakai key per path, jadi state ikut reset saat ganti provinsi.
  const [detailOpen, setDetailOpen] = useState(false)
  // Geser sheet lewat handle. dragOffset = jarak turun dari atas layar dalam px,
// null kalau tidak sedang digeser. Terbuka 0, tertutup sheetHeight - 196.
  const COLLAPSED_H = 196
  // Tinggi sheet diukur, bukan dihitung ulang, supaya geser cocok dengan CSS
  // min(78vh, 560px). Nilai awal dari viewport supaya tidak berkedip terbuka.
  const [sheetHeight, setSheetHeight] = useState(() =>
    typeof window === 'undefined' ? 560 : Math.min(window.innerHeight * 0.78, 560),
  )
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startOffset: number; max: number; moved: boolean } | null>(null)

  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setSheetHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [isMobile])

  const closedOffset = Math.max(sheetHeight - COLLAPSED_H, 0)
  const settledOffset = detailOpen ? 0 : closedOffset

  const onHandleDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const height = sheetRef.current?.offsetHeight ?? 0
    const max = Math.max(height - COLLAPSED_H, 0)
    setSheetHeight(height)
    dragRef.current = { startY: event.clientY, startOffset: detailOpen ? 0 : max, max, moved: false }
    setDragOffset(detailOpen ? 0 : max)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onHandleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const delta = event.clientY - drag.startY
    if (Math.abs(delta) > 4) drag.moved = true
    setDragOffset(Math.min(Math.max(drag.startOffset + delta, 0), drag.max))
  }
  const onHandleUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!drag) return
    if (!drag.moved) {
      setDetailOpen((value) => !value)
    } else {
      // Lewat separuh jalan dianggap buka.
      setDetailOpen((dragOffset ?? drag.startOffset) < drag.max / 2)
    }
    setDragOffset(null)
  }

  if (isMobile) {
    return (
      <div className="pointer-events-none absolute inset-0 z-20 select-none">
        <AppNavbar showBack onBack={goNational} />
        {/* Sheet dua tinggi: ringkasan AQI 196px supaya peta tetap terlihat,
            detail dibuka sampai 78vh (maks 560px) lalu digulir di dalam.
            Tinggi tetap, buka tutup lewat translateY supaya hanya transform
            yang dianimasikan. */}
        <div
          ref={sheetRef}
          style={{ transform: `translateY(${dragOffset ?? settledOffset}px)` }}
          className={`pointer-events-auto absolute inset-x-0 bottom-0 flex h-[min(78vh,560px)] flex-col overflow-hidden rounded-t-[16px] border-t border-black/10 bg-[#f1f1f1] shadow-card ${
            dragOffset === null ? 'transition-transform duration-[250ms] ease-out motion-reduce:transition-none' : ''
          }`}
        >
          {/* Handle: tap untuk buka tutup, geser untuk membuka. */}
          <div
            role="button"
            tabIndex={0}
            aria-expanded={detailOpen}
            aria-label={detailOpen ? 'Tutup detail provinsi' : 'Buka detail provinsi'}
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setDetailOpen((value) => !value)
              }
            }}
            className="flex h-9 w-full shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          >
            <span className="h-1 w-11 rounded-full bg-ink/25" />
          </div>

          <div className="shrink-0 px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* Maks 2 baris: nama panjang di layar 320px jangan sampai mendorong
                    switch Posko keluar dari area tertutup 196px. */}
                <h1 className="line-clamp-2 font-heading text-[20px] font-semibold leading-[24px] tracking-[-0.5px] text-ink sm:text-[22px] sm:leading-[26px]">
                  {info.line1} {info.line2}
                </h1>
                <div className="mt-1.5 inline-block rounded-[4px] border-[0.5px] border-green-500/50 bg-[#ebebeb] px-2 py-[3px] font-nav text-[11px] font-medium text-ink">
                  {info.date}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <div className="font-heading text-[44px] font-medium leading-none tracking-[-1.5px] text-ink">{info.aqi}</div>
                <div className="mt-0.5 font-nav text-[11px] font-medium text-gray-500">AQI</div>
                <div className="mt-1.5 rounded-[4px] px-2.5 py-[2px] font-nav text-[12px] font-bold" style={{ backgroundColor: info.categoryColor }}>
                  <span className={isDarkText(info.category) ? 'text-[#1b1b1b]' : 'bg-gradient-to-b from-[#f1f1f1] to-[#dfffe6] bg-clip-text text-transparent'}>
                    {info.category}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={poskoActive}
              onClick={togglePosko}
              className="mt-3 flex w-full cursor-pointer items-center justify-between border-t border-black/10 py-2.5 font-nav text-[14px] font-medium text-ink"
            >
              <span>Posko Medis</span>
              <span className={`relative h-4 w-9 rounded-[5px] ${poskoActive ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-[#c2c2c2]'}`}>
                <span className={`absolute top-0.5 size-3 rounded bg-white ${poskoActive ? 'right-0.5' : 'left-0.5'}`} />
              </span>
            </button>
          </div>

          {/* Selalu dirender supaya isi tidak berkedip kosong saat sheet turun.
              Saat tertutup isinya dipudarkan, kalau tidak judul panel ikut mengintip
              di 196px bawah yang masih terlihat. */}
          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-150 motion-reduce:transition-none ${
              detailOpen ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!detailOpen}
            inert={!detailOpen}
          >
            <div className="flex flex-col gap-3">
              <HistoryPanelMobile values={values} activeIndex={weekIndex} onChange={onWeekChange} />
              <ImpactPanelMobile impact={impact} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Kartu AQI 393x453 dan panel 605x220 saat kolom isi 1120px (margin 160px di
  // desktop 1440). Saat lebar turun margin menyusut dulu sampai 16px, baru semua
  // widget mengecil bersama lewat FitBox.
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Latar navbar selebar layar, isinya dibatasi kolom 1120px lalu di tengah,
          jadi tepi isi navbar sejajar tepi panel. */}
      <div className="md:[&>header]:px-[max(16px,calc((100%-1120px)/2))]">
        <AppNavbar showBack onBack={goNational} />
      </div>

      {/* Kolom isi dikunci 1120px lalu di tengah, jadi margin kanan kiri 160px di
          desktop 1440 dan cuma margin itu yang berubah. Di bawah 1152px margin
          mentok 16px, panel ikut sempit. */}
      <div className="flex h-full flex-col px-4 pb-[50px] pt-[109px]">
        <div className="mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col">
          {/* Info AQI menempel di kanan atas, menyusut mengikuti sisa tinggi. */}
          <div className="flex min-h-0 flex-1 items-start justify-end pb-3">
            {/* Lebar 35.07% kolom = 393px saat kolom 1120px, dan ikut menyusut
                sebanding panel bawah begitu kolom lebih sempit. */}
            <FitBox width={393} height={453} align="right" valign="top" className="w-[35.07%] max-w-[393px] max-h-full">
              <InfoCard {...info} poskoActive={poskoActive} onTogglePosko={togglePosko} />
            </FitBox>
          </div>

          {/* Histori dan luas area terbakar satu baris, lebarnya berhenti di ukuran desain. */}
          <div className="flex shrink-0 gap-[2.2%]">
            <FitBox width={605} height={220} className="flex-1">
              <HistoryPanel values={values} activeIndex={weekIndex} onChange={onWeekChange} />
            </FitBox>
            <FitBox width={605} height={220} className="flex-1">
              <ImpactPanel impact={impact} />
            </FitBox>
          </div>
        </div>
      </div>
    </div>
  )
}

interface InfoCardData {
  readonly line1: string
  readonly line2: string
  readonly date: string
  readonly aqi: number
  readonly category: string
  readonly categoryColor: string
  readonly poskoActive: boolean
  readonly onTogglePosko: () => void
}

// Kategori di atas SEDANG pakai teks gradasi terang, AMAN dan SEDANG teks gelap.
const isDarkText = (category: string) => category === 'AMAN' || category === 'SEDANG'

function Gauge({ aqi, color }: { readonly aqi: number; readonly color: string }) {
  // Knob duduk tepat di atas busur: 0 di kiri, AQI_MAX di kanan.
  const angle = Math.PI * (1 - Math.min(Math.max(aqi / AQI_MAX, 0), 0.96))

  return (
    <div className="absolute left-[69px] top-[163px] h-[160px] w-[256px]">
      <img src={gaugeArc} alt="" className="absolute inset-x-0 top-0 w-full" />
      <div
        className="absolute size-[30px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[7px] bg-gradient-to-b from-[#f1f1f1] to-[#dfffe6]"
        style={{
          borderColor: color,
          left: 128 + GAUGE_R * Math.cos(angle),
          top: 128 - GAUGE_R * Math.sin(angle),
        }}
      />
    </div>
  )
}

// Switch Posko Medis, desain Figma node 291:16880 (default) dan 291:16963 (aktif).
function PoskoToggle({ active, onClick }: { readonly active: boolean; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className="absolute inset-x-0 top-[396px] flex cursor-pointer items-center justify-between px-[19px] font-nav text-[18px] font-medium"
    >
      <span>Posko Medis</span>
      <span className={`relative h-5 w-11 rounded-[5px] ${active ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-[#c2c2c2]'}`}>
        <span className={`absolute top-0.5 size-4 rounded bg-white ${active ? 'right-0.5' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

// Ukuran kartu dari Figma (393x453), sekarang mengikuti lebar kontainer lewat FitBox.
function InfoCard({ line1, line2, date, aqi, category, categoryColor, poskoActive, onTogglePosko }: InfoCardData) {
  return (
    <section className="pointer-events-auto relative h-full w-full rounded-[6px] bg-gradient-to-b from-[#f1f1f1] to-[#ffefee] text-ink shadow-card">
      <h1 className="absolute inset-x-0 top-[26px] text-center font-heading text-[36px] font-semibold leading-[40px] tracking-[-0.72px]">
        {line1}
        <br />
        {line2}
      </h1>

      <div className="absolute left-1/2 top-[118px] h-[32px] w-[249px] -translate-x-1/2 rounded-[6px] border-[0.5px] border-green-500/50 bg-gradient-to-b from-[#f1f1f1] to-[#ebebeb] text-center font-nav text-[18px] font-medium leading-[31px]">
        {date}
      </div>

      <Gauge aqi={aqi} color={categoryColor} />

      <div className="absolute left-1/2 top-[241px] w-[208px] -translate-x-1/2 text-center font-heading text-[64px] font-medium leading-none tracking-[-1.28px]">
        {aqi}
      </div>
      <div className="absolute inset-x-0 top-[298px] text-center font-nav text-[18px] font-medium">AQI</div>

      <div
        className="absolute left-1/2 top-[333px] flex h-[36px] w-[208px] -translate-x-1/2 items-center justify-center rounded-[6px] font-nav text-[18px] font-bold"
        style={{ backgroundColor: categoryColor }}
      >
        <span className={isDarkText(category) ? 'text-[#1b1b1b]' : 'bg-gradient-to-b from-[#f1f1f1] to-[#dfffe6] bg-clip-text text-transparent'}>
          {category}
        </span>
      </div>

      <PoskoToggle active={poskoActive} onClick={onTogglePosko} />
    </section>
  )
}

interface HistoryPanelProps {
  readonly values: readonly number[]
  readonly activeIndex: number
  readonly onChange: (index: number) => void
}

// Kurva halus (Catmull-Rom ke Bezier) supaya garis tidak kaku.
function smoothPath(xs: number[], ys: number[]) {
  let d = `M ${xs[0]} ${ys[0]}`
  for (let i = 0; i < xs.length - 1; i += 1) {
    const x0 = xs[i - 1] ?? xs[i]
    const y0 = ys[i - 1] ?? ys[i]
    const x1 = xs[i]
    const y1 = ys[i]
    const x2 = xs[i + 1]
    const y2 = ys[i + 1]
    const x3 = xs[i + 2] ?? x2
    const y3 = ys[i + 2] ?? y2
    d += ` C ${x1 + (x2 - x0) / 6} ${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6} ${y2 - (y3 - y1) / 6} ${x2} ${y2}`
  }
  return d
}

// y kurva di indeks pecahan. Kontrol cubic sama dengan smoothPath, jadi titiknya
// menempel di garis yang digambar, bukan di tali busur antar titik data.
function yOnCurve(ys: number[], value: number) {
  const last = ys.length - 1
  if (last < 1) return ys[0] ?? 0
  const i = Math.min(Math.floor(value), last - 1)
  const t = value - i
  const y0 = ys[i - 1] ?? ys[i]
  const y1 = ys[i]
  const y2 = ys[i + 1]
  const y3 = ys[i + 2] ?? y2
  const c1 = y1 + (y2 - y0) / 6
  const c2 = y2 - (y3 - y1) / 6
  const u = 1 - t
  return u * u * u * y1 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * y2
}

function HistoryPanel({ values, activeIndex, onChange }: HistoryPanelProps) {
  const gradientId = useId()
  const max = Math.max(...values, 1)
  const step = CHART_W / Math.max(values.length - 1, 1)
  const xs = values.map((_, index) => index * step)
  const ys = values.map((value) => CHART_H - (value / max) * (CHART_H - 8))
  const curve = smoothPath(xs, ys)

  // Selama digeser, knob mengikuti nilai pecahan slider supaya geraknya mengikuti
  // pointer. Saat dilepas, posisinya kembali ke titik data yang sudah dibulatkan.
  const [dragValue, setDragValue] = useState<number | null>(null)
  const position = dragValue ?? activeIndex
  const dragging = dragValue !== null
  const knobX = position * step
  const knobY = yOnCurve(ys, position)
  // Saat digeser knob harus menempel pointer tanpa jeda, jadi transisi dimatikan.
  const knobTransition = dragging ? '' : 'transition-transform duration-150 ease-out motion-reduce:transition-none'

  return (
    <section className="pointer-events-auto relative h-full w-full rounded-[6px] bg-gradient-to-b from-[#f1f1f1] to-green-200 text-ink shadow-card">
      <h2 className="absolute left-[20px] top-[18px] font-nav text-[18px] font-medium text-gray-500">Histori Area Api</h2>

      <div className="absolute left-[30px] top-[74.5px]" style={{ width: CHART_W, height: CHART_H }}>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" className="absolute inset-0 size-full">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.25" stopColor="#ff0000" stopOpacity="0.9" />
              <stop offset="0.41" stopColor="#ff9d00" stopOpacity="0.75" />
              <stop offset="0.59" stopColor="#e4e421" stopOpacity="0.5" />
              <stop offset="0.75" stopColor="#61e255" stopOpacity="0" />
            </linearGradient>
          </defs>
          {xs.map((x) => (
            <line key={x} x1={x} y1={0} x2={x} y2={CHART_H} stroke="#909090" strokeWidth={1} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={`${curve} L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`} fill={`url(#${gradientId})`} fillOpacity="0.2" />
          <path d={curve} fill="none" stroke="#1b1b1b" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Knob: lingkaran bulat di titik data, batang turun sampai dasar diagram
            (tidak melewati dasar node 291:16797). Keduanya digeser lewat transform
            dengan transisi supaya perpindahan antar langkah slider mengalir, bukan
            melompat. */}
        <span
          className={`pointer-events-none absolute left-0 top-0 h-full w-[2px] origin-bottom rounded-full bg-[#1b1b1b] ${knobTransition}`}
          style={{
            transform: `translateX(${knobX - 1}px) scaleY(${Math.max(CHART_H - knobY, 0) / CHART_H})`,
          }}
        />
        <span
          className={`pointer-events-none absolute left-0 top-0 size-[22px] rounded-full border-[3px] border-[#ebd118] bg-gradient-to-b from-[#f1f1f1] to-[#dfffe6] ${knobTransition}`}
          style={{ transform: `translate(-50%, -50%) translate(${knobX}px, ${knobY}px)` }}
        />

        <input
          type="range"
          min={0}
          max={values.length - 1}
          step={0.001}
          value={position}
          onChange={(event) => {
            const value = Number(event.target.value)
            setDragValue(value)
            // Panggil induk hanya saat minggu benar-benar berubah, bukan tiap piksel.
            const rounded = Math.round(value)
            if (rounded !== activeIndex) onChange(rounded)
          }}
          onPointerUp={() => setDragValue(null)}
          onPointerCancel={() => setDragValue(null)}
          onKeyUp={() => setDragValue(null)}
          onBlur={() => setDragValue(null)}
          // step kecil membuat tombol panah hampir tak bergerak; paksa satu langkah penuh.
          onKeyDown={(event) => {
            const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1
              : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1
                : 0
            if (!delta) return
            event.preventDefault()
            onChange(Math.min(Math.max(activeIndex + delta, 0), values.length - 1))
          }}
          className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
          aria-label="Pilih tanggal histori area api"
        />
      </div>

      {hotspotWeeks.map((week, index) => (
        <span
          key={week.dateIso}
          className="absolute top-[188px] -translate-x-1/2 font-nav text-[14px] text-ink"
          style={{ left: 30 + index * (CHART_W / (hotspotWeeks.length - 1)) }}
        >
          {week.dateShort}
        </span>
      ))}

      <div
        className="absolute right-[22px] top-[60px] h-[120px] w-[10px] rounded-[6px] border-2 border-[#f1f1f1]"
        style={{ backgroundImage: 'linear-gradient(180deg, rgb(255,0,0) 25%, rgb(255,157,0) 41%, rgb(228,228,33) 59%, rgb(97,226,85) 75%)' }}
        aria-hidden="true"
      />
    </section>
  )
}

interface ImpactData {
  readonly burnedHa: number
  readonly weekLabel: string
  readonly pm25: number
  readonly ispaCases: number
}

// Luas DKI Jakarta 661,5 km2 = 66.150 hektar, acuan pembanding di desain.
const DKI_HA = 66150
const number = new Intl.NumberFormat('id-ID')

function ImpactPanel({ impact }: { readonly impact: ImpactData }) {
  const jakarta = Math.max(impact.burnedHa / DKI_HA, 0)
  // Satu ikon mewakili satu kali luas DKI Jakarta, dibulatkan sama dengan teks.
  // Dibatasi 3 supaya muat di kolom kiri.
  const mapIcons = Math.min(Math.max(Math.round(jakarta), 1), 3)
  // Satu ikon orang mewakili 15.000 estimasi kasus, dibatasi 12 (dua baris grid).
  const personIcons = Math.min(Math.ceil(impact.ispaCases / 15000), 12)
  return (
    <section className="pointer-events-auto relative h-full w-full overflow-hidden rounded-[6px] bg-gradient-to-b from-[#f1f1f1] to-green-200 text-ink shadow-card">
      <div className="absolute left-[20px] top-[18px] w-[280px]">
        <h2 className="font-nav text-[18px] font-medium text-gray-500">Luas Area Terbakar</h2>
        <div className="mt-[10px] whitespace-nowrap font-heading text-[36px] font-semibold leading-[40px]">
          {number.format(impact.burnedHa)} <span className="font-nav text-[20px] font-medium">hektar</span>
        </div>
        <p className="mt-[2px] font-nav text-[18px]">
          {jakarta < 1
            ? `= ${jakarta < 0.01 ? '<1' : Math.round(jakarta * 100)}% luas wilayah DKI Jakarta`
            : `= ${number.format(Math.round(jakarta))}x luas wilayah DKI Jakarta`}
        </p>
        <p className="mt-[2px] font-nav text-[13px] text-gray-500">Minggu {impact.weekLabel}, NASA FIRMS</p>
      </div>

      <div className="absolute left-[323px] top-[18px] w-[262px] border-l border-[#909090] pl-[18px]">
        <h2 className="font-nav text-[18px] font-medium text-gray-500">Dampak Kesehatan</h2>
        <div className="mt-[10px] whitespace-nowrap font-heading text-[36px] font-semibold leading-[40px]">
          {number.format(impact.ispaCases)} <span className="font-nav text-[20px] font-medium">orang</span>
        </div>
        <p className="mt-[2px] font-nav text-[18px]">
          {impact.pm25 > 0 ? 'Estimasi tambahan ISPA' : 'Data PM2.5 belum tersedia'}
        </p>
        <p className="mt-[2px] font-nav text-[11px] text-gray-500">
          {impact.pm25 > 0 ? `PM2.5 ${number.format(impact.pm25)} µg/m³ · 1 ikon = 15.000 kasus` : ''}
        </p>
      </div>

      {/* Ikon menempel di bawah teks, bukan di dasar panel, supaya tidak ada rongga saat ikon sedikit. */}
      <div className="absolute left-[20px] top-[150px] flex gap-5" aria-hidden="true">
        {Array.from({ length: mapIcons }).map((_, index) => (
          <img key={index} src={areaBurnedIcon} alt="" className="h-[52px] w-[59px]" />
        ))}
      </div>
      <div className="absolute left-[341px] top-[150px] flex max-w-[244px] flex-wrap gap-1" aria-hidden="true">
        {Array.from({ length: personIcons }).map((_, index) => {
          const icons = [personA, personB, personC]
          return <img key={index} src={icons[index % icons.length]} alt="" className="size-[28px]" />
        })}
      </div>
    </section>
  )
}

function HistoryPanelMobile({ values, activeIndex, onChange }: HistoryPanelProps) {
  const max = Math.max(...values, 1)

  return (
    <section className="relative h-[170px] w-full shrink-0 rounded-[6px] bg-gradient-to-b from-[#f1f1f1] to-green-200 px-4 pb-3 pt-3 text-ink shadow-card">
      <h2 className="font-nav text-[14px] font-medium text-gray-500">Histori Area Api</h2>
      <div className="mt-3 flex h-[70px] items-end gap-1">
        {values.map((value, index) => (
          <button
            key={hotspotWeeks[index]?.dateIso}
            type="button"
            onClick={() => onChange(index)}
            aria-label={`Pilih ${hotspotWeeks[index]?.dateShort}`}
            className="flex-1 cursor-pointer rounded-t-[2px] bg-ink/80"
            style={{ height: `${Math.max((value / max) * 100, 4)}%`, opacity: index === activeIndex ? 1 : 0.4 }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-nav text-[10px] text-ink">
        {hotspotWeeks.map((week) => <span key={week.dateIso}>{week.dateShort}</span>)}
      </div>
    </section>
  )
}

function ImpactPanelMobile({ impact }: { readonly impact: ImpactData }) {
  const jakarta = Math.max(impact.burnedHa / DKI_HA, 0)
  return (
    <section className="relative w-full shrink-0 rounded-[6px] bg-gradient-to-b from-[#f1f1f1] to-green-200 px-4 pb-3 pt-3 text-ink shadow-card">
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <h2 className="font-nav text-[14px] font-medium text-gray-500">Luas Area Terbakar</h2>
          <div className="mt-1 font-heading text-[20px] font-semibold leading-tight">
            {number.format(impact.burnedHa)} <span className="font-nav text-[12px] font-medium">hektar</span>
          </div>
          <p className="mt-1 font-nav text-[12px]">
            {jakarta < 1
              ? `= ${jakarta < 0.01 ? '<1' : Math.round(jakarta * 100)}% luas DKI Jakarta`
              : `= ${number.format(Math.round(jakarta))}x luas DKI Jakarta`}
          </p>
          <p className="mt-1 font-nav text-[11px] text-gray-500">Minggu {impact.weekLabel}, NASA FIRMS</p>
        </div>
        <div className="min-w-0 border-l border-[#909090] pl-3">
          <h2 className="font-nav text-[14px] font-medium text-gray-500">Dampak Kesehatan</h2>
          <div className="mt-1 font-heading text-[20px] font-semibold leading-tight">
            {number.format(impact.ispaCases)} <span className="font-nav text-[12px] font-medium">orang</span>
          </div>
          <p className="mt-1 font-nav text-[12px]">{impact.pm25 > 0 ? 'Estimasi tambahan ISPA' : 'Data PM2.5 belum tersedia'}</p>
          {impact.pm25 > 0 && (
            <p className="mt-1 font-nav text-[11px] text-gray-500">PM2.5 {number.format(impact.pm25)} µg/m³</p>
          )}
        </div>
      </div>
    </section>
  )
}