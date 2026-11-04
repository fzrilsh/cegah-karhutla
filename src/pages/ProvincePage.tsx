import { useState } from 'react'
import { findProvince } from '@/data/provinces'
import { Navbar } from '@/components/Navbar'
import { Toggle, type MapLayerMode } from '@/components/Toggle'
import { Search } from '@/components/Search'
import { BackButton } from '@/components/BackButton'
import { SupportButtons } from '@/components/SupportButtons'
import { InfoCard } from '@/components/InfoCard'
import { TimelineSlider } from '@/components/TimelineSlider'
import { MobileTopBar } from '@/components/MobileTopBar'
import { BottomSheet } from '@/components/BottomSheet'
import { ScaleToFit } from '@/components/ScaleToFit'
import { useMobile } from '@/hooks/use-mobile'
import { useUiScale } from '@/hooks/use-ui-scale'
import { Scaled } from '@/components/Scaled'
import { provinceWeeklyMetrics, DEFAULT_WEEK_INDEX } from '@/data/weekly-metrics'
import gasMaskIcon from '@/assets/icons/gas-mask.svg'

interface ProvincePageProps {
  readonly slug?: string
  readonly weekIndex: number
  readonly onWeekChange: (index: number) => void
}

export function ProvincePage({ slug, weekIndex, onWeekChange }: ProvincePageProps) {
  const isMobile = useMobile()
  const ui = useUiScale()
  const province = findProvince(slug)

  const [mode, setMode] = useState<MapLayerMode>('fire')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [sheetHeight, setSheetHeight] = useState(172)

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const weeklyMetrics =
    (slug ? provinceWeeklyMetrics[slug] : undefined) ??
    provinceWeeklyMetrics['kalimantan-barat']
  const currentMetric = weeklyMetrics[weekIndex] ?? weeklyMetrics[DEFAULT_WEEK_INDEX]

  const provinceName = province ? province.name : 'Provinsi'

  // Halaman provinsi versi HP
  if (isMobile) {
    return (
      <div className="pointer-events-none absolute inset-0 select-none">
        <MobileTopBar variant="back" currentProvinceSlug={slug} className="pointer-events-auto" />

        {/* Toggle lapisan */}
        <div className="pointer-events-auto absolute inset-x-3 top-[72px] z-30">
          <div className="flex h-[44px] w-full items-center rounded-[12px] border border-navy-700 bg-linear-to-r from-navy-800 to-navy-700 p-1 shadow-glow select-none">
            {(['fire', 'smoke'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`h-[36px] min-w-0 flex-1 cursor-pointer truncate whitespace-nowrap rounded-[8px] px-2 font-display text-[14px] transition-colors ${
                  mode === value ? 'bg-paper text-ink' : 'text-paper-2'
                }`}
              >
                {value === 'fire' ? 'Titik Api' : 'Arah Asap'}
              </button>
            ))}
          </div>
        </div>

        {/* Ringkasan melayang, menempel di atas lembar bawah dan hilang saat lembar terbuka */}
        <div
          style={{
            bottom: `calc(${sheetHeight}px + 8px + env(safe-area-inset-bottom))`,
            opacity: sheetHeight > 200 ? 0 : 1,
            transition: 'opacity 0.2s ease-out',
            visibility: sheetHeight > 200 ? 'hidden' : 'visible',
          }}
          className="pointer-events-none absolute inset-x-3 z-30"
        >
          <div className="flex items-center gap-3 rounded-[12px] border border-navy-700 bg-paper/95 px-4 py-3 shadow-glow">
            <div
              className={`flex size-[44px] shrink-0 items-center justify-center rounded-[10px] ${
                currentMetric.isHazardous ? 'bg-danger-strong' : 'bg-navy-700'
              }`}
            >
              <img src={gasMaskIcon} alt="" className="size-[30px] object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-[16px] leading-tight text-ink">
                {provinceName}
              </p>
              <p className="truncate font-sans text-[12px] font-semibold text-ink/80">
                {currentMetric.dateShort} · AQI {currentMetric.aqi} · {currentMetric.visibility}
              </p>
            </div>
          </div>
        </div>

        {/* Lembar bawah: kartu lengkap dan slider */}
        <BottomSheet
          collapsedHeight={172}
          className="pointer-events-auto"
          onHeightChange={setSheetHeight}
        >
          <div className="flex flex-col gap-3 overflow-y-auto pb-2" style={{ maxHeight: '100%' }}>
            <ScaleToFit designWidth={434} designHeight={288}>
              <InfoCard
                provinceName={provinceName}
                metric={currentMetric}
                onDetailClick={() =>
                  showToast(
                    `Detail ${currentMetric.dateShort}: AQI ${currentMetric.aqi}, PM2.5 ${currentMetric.pm25} ug/m3.`,
                  )
                }
              />
            </ScaleToFit>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  showToast('Mencari posko kesehatan oksigen terdekat di ' + provinceName + '.')
                }
                className="flex h-[48px] min-w-0 flex-1 cursor-pointer items-center justify-center truncate whitespace-nowrap rounded-[12px] border border-navy-700 bg-paper px-2 font-display text-[14px] text-ink shadow-glow transition-transform active:scale-[0.98]"
              >
                Posko Kesehatan
              </button>
              <button
                type="button"
                onClick={() =>
                  showToast('Formulir pelaporan titik api karhutla ' + provinceName + ' dibuka.')
                }
                className="flex h-[48px] min-w-0 flex-1 cursor-pointer items-center justify-center truncate whitespace-nowrap rounded-[12px] border border-navy-700 bg-paper px-2 font-display text-[14px] text-ink shadow-glow transition-transform active:scale-[0.98]"
              >
                Lapor Titik Api
              </button>
            </div>

            <TimelineSlider
              metrics={weeklyMetrics}
              activeIndex={weekIndex}
              onChange={onWeekChange}
              compact
            />
          </div>
        </BottomSheet>

        {toastMessage && (
          <div className="pointer-events-auto absolute left-1/2 top-[132px] z-50 w-max max-w-[90vw] -translate-x-1/2 rounded-[12px] border border-navy-700 bg-navy-800/95 px-5 py-3 text-center font-display text-[14px] text-paper shadow-glow backdrop-blur-md">
            {toastMessage}
          </div>
        )}
      </div>
    )
  }

  // Halaman provinsi versi desktop/tablet fluid
  const marginX = 'max(16px, 3.47vw)'
  const marginTop = 'max(12px, 4.88vh)'

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* Baris atas */}
      <div
        style={{ left: marginX, right: marginX, top: marginTop }}
        className="absolute z-20 flex items-start justify-between gap-4"
      >
        <Scaled scale={ui} width={433} height={60} className="pointer-events-auto">
          <Navbar />
        </Scaled>
        <Scaled scale={ui} width={434} height={60} className="pointer-events-auto">
          <Toggle mode={mode} onChange={setMode} />
        </Scaled>
        <Scaled scale={ui} width={434} height={60} className="pointer-events-auto">
          <Search currentProvinceSlug={slug} />
        </Scaled>
      </div>

      {/* Tombol kembali */}
      <div
        style={{ left: marginX, top: `calc(${marginTop} + ${60 * ui + 16}px)` }}
        className="pointer-events-auto absolute z-20"
      >
        <Scaled scale={ui} width={60} height={60}>
          <BackButton to="/" />
        </Scaled>
      </div>

      {/* Kolom kanan: kartu info + tombol aksi (z lebih rendah dari baris atas) */}
      <div
        style={{ right: marginX, top: `calc(${marginTop} + ${60 * ui + 16}px)` }}
        className="pointer-events-auto absolute z-10 flex flex-col gap-4"
      >
        <Scaled scale={ui} width={434} height={288}>
          <InfoCard
            provinceName={provinceName}
            metric={currentMetric}
            onDetailClick={() =>
              showToast(
                `Detail ${currentMetric.dateShort}: AQI ${currentMetric.aqi}, PM2.5 ${currentMetric.pm25} ug/m3.`,
              )
            }
          />
        </Scaled>
        <Scaled scale={ui} width={434} height={60}>
          <SupportButtons
            onHealthPostClick={() =>
              showToast('Mencari posko kesehatan oksigen terdekat di ' + provinceName + '.')
            }
            onReportFireClick={() =>
              showToast('Formulir pelaporan titik api karhutla ' + provinceName + ' dibuka.')
            }
          />
        </Scaled>
      </div>

      {/* Slider linimasa nempel di bawah */}
      <div
        style={{ left: marginX, right: marginX, bottom: 'max(12px, 4.88vh)' }}
        className="pointer-events-auto absolute z-20"
      >
        <TimelineSlider
          metrics={weeklyMetrics}
          activeIndex={weekIndex}
          onChange={onWeekChange}
        />
      </div>

      {toastMessage && (
        <div className="pointer-events-auto absolute bottom-[22vh] left-1/2 z-50 -translate-x-1/2 rounded-[10px] border border-navy-700 bg-navy-800/95 px-6 py-3 font-display text-[16px] text-paper shadow-glow backdrop-blur-md">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
