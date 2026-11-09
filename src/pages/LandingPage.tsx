import { AppNavbar } from '@/components/AppNavbar'
import { useMapTransition } from '@/lib/map-transition'
import heroForest from '@/assets/landing/hero-forest.webp'
import mapHeatmapNasional from '@/assets/landing/map-heatmap-nasional.webp'
import iconShield from '@/assets/landing/icon-shield.svg'
import iconAlert from '@/assets/landing/icon-alert.svg'
import iconHand from '@/assets/landing/icon-hand.svg'

// Kolom isi semua halaman: margin 16px di layar sempit, menggemuk sampai konten 1120px.
const CONTENT = 'px-4 md:px-[max(16px,calc((100%-1120px)/2))]'

export function LandingPage() {
  const { enterProvince, goNational } = useMapTransition()

  return (
    <div className="pointer-events-auto absolute inset-0 touch-pan-y overflow-y-auto overscroll-y-contain bg-black select-none">
      <AppNavbar />

      <section className={`${CONTENT} pb-16 pt-[108px]`}>
        {/* aspect-video = 16:9, sama dengan rasio asli, jadi gambar tidak terpotong.
            Teks menumpang di atas gambar mulai lg; di bawah lg turun ke bawahnya. */}
        <div className="relative overflow-hidden rounded-[6px]">
          <img
            src={heroForest}
            alt="Ilustrasi hutan Kalimantan dengan orangutan dan warga lokal"
            className="aspect-video w-full object-cover"
          />
          <div className="absolute inset-0 hidden bg-linear-to-r from-black via-black/60 to-transparent lg:block" />

          <div className="pointer-events-auto max-w-[560px] lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2">
            <h1 className="mt-8 font-heading text-[32px] font-semibold leading-[1.15] tracking-[-1.28px] text-white sm:text-[40px] lg:mt-0 lg:text-[64px] lg:leading-[76px]">
              Pantau{' '}
              <span className="font-logo text-[36px] text-orange-500 lg:text-[68px]">
                Titik Api
              </span>
              <br />
              di Area Kebakaran
              <br />
              Hutan dan Lahan
            </h1>
            <p className="mt-5 font-heading text-[15px] leading-[26px] tracking-[-0.36px] text-[#b4c1c1] lg:text-[18px] lg:leading-[32px]">
              Cegah Karhutla adalah website untuk memudahkan masyarakat yang terdampak
              api langsung, terdampak asap, dan yang tidak terdampak untuk memantau
              pergerakan api di area kebakaran hutan dan lahan di Indonesia.
            </p>
            <button
              type="button"
              onClick={() => enterProvince('kalimantan-barat')}
              className="mt-6 flex h-14 w-full max-w-[393px] cursor-pointer items-center justify-center rounded-[6px] bg-linear-to-r from-green-500 to-green-600 font-nav text-[17px] font-medium text-white transition-transform hover:brightness-110 active:scale-[0.99] lg:mt-8 lg:h-[70px] lg:text-[20px]"
            >
              Lihat Titik Api
            </button>
          </div>
        </div>
      </section>

      {/* Kartu peta nasional */}
      <section className={`pointer-events-auto ${CONTENT} mt-8 md:mt-[90px]`}>
        <button
          type="button"
          onClick={goNational}
          className="relative block w-full cursor-pointer overflow-hidden rounded-[6px] border border-green-500 text-left"
        >
          <img
            src={mapHeatmapNasional}
            alt="Peta panas titik api di Indonesia, Kalimantan paling pekat"
            className="h-[220px] w-full object-cover object-[center_38%] sm:h-[300px] md:h-[450px]"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4 md:pb-8">
            <span className="flex h-14 w-[393px] max-w-[80%] items-center justify-center rounded-[6px] bg-linear-to-r from-green-500 to-green-600 font-nav text-[17px] font-medium text-white md:h-[70px] md:text-[20px]">
              Lihat Peta
            </span>
          </div>
        </button>
      </section>

      {/* 3 fitur */}
      <section className={`pointer-events-auto ${CONTENT} mb-12 mt-8 md:mb-20 md:mt-[100px]`}>
        <div className="mx-auto max-w-[817px] rounded-[6px] border border-green-500/50 bg-linear-to-b from-green-900 to-black p-6 md:p-[30px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-[30px]">
            <div className="flex items-center gap-4 md:block">
              <div className="flex size-[56px] shrink-0 items-center justify-center rounded-full bg-green-500 md:size-[64px]">
                <img src={iconShield} alt="" className="size-[34px] md:size-[39px]" />
              </div>
              <div>
                <h3 className="font-nav text-[19px] font-bold text-white md:mt-[10px] md:text-[20px]">Cepat Paham</h3>
                <p className="mt-[4px] font-nav text-[15px] leading-[24px] text-[#b4c1c1] md:mt-[8px] md:text-[20px] md:leading-[28px]">
                  Mudah paham dampak karhutla.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:block">
              <div className="flex size-[56px] shrink-0 items-center justify-center rounded-full bg-green-500 md:size-[64px]">
                <img src={iconAlert} alt="" className="size-[34px] md:size-[39px]" />
              </div>
              <div>
                <h3 className="font-nav text-[19px] font-bold text-white md:mt-[10px] md:text-[20px]">Cepat Lapor</h3>
                <p className="mt-[4px] font-nav text-[15px] leading-[24px] text-[#b4c1c1] md:mt-[8px] md:text-[20px] md:leading-[28px]">
                  Lapor titik api di sekitarmu.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:block">
              <div className="flex size-[56px] shrink-0 items-center justify-center rounded-full bg-green-500 md:size-[64px]">
                <img src={iconHand} alt="" className="size-[34px] md:size-[39px]" />
              </div>
              <div>
                <h3 className="font-nav text-[19px] font-bold text-white md:mt-[10px] md:text-[20px]">Cepat Bantu</h3>
                <p className="mt-[4px] font-nav text-[15px] leading-[24px] text-[#b4c1c1] md:mt-[8px] md:text-[20px] md:leading-[28px]">
                  Bantu sesama lebih mudah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}