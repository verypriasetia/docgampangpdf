# SCAN FIN

Client-side GitHub Pages app untuk mengubah PDF menjadi gambar 96 DPI, memberi noise ringan dan kemelesetan perspektif acak maksimal 3 mm, lalu menyusun kembali menjadi `NAMA_ASLI_FIN.pdf`.

## Deploy
Upload `index.html`, `style.css`, dan `app.js` ke repository GitHub. Buka Settings → Pages → Deploy from branch → pilih branch utama dan `/root`.

## Catatan
Versi ini sengaja memproses PDF di browser. DOCX langsung membutuhkan konverter tambahan/backend karena GitHub Pages tidak menjalankan LibreOffice.
