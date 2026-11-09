// Tombol zoom + tombol lokasi, sesuai Figma (kanan bawah peta nasional).
export function MapActionButtons() {
  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-30 flex flex-col gap-2 md:bottom-[50px] md:right-[max(16px,calc((100%-1120px)/2))]">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('map-zoom-in'))}
        className="flex size-[50px] cursor-pointer items-center justify-center rounded-[6px] bg-white text-[28px] leading-none text-ink shadow-card transition-transform hover:scale-105 active:scale-95"
        aria-label="Perbesar peta"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('map-zoom-out'))}
        className="flex size-[50px] cursor-pointer items-center justify-center rounded-[6px] bg-white text-[28px] leading-none text-ink shadow-card transition-transform hover:scale-105 active:scale-95"
        aria-label="Perkecil peta"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('map-recenter'))}
        className="mt-2 flex size-[50px] cursor-pointer items-center justify-center rounded-[6px] bg-white text-ink shadow-card transition-transform hover:scale-105 active:scale-95"
        aria-label="Kembali ke posisi awal peta"
      >
        <span className="size-5 rounded-full border-[3px] border-ink" />
        <span className="absolute size-8 rounded-full border-2 border-ink/40" />
      </button>
    </div>
  )
}
