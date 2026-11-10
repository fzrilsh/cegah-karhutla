# Cegah Karhutla

Platform web interaktif yang menyajikan data kebakaran hutan dan lahan (karhutla) di wilayah rawan bencana di Indonesia (khususnya Kalimantan dan Sumatera) secara visual, mulai dari titik api, kualitas udara, hingga arah sebaran asap. Dibuat untuk Web In Action (WIA) MIA 2026.

Live Demo: https://fzrilsh.github.io/cegah-karhutla/

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
pnpm test      # tes parser dan data (node --test)
```

## Status Progres

### Sudah jalan

- [x] Skeleton front-end (routing, Tailwind, Motion, font) dan deploy otomatis ke GitHub Pages
- [x] Landing page desain baru: navbar, hero, kartu peta nasional, blok tiga fitur, responsif sampai 320px
- [x] Pencarian provinsi di navbar (38 provinsi, dropdown, Enter untuk membuka hasil pertama)
- [x] Modal Warga Lapor: pilihan kategori, unggah foto, lokasi GPS otomatis, animasi sukses. Belum mengirim data ke server
- [x] Peta nasional MapLibre: basemap hijau hasil restyle, boundary 38 provinsi, bubble nama provinsi, tombol zoom dan recenter, kamera dikunci saat masuk halaman detail
- [x] Heatmap titik api NASA FIRMS seluruh provinsi. Data runtime dari Area CSV API (VIIRS NOAA-21 dan MODIS NRT, 5 hari terakhir), diagregasi per sel 0,02 derajat, cache localStorage TTL 1 jam. Snapshot `heat-cells.json` dipakai kalau fetch gagal
- [x] Halaman detail provinsi: kartu AQI dengan gauge, status kategori, slider histori area api, panel luas area terbakar dan dampak kesehatan
- [x] Slider mingguan di halaman provinsi (7 minggu, knob mengikuti kursor, bisa digeser dengan keyboard)

### Belum

- [ ] Data asli per provinsi. AQI, PM2.5, dan jumlah titik api masih placeholder `provinceWeeklyMetrics` (baru 8 provinsi, sisanya memakai data Kalimantan Barat). Angka luas area terbakar dan dampak kesehatan masih statis
- [ ] Integrasi Open-Meteo saat runtime (`src/lib/open-meteo.ts` sudah ada dan teruji, belum dipakai komponen)
- [ ] Simulasi arah sebaran asap (komponen `Toggle` ada, belum dipakai)
- [ ] Peta HGU korporasi (data dummy)
- [ ] Navigasi posko medis (tombol masih memicu event yang belum ditangani)
- [ ] Komparator luas
- [ ] Mode hemat data
- [ ] Uji otomatis untuk komponen UI (baru 14 tes parser dan data, semua lulus)
- [ ] Cek render peta WebGL di browser biasa (headless tidak menjalankan WebGL dengan baik)

## Catatan

Seluruh nama korporasi pada data HGU adalah nama dummy (PT ABC, PT XYZ).
