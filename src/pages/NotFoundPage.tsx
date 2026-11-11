import { useMapTransition } from '@/lib/map-transition'

export function NotFoundPage() {
  const { goNational } = useMapTransition()

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-green-900 px-6 text-center">
      <p className="font-logo text-[64px] leading-none text-orange-500">404</p>
      <h1 className="font-heading text-[24px] font-semibold text-white">Halaman tidak ditemukan</h1>
      <p className="max-w-[420px] font-heading text-[15px] leading-[26px] text-[#b4c1c1]">
        Alamat ini tidak ada. Kembali ke peta untuk memilih provinsi.
      </p>
      <button
        type="button"
        onClick={() => goNational()}
        className="flex h-14 cursor-pointer items-center justify-center rounded-[6px] bg-linear-to-r from-green-500 to-green-600 px-8 font-nav text-[17px] font-medium text-white transition-transform hover:brightness-110 active:scale-[0.99]"
      >
        Buka Peta
      </button>
    </div>
  )
}