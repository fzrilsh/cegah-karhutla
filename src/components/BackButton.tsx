import { useMapTransition } from '@/lib/map-transition'
import arrowBack from '@/assets/icons/arrow-back.svg'

interface BackButtonProps {
  readonly to?: string
  readonly className?: string
}

export function BackButton({ className }: BackButtonProps) {
  const { goLanding } = useMapTransition()

  return (
    <button
      type="button"
      onClick={goLanding}
      className={`flex size-[60px] items-center justify-center rounded-[10px] bg-paper transition-colors hover:bg-paper-2 ${
        className ?? ''
      }`}
      aria-label="Kembali ke halaman utama"
    >
      <img src={arrowBack} alt="" className="size-[24px] rotate-90" />
    </button>
  )
}
