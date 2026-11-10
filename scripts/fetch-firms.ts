import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fetchFirmsHeat } from '../src/lib/firms.ts'

// Menyegarkan snapshot fallback heatmap (dipakai sebelum fetch runtime selesai).
// Aplikasi sendiri menarik data terbaru saat runtime lewat src/lib/firms.ts.
const outputPath = resolve('src/data/heat-cells.json')

const snapshot = await fetchFirmsHeat()
const dates = [new Date(Date.now() - (snapshot.dayRange - 1) * 86400000), new Date()]
const payload = {
  source: 'NASA FIRMS',
  sensor: snapshot.sources.join(', '),
  fetchedAt: snapshot.fetchedAt,
  dateRange: { from: dates[0].toISOString().slice(0, 10), to: dates[1].toISOString().slice(0, 10) },
  cellDeg: 0.02,
  note: 'Titik api FIRMS diagregasi per sel 0,02 derajat. Nilai ke-3 = jumlah deteksi.',
  cells: snapshot.cells,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, 'utf8')
console.log(`Tersimpan ${snapshot.cells.length} sel FIRMS dari ${snapshot.sources.join(', ')} ke ${outputPath}`)