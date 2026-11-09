import { AppNavbar } from '@/components/AppNavbar'
import { MapActionButtons } from '@/components/MapActionButtons'

// Latar transparan: peta MapLibre di SharedMap yang tampil, bukan gambar.
export function NationalMapPage() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <AppNavbar showBack />
      <MapActionButtons />
    </div>
  )
}