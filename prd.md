PRODUCT REQUIREMENTS DOCUMENT (PRD)

Nama Proyek: Bolobake B2B Order Management Dashboard

Versi: 2.0 (Update Fitur Catalog AI Scanner)

Platform Target: Aplikasi Web (Responsive Desktop)

Database Utama: Google Sheets (Sinkronisasi Real-time)

Tanggal: 9 Juni 2026

1. PENDAHULUAN & TUJUAN

Latar Belakang: Bolobake memerlukan sistem yang menjembatani antara penerimaan pesanan B2B (HORECA) dengan laporan produksi. Penggunaan spreadsheet manual saat ini menyebabkan lambatnya rekapitulasi data dan risiko kesalahan komunikasi antara Admin dan Tim Produksi. Selain itu, diperlukan sistem yang adaptif terhadap perubahan menu katalog seiring bertambahnya produk baru.

Tujuan Proyek: 1.  Mempermudah Admin menginput orderan multi-item dengan fitur katalog pintar.
2.  Menyediakan Dashboard Analitik real-time bagi Owner untuk melacak omset dan tren varian.
3.  Otomatisasi Laporan Produksi: Menghasilkan baris data di Google Sheets yang terformat khusus agar tim dapur bisa langsung mengeksekusi orderan tanpa rekap manual tambahan.
4.  Manajemen Katalog Dinamis: Menyediakan alat ekstraksi (screening) untuk memindai file katalog (PDF/Gambar) dan memperbarui database produk secara otomatis atau secara manual.

2. PERSONA PENGGUNA

Admin / Kasir Order: Menginput pesanan, mengelola data outlet, dan memastikan catatan pengiriman tercatat.

Owner: Memantau total omset, performa varian produk, dan memperbarui database menu saat ada perubahan katalog baru (menggunakan fitur scanner).

Tim Produksi (Dapur): Membaca Google Sheets sebagai "Job Sheet" untuk mengetahui apa yang harus diproduksi, berapa jumlahnya, dan instruksi khusus apa yang diminta customer.

3. SPESIFIKASI FITUR (MODUL)

A. Modul Input & Order Management (Panel Kiri)

Modul ini adalah pusat kendali operasional harian.

Header Pesanan: Input nama Outlet/Customer (Sistem rekomendasi nama jika sudah pernah order).

Smart Multi-Item Picker:

Tombol + Tambah Item untuk menambahkan banyak baris produk.

Search & Auto-fill: Admin mengetik nama produk (misal: "Bagel"), sistem menampilkan list SKU Bolobake dari database katalog yang tersinkronisasi.

Begitu diklik, harga satuan otomatis terisi sesuai katalog, namun tetap bisa di-override (diubah manual) oleh admin.

Shipping & Logistics:

Toggle mode: "Gratis Ongkir" (Default Solo) atau "Berbayar" (Input nominal manual).

Catatan Khusus (Notes): Kolom teks luas untuk instruksi spesifik (misal: "Kirim jam 06.00", "Packing terpisah", "Tingkat kematangan garing").

Order List (Live History): Menampilkan daftar pesanan yang sudah disubmit hari itu dalam bentuk kartu ringkas untuk verifikasi cepat.

B. Modul Manajemen Katalog (Catalog Manager) - FITUR BARU

Sistem terdedikasi untuk mendeteksi dan menambah produk baru secara cerdas sehingga database SKU selalu up-to-date.

Auto-Scanner (Catalog Screening): Fitur untuk mengunggah file katalog terbaru (format PDF/Gambar). Sistem akan menggunakan pemindaian teks (OCR/AI Parsing) untuk mendeteksi opsi menu, memetakan kategori, dan mengekstrak harga secara otomatis dari desain katalog.

Manual Entry: Form input manual jika admin/owner hanya ingin menambahkan opsi produk secara satuan ke dalam sistem tanpa perlu mengunggah file.

Live Sync: Setiap deteksi otomatis dari PDF atau input manual yang disetujui akan langsung tersimpan ke basis data terpusat (Sheet Katalog), sehingga dropdown picker di halaman order langsung memiliki menu tersebut.

C. Modul Analitik & Dashboard (Panel Kanan)

Visualisasi data yang bersifat reaktif (update setiap kali ada transaksi baru).

Global Summary: Kalkulasi Total Omset (Produk + Ongkir), Jumlah Transaksi (Order), Total Pcs Terjual, dan Jumlah Customer Unik harian.

