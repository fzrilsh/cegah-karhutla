import type { WeeklyMetric } from '@/data/kalbar-weekly-metrics'
import gasMaskIcon from '@/assets/icons/gas-mask.svg'

interface InfoCardProps {
  readonly provinceName: string
  readonly metric: WeeklyMetric
  readonly onDetailClick?: () => void
  readonly className?: string
}

export function InfoCard({
  provinceName,
  metric,
  onDetailClick,
  className,
}: InfoCardProps) {
  const parts = provinceName.split(' ')
  const line1 = parts[0] ?? provinceName
  const line2 = parts.slice(1).join(' ')

  const badgeBg = metric.isHazardous ? 'bg-danger-strong' : 'bg-navy-700'

  return (
    <div
      className={`relative h-[288px] w-[434px] overflow-hidden rounded-[10px] border border-navy-700 bg-paper shadow-glow select-none ${
        className ?? ''
      }`}
    >
      {/* Right Warning Badge Block (188x188 at x 226, y 20) */}
      <div
        className={`absolute left-[226px] top-[20px] flex size-[188px] flex-col items-center justify-between rounded-[10px] p-4 ${badgeBg}`}
      >
        <div className="flex size-[115px] items-center justify-center pt-2">
          <img
            src={gasMaskIcon}
            alt=""
            className="size-[100px] object-contain drop-shadow-md"
          />
        </div>
        <div className="font-sans text-[20px] font-extrabold uppercase tracking-wide text-on-danger">
          {metric.category}
        </div>
      </div>

      {/* Left Info Column */}
      <div className="absolute left-[20px] top-[20px] flex flex-col">
        {/* Province Name (2 lines, 32px) */}
        <h2 className="font-display text-[32px] leading-[32px] text-ink">
          {line1}
          {line2 && <br />}
          {line2}
        </h2>

        {/* Date */}
        <p className="mt-[14px] font-display text-[12px] text-ink">
          {metric.dateFull}
        </p>

        {/* Metric Rows */}
        <div className="mt-[16px] flex flex-col gap-[8px] font-sans text-[14px] font-semibold text-ink">
          <div className="flex items-center">
            <span className="w-[118px]">AQI+ US</span>
            <span>{metric.aqi}</span>
          </div>
          <div className="flex items-center">
            <span className="w-[118px]">Polutan</span>
            <span>PM2.5</span>
          </div>
          <div className="flex items-center">
            <span className="w-[118px]">Jarak Pandang</span>
            <span>{metric.visibility}</span>
          </div>
        </div>
      </div>

      {/* Bottom Button: Informasi Detail */}
      <button
        type="button"
        onClick={onDetailClick}
        className="absolute left-[20px] top-[228px] flex h-[40px] w-[394px] cursor-pointer items-center justify-center rounded-[10px] border border-navy-700 bg-linear-to-r from-navy-800 to-navy-700 font-display text-[16px] text-paper shadow-glow transition-all hover:brightness-110 active:translate-y-[1px]"
      >
        Informasi Detail
      </button>
    </div>
  )
}
