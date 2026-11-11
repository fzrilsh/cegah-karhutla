# Cegah Karhutla

Platform web interaktif yang menyajikan data kebakaran hutan dan lahan (karhutla) di wilayah rawan bencana di Indonesia (khususnya Kalimantan dan Sumatera) secara visual, mulai dari titik api, kualitas udara, hingga arah sebaran asap. Dibuat untuk Web In Action (WIA) MIA 2026.

Live Demo: https://fzrilsh.github.io/cegah-karhutla/

## Tim

Nama tim: Bebas aja nama tim mah

| Nama | NIM | Peran |
| --- | --- | --- |
| Muhammad Hanif Susanto | 2702320450 | UI/UX Designer |
| Fazril Syaveral Hillaby | 2902659922 | Front-end Developer |
| Tony Cung | 2902645255 | Pitch Lead |

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

## Arsitektur

### Rute dan lapisan layar

Tiga rute, semuanya berbagi satu canvas MapLibre yang di-mount sekali dan tidak pernah dilepas:

| Rute | Isi |
| --- | --- |
| `/` | Landing page (overlay penuh, peta di belakang) |
| `/peta` | Peta nasional: heatmap titik api, bubble provinsi, tombol zoom dan recenter |
| `/provinsi/:slug` | Detail provinsi: kartu AQI, grafik histori, panel luas terbakar dan dampak kesehatan, switch Posko Medis |

`App.tsx` merender `SharedMap` (z-10) lalu overlay halaman sesuai rute (z-20). Kamera peta dikendalikan `MapTransitionProvider` (`src/lib/map-transition.tsx`) yang menurunkan posisi kamera dari URL, jadi transisi dan deep link selalu sinkron. Peta tidak di-mount ulang antar rute, jadi posisi kamera bertahan dan animasi tidak terputus.

Splash screen hanya muncul di `/peta`, minimal 900 ms dan maksimal 2,5 detik, dilewati kalau user kembali dari detail provinsi.

### Alur data

Semua data diambil di frontend, tanpa backend:

- **Titik api** (`src/lib/firms.ts`): NASA FIRMS Area CSV API, sumber VIIRS NOAA-21 dan MODIS NRT, 5 hari terakhir. Diagregasi per sel 0,02 derajat, cache localStorage TTL 1 jam. Kalau fetch gagal, pakai snapshot `heat-cells.json` yang ikut bundle.
- **Histori per minggu** (`src/data/heat-weekly.json`, 810 KB): diimpor dinamis hanya saat halaman provinsi dibuka, dimuat sekali per sesi.
- **Angin dan kualitas udara** (`src/lib/open-meteo.ts`): snapshot Open-Meteo per provinsi, cache 15 menit, dipakai lapisan asap canvas 2D (`WindSmokeLayer`).
- **Posko medis** (`src/data/posko-medis.json`, 118 KB): snapshot OSM Overpass, diimpor dinamis saat switch Posko dibuka.
- **Data statis**: `src/data/` berisi metadata provinsi, poligon GeoJSON, dan populasi untuk estimasi dampak kesehatan.

Skrip di `scripts/` menarik snapshot dan menjalankan tes. Logika murni (parser, cache, geo, AQI, estimasi ISPA, SEO) ada di `src/lib/` dengan satu file tes per modul, dijalankan `node --test`.

### Build dan deploy

`pnpm build` menjalankan `tsc -b`, `vite build`, lalu `scripts/gen-seo.ts`. Skrip terakhir menulis `dist/<route>/index.html` untuk beranda, `/peta`, dan 38 provinsi, plus `sitemap.xml`, `robots.txt`, dan `404.html`. Tiap rute punya folder sendiri, jadi deep link tidak 404 di GitHub Pages. Deploy otomatis ke GitHub Pages.

### Struktur folder

```
src/
  pages/        satu file per halaman
  components/   navbar, peta, modal, slider, splash
  data/         snapshot JSON dan loader dinamis
  lib/          logika murni: FIRMS, cache, geo, AQI, SEO, transisi peta
  hooks/        use-mobile
  assets/       SVG dan gambar dari Figma
scripts/        fetch snapshot, generate SEO, tes
```

## User Flow

1. **Masuk beranda** (`/`). User melihat hero, penjelasan singkat, dan kartu peta nasional.
2. **Buka peta** lewat tombol "Lihat Peta" atau menu. Splash screen tampil sebentar selagi peta dan data titik api dimuat.
3. **Telusuri peta nasional** (`/peta`). Heatmap titik api 5 hari terakhir dan bubble nama provinsi tampil di atas peta. User bisa zoom, recenter, atau mengetik nama provinsi di pencarian navbar.
4. **Pilih provinsi**. Klik bubble/poligon, hasil pencarian, atau hasil pencarian dari beranda. Kamera terbang ke provinsi, lalu sheet detail terbuka.
5. **Baca detail provinsi** (`/provinsi/:slug`). Kartu AQI, kategori, grafik histori area api, luas terbakar, dan estimasi dampak kesehatan. Di mobile, sheet bisa digeser ke atas untuk membuka panel lengkap.
6. **Geser slider minggu**. Grafik, AQI, dan heatmap provinsi berganti mengikuti minggu yang dipilih.
7. **Buka Posko Medis**. Switch menampilkan marker faskes di provinsi itu. Klik marker untuk detail, lalu "Tunjukkan Rute" membuat rute dari lokasi user ke posko dan berpindah ke peta nasional.
8. **Lapor titik api**. Modal Warga Lapor dari navbar: pilih kategori, unggah foto, lokasi GPS terisi otomatis, animasi sukses. Belum mengirim data ke server.
9. **Kembali**. Tombol kembali ke peta nasional tanpa splash, karena peta sudah tampil di belakang sheet.