Variant Performance: List varian produk yang terjual hari ini beserta jumlah qty, total omset per SKU, dan progress bar persentase kontribusi terhadap total sales.

Customer Leaderboard: Tabel yang merinci setiap outlet: frekuensi pemesanan, jumlah produk yang dibeli, rincian subtotal, ongkir, dan total belanja mereka.

4. ALUR KERJA (WORKFLOW) & INTEGRASI DATA

A. Operational Workflow (Admin to Kitchen)

Input: Admin mengisi form di Web App.

Validation: Admin mengecek Live Subtotal Preview.

Execution: Klik Submit Order.

System Action:

Frontend meng-update Dashboard (Panel Kanan).

Backend mengirim data pesanan ke Google Sheets API.

Production Ready: Detik itu juga, pesanan muncul di Google Sheets di area dapur dengan format yang rapi.

B. Workflow Pembaruan Katalog Menu (Screening File)

Upload / Input: User mengunggah file katalog .pdf terbaru ke dalam tab Catalog Manager, ATAU mengisi form produk baru secara manual.

AI Parsing: Sistem mengekstraksi teks menu dari file PDF yang diunggah.

Verifikasi: Hasil pemindaian (Nama Produk, Harga) ditampilkan dalam tabel pratinjau. User bisa memperbaiki jika ada harga atau ejaan yang keliru dibaca oleh mesin.

Sinkronisasi: Menekan tombol Simpan Katalog akan menembak API dan memperbarui Sheet Master Katalog di Google Sheets.

5. STRUKTUR DATABASE (SKEMA GOOGLE SHEETS)

Database sekarang menggunakan 2 Tab utama di dalam 1 file Spreadsheet Master:

Tab 1: Laporan Transaksi Harian (Untuk Produksi & History)

Kolom

Nama Field

Format / Isi

A

Timestamp

Tanggal & Waktu (Auto-generated)

B

Customer

Nama Outlet / Nama Pemesan

C

Rincian Produksi

Format List: "- SKU A (10 pcs)\n- SKU B (5 pcs)"

D

Total Pcs

Jumlah total kuantitas produk dalam order tersebut

E

Subtotal

Nilai total produk sebelum ongkir

F

Ongkos Kirim

Nilai nominal ongkir

G

Grand Total

Nilai akhir (Subtotal + Ongkir)

H

Catatan Produksi

Instruksi khusus untuk tim dapur & pengiriman

I

Status (Opsional)

Kolom manual untuk Tim Dapur (Pending/Done)

Tab 2: Master Katalog (Sumber Data Picker Otomatis)

Kolom

Nama Field

Deskripsi

A

SKU ID

Kode unik produk (Auto-generated)

B

Nama Produk

Nama item dari pemindaian katalog/manual

C

Kategori

Contoh: Croissant, Sweets, Cake & Cookies

D

Harga Default

Harga standar dari katalog

E

Status Aktif

TRUE/FALSE (Tampil/sembunyikan di dropdown)

6. PANDUAN DESAIN (UI/UX)

Tema: Artisan Bakery Professional.

Warna:

Bg: #FAF8F5 (Off-white warm) - Mencegah mata lelah.

Text: #2C1810 (Espresso) - Kontras tinggi untuk data.

Accent: #D4A847 (Gold/Amber) - Memberikan kesan premium.

Tipografi:

DM Serif Display untuk judul modul.

Inter untuk angka dan label data.

Layout: Two-column split-pane utama. Tambahan menu tersembunyi (modal atau halaman setting) khusus untuk fitur "Catalog Manager".

7. TEKNOLOGI (TECH STACK)

Frontend: Next.js 14 (App Router).

Styling: Tailwind CSS.

Data Extraction / OCR: Integrasi library/API (seperti Google Cloud Vision, Tesseract.js, atau layanan AI Parser) untuk memindai file PDF Katalog Menu.

Database Integration: Google Sheets API v4 via Google Cloud Service Account.

Deployment: Vercel (Produksi & Staging).

8. CATATAN PENGEMBANGAN (FUTURE SCOPE)

Integrasi tombol WhatsApp untuk mengirim struk rekap otomatis ke customer.

Filter tanggal untuk melihat laporan mingguan/bulanan di dalam Web App.

Sistem manajemen stok (Inventory) yang berkurang otomatis saat order disubmit.