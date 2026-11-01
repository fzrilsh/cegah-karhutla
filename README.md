# Cegah Karhutla

Platform web interaktif yang menyajikan data kebakaran hutan dan lahan (karhutla) di Kalimantan secara visual, mulai dari titik api, kualitas udara, hingga arah sebaran asap. Dibuat untuk Web In Action (WIA) MIA 2026.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Motion (Framer Motion) dengan `LazyMotion`
- React Router 8
- pnpm

## Instalasi dan Menjalankan

Prasyarat: Node.js 22 atau lebih baru dan pnpm 10.

```bash
pnpm install
pnpm dev
```

Aplikasi berjalan di `http://localhost:5173`.

Perintah lain:

```bash
pnpm build     # type check dan build produksi
pnpm preview   # preview hasil build
pnpm lint      # oxlint
```

## Status Progres

- [x] Skeleton front-end (routing, Tailwind, Motion, font)
- [x] Slicing landing page dari Figma (navbar, toggle, search, support buttons, peta interaktif)
- [x] Halaman provinsi (Kalimantan Barat: kartu telemetri AQI dan PM2.5, titik api dinamis, toggle)
- [x] Timeline slider (linimasa mingguan 13 Sep sampai 25 Okt 2026, 91 ticks, knob dinamis)
- [ ] Simulasi arah asap
- [ ] Peta HGU korporasi (data dummy)
- [ ] Navigasi posko dan lapor titik api
- [ ] Komparator luas

## Catatan

Seluruh nama korporasi pada data HGU adalah nama dummy (PT ABC, PT XYZ).
