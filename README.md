# SCAN FIN v2

Aplikasi browser untuk menerapkan aturan SCAN yang telah ditetapkan:

- PDF atau DOCX sebagai input
- Render 96 DPI
- Noise/bercak ringan
- Kemelesetan perspektif acak maksimal 3 mm
- Tidak ada rotasi halaman 3–5° CW
- File tanda tangan opsional: transform acak maksimal 3%
- File tempel opsional: rotasi acak sekitar ±3°
- Urutan halaman tetap
- Output `NAMA_ASLI_FIN.pdf`
- Seed opsional agar hasil random dapat direproduksi

## Struktur

- `index.html` — UI
- `style.css` — tampilan
- `app.js` — seluruh proses di browser

## GitHub Pages

Upload tiga file utama ke repository, lalu aktifkan **Settings → Pages → Deploy from a branch** pada branch utama dan folder `/root`.

## Catatan teknis

PDF diproses dengan PDF.js dan diekspor dengan jsPDF. DOCX dicoba dengan docx-preview + html2canvas. Dokumen DOCX yang sangat kompleks (header/footer khusus, floating objects, field, font yang tidak tersedia di browser) dapat memiliki perbedaan layout dibanding LibreOffice/Word.

Semua pemrosesan dilakukan di browser; file utama tidak dikirim ke server aplikasi.
