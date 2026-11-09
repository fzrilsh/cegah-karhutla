import { AppNavbar } from '@/components/AppNavbar'
import { useMapTransition } from '@/lib/map-transition'
import heroForest from '@/assets/landing/hero-forest.webp'
import mapHeatmapNasional from '@/assets/landing/map-heatmap-nasional.webp'
import iconShield from '@/assets/landing/icon-shield.svg'
import iconAlert from '@/assets/landing/icon-alert.svg'
import iconHand from '@/assets/landing/icon-hand.svg'

export function LandingPage() {
  const { enterProvince, goNational } = useMapTransition()

  return (
    <div className="pointer-events-auto absolute inset-0 touch-pan-y overflow-y-auto overscroll-y-contain bg-black select-none">
      <AppNavbar />

      {/* Hero 1440x810 */}
      <section className="relative h-[min(810px,100vh)] w-full overflow-hidden">
        <img
          src={heroForest}
          alt="Ilustrasi hutan Kalimantan dengan orangutan dan warga lokal"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/40 to-transparent" />

        <div className="pointer-events-auto absolute left-6 top-[140px] max-w-[560px] md:left-[50px] md:top-[175px]">
          <h1 className="font-heading text-[38px] font-semibold leading-[1.15] tracking-[-1.28px] text-white md:text-[64px] md:leading-[76px]">
            Pantau{' '}
            <span className="font-logo text-[42px] text-orange-500 md:text-[68px]">
              Titik Api
            </span>
            <br />
            di Area Kebakaran
            <br />
            Hutan dan Lahan
          </h1>
          <p className="mt-5 font-heading text-[15px] leading-[28px] tracking-[-0.36px] text-[#b4c1c1] md:text-[18px] md:leading-[32px]">
            Cegah Karhutla adalah website untuk memudahkan masyarakat yang terdampak
            api langsung, terdampak asap, dan yang tidak terdampak untuk memantau
            pergerakan api di area kebakaran hutan dan lahan di Indonesia.
          </p>
          <button
            type="button"
            onClick={() => enterProvince('kalimantan-barat')}
            className="mt-8 flex h-[70px] w-full max-w-[393px] cursor-pointer items-center justify-center rounded-[6px] bg-linear-to-r from-green-500 to-green-600 font-nav text-[20px] font-medium text-white transition-transform hover:brightness-110 active:scale-[0.99]"
          >
            Lihat Titik Api
          </button>
        </div>
      </section>

      {/* Kartu peta nasional */}
      <section className="pointer-events-auto mx-6 mt-10 md:mx-[50px] md:mt-[90px]">
        <button
          type="button"
          onClick={goNational}
          className="relative block w-full cursor-pointer overflow-hidden rounded-[6px] border border-green-500 text-left"
        >
          <img
            src={mapHeatmapNasional}
            alt="Peta panas titik api di Indonesia, Kalimantan paling pekat"
            className="h-[300px] w-full object-cover object-[center_38%] md:h-[450px]"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-6 md:pb-8">
            <span className="flex h-[70px] w-[393px] max-w-[80%] items-center justify-center rounded-[6px] bg-linear-to-r from-green-500 to-green-600 font-nav text-[20px] font-medium text-white">
              Lihat Peta
            </span>
          </div>
        </button>
      </section>

      {/* 3 fitur */}
      <section className="pointer-events-auto mx-6 mb-20 mt-10 max-w-[817px] md:mx-auto md:mt-[100px]">
        <div className="rounded-[6px] border border-green-500/50 bg-linear-to-b from-green-900 to-black p-6 md:p-[30px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-[30px]">
            <div>
              <div className="flex size-[64px] items-center justify-center rounded-full bg-green-500">
                <img src={iconShield} alt="" className="size-[39px]" />
              </div>
              <h3 className="mt-[10px] font-nav text-[20px] font-bold text-white">Cepat Paham</h3>
              <p className="mt-[8px] font-nav text-[16px] leading-[28px] text-[#b4c1c1] md:text-[20px]">
                Mudah paham dampak karhutla.
              </p>
            </div>
            <div>
              <div className="flex size-[64px] items-center justify-center rounded-full bg-green-500">
                <img src={iconAlert} alt="" className="size-[39px]" />
              </div>
              <h3 className="mt-[10px] font-nav text-[20px] font-bold text-white">Cepat Lapor</h3>
              <p className="mt-[8px] font-nav text-[16px] leading-[28px] text-[#b4c1c1] md:text-[20px]">
                Lapor titik api di sekitarmu.
              </p>
            </div>
            <div>
              <div className="flex size-[64px] items-center justify-center rounded-full bg-green-500">
                <img src={iconHand} alt="" className="size-[39px]" />
              </div>
              <h3 className="mt-[10px] font-nav text-[20px] font-bold text-white">Cepat Bantu</h3>
              <p className="mt-[8px] font-nav text-[16px] leading-[28px] text-[#b4c1c1] md:text-[20px]">
                Bantu sesama lebih mudah.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
