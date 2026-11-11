import { AppNavbar } from '@/components/AppNavbar'
import { MapActionButtons } from '@/components/MapActionButtons'

// Latar transparan: peta MapLibre di SharedMap yang tampil, bukan gambar.
export function NationalMapPage() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Peta digambar canvas, jadi halaman ini butuh judul teks untuk crawler. */}
      <h1 className="sr-only">Peta Titik Api dan Sebaran Asap Karhutla Indonesia</h1>
      <AppNavbar showBack />
      <MapActionButtons />
    </div>
  )
}