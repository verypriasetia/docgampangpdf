# SCAN FIN v6

Web app client-side untuk membuat PDF bergaya hasil scanner sesuai aturan SCAN.

## Perubahan utama v6

- **Teks DOCX tidak ditransformasi sebagai objek.**
- Gambar yang tertanam di DOCX diproses sebagai objek gambar tersendiri sebelum halaman dirasterisasi.
- Heuristik otomatis:
  - gambar relatif persegi dan berada di bagian bawah halaman → dianggap **stempel**;
  - gambar memanjang dan berada di bagian bawah halaman → dianggap **tanda tangan**;
  - gambar lain tidak diubah.
- **Stempel:** translasi acak maksimal ±3 mm pada X/Y dan rotasi ±5°.
- **Tanda tangan:** translasi acak maksimal ±3 mm pada X/Y, lalu skew atau perspective ringan dengan batas displacement berbasis 3 mm.
- Efek kemelesetan scanner pada halaman tetap maksimal 3 mm, tetapi dilakukan **setelah** objek dirender sehingga transformasi objek tidak menggeser node teks secara khusus.
- 96 DPI, noise ringan, urutan halaman dipertahankan, output `NAMA_ASLI_FIN.pdf`.

## Catatan

Deteksi objek gambar bersifat heuristik karena browser tidak selalu mengetahui semantik gambar DOCX (apakah gambar itu stempel, tanda tangan, foto, atau ilustrasi). Jika dokumen mengandung banyak gambar lain, nonaktifkan klasifikasi otomatis atau sesuaikan kode `classifyEmbeddedImage()`.

DOCX dipaginasi menggunakan `lastRenderedPageBreak` (`ignoreLastRenderedPageBreak:false`) agar dokumen seperti SKI 8 KBC BAB 1 tetap terpisah menjadi 9 halaman.

## GitHub Pages

Upload isi folder ini ke root repository GitHub Pages, lalu aktifkan Settings → Pages → Deploy from a branch.
