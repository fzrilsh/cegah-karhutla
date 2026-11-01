interface SupportButtonsProps {
  readonly onHealthPostClick?: () => void
  readonly onReportFireClick?: () => void
  readonly className?: string
}

export function SupportButtons({
  onHealthPostClick,
  onReportFireClick,
  className,
}: SupportButtonsProps) {
  return (
    <div className={`flex h-[60px] w-[434px] items-center gap-[20px] select-none ${className ?? ''}`}>
      <button
        type="button"
        onClick={onHealthPostClick}
        className="flex h-[60px] w-[207px] cursor-pointer items-center justify-center rounded-[10px] border border-navy-700 bg-paper font-display text-[20px] text-ink shadow-glow transition-colors hover:bg-paper-2 active:translate-y-[1px]"
      >
        Posko Kesehatan
      </button>
      <button
        type="button"
        onClick={onReportFireClick}
        className="flex h-[60px] w-[207px] cursor-pointer items-center justify-center rounded-[10px] border border-navy-700 bg-paper font-display text-[20px] text-ink shadow-glow transition-colors hover:bg-paper-2 active:translate-y-[1px]"
      >
        Lapor Titik Api
      </button>
    </div>
  )
}
