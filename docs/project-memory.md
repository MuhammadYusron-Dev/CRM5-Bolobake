# Catatan & Analisis Insiden Proyek (Project Memory)

Dokumen ini dibuat untuk menyimpan memori atas kendala-kendala krusial yang pernah dihadapi di proyek ini agar kesalahan yang sama tidak terulang, dan solusi bisa didapatkan lebih cepat di masa depan.

## Insiden: Vercel 500 Server Error & Kegagalan Refactor (21 Juni 2026)

### Deskripsi Masalah
1. Halaman web di Vercel secara konsisten memunculkan layar `This page couldn't load` (500 Serverless Function Timeout).
2. Upaya awal untuk menyamakan desain komponen `ProductionTableBoard` dengan `HistoryTable` memicu *chain of errors* pada pengolahan *array* dan struktur *property* objek. 
3. Saat *bug* pengolahan data diperbaiki, permintaan data SSR ke Google Sheets mengambil waktu lebih dari batas maksimal Vercel (10 detik untuk versi Hobby).
4. Usaha mem- *bypass* batas Vercel dengan skema `Promise.race` (berdurasi 7s lalu 3s) masih kurang efektif karena *chain errors* yang dibawa dari *commit-commit* sebelumnya.

### Solusi & Langkah Resolusi
Alih-alih terus menambal kode, penyelesaian yang paling tepat dan stabil yang akhirnya berhasil adalah melakukan **Undo Massal (Hard Reset)**.
- **Commit Target:** `8912c54` (sebelum *refactor* layout ProductionTableBoard dimulai).
- **Proses:** Menjalankan `git reset --hard 8912c54` kemudian menimpa *history* git Vercel secara paksa menggunakan `git push origin main --force`.
- **Trigger Vercel:** Karena Vercel memiliki sistem *cache* atas *commit hash* lawas, diperlukan pembuatan *empty commit* (`git commit --allow-empty`) baru agar Vercel mendeteksi perubahan dan melakukan *build* ulang *deployment*.

### Pelajaran Penting (Lessons Learned)
1. **Berhati-hati Saat Refactor Komponen Penting:** Menyamakan antarmuka (*layout*) 2 komponen yang sekilas mirip (`ProductionTableBoard` dan `HistoryTable`) harus dilakukan dengan teliti. Struktur data yang ditangani bisa sangat berbeda, dan asal *copy-paste* berisiko memanggil *property* yang tak terdefinisi (*undefined*) atau memicu eror saat me-*render* komponen SSR.
2. **Keterbatasan Vercel 10s Timeout:** Segala bentuk pengambilan data (*fetch*) di halaman Server Components (SSR) yang mengandalkan Google Sheets API rentan terkena *timeout* ketika trafik Sheets padat. Solusinya harus lebih komprehensif, seperti memindahkan *heavy lifting* API ini secara total ke sistem *client-side* (SWR) atau menggunakan skema antrean/cache yang solid, alih-alih mengandalkan manipulasi *timeout* di `page.tsx`.
3. **Rollback adalah Opsi Valid:** Saat mendapati rentetan *error* berlapis setelah suatu perombakan desain yang masif, seringkali solusi yang paling efisien dan memakan lebih sedikit waktu adalah mengembalikan semua kode ke versi stabil yang terakhir, daripada mencoba menutup lubang *bug* satu-per-satu.
