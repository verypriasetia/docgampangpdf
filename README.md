# SCAN FIN v4

Perbaikan v4: DOCX preview sekarang memuat JSZip sebelum docx-preview. Error `Cannot read properties of undefined (reading 'loadAsync')` berasal dari dependency DOCX yang membutuhkan JSZip tetapi belum dimuat.

## Fitur
- PDF dan DOCX
- Render 96 DPI
- Noise/bercak ringan
- Kemelesetan perspektif maksimal 3 mm
- Tanda tangan: transform/skew/perspective acak maksimal 3%
- File tempel: rotasi acak sekitar ±3°
- Urutan halaman dipertahankan
- Output `NAMA_ASLI_FIN.pdf`

## GitHub Pages
Upload isi folder ini ke root repository, lalu aktifkan Settings → Pages → Deploy from branch.

Jika browser masih menampilkan versi lama, gunakan Ctrl+F5 atau buka URL dengan query sementara, misalnya `?v=4`.
