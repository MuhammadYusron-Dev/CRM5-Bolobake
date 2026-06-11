Product Requirements Document (PRD)

Proyek: Bolobake B2B Dashboard - UI/UX Revamp
Status: To Do / Ready for Development
Versi: 1.0

1. Objektif Proyek (Objective)

Mendesain ulang dan mengoptimalkan antarmuka (UI) serta pengalaman pengguna (UX) dari Bolobake B2B Dashboard. Fokus utama adalah meningkatkan kecepatan input data oleh admin (productivity-first), mencegah kesalahan input/double-submit, serta menyajikan data analitik yang lebih visual dan intuitif bagi manajemen.

2. Target Pengguna (User Personas)

Admin Sales/Operasional: Membutuhkan kecepatan input pesanan, navigasi yang didominasi keyboard, dan kejelasan status pengiriman data.

Manajemen (Owner/Manajer): Membutuhkan ringkasan performa penjualan harian/mingguan yang cepat dibaca lewat visualisasi grafik.

3. Scope & Phasing (Cakupan & Fase Rilis)

Pengembangan akan dibagi menjadi 3 fase agar tidak mengganggu operasional harian.

Fase 1: Quick Wins (Fokus: Kecepatan Input Admin)

Fase ini berfokus pada optimasi halaman/formulir input pesanan (Order Entry).

FR 1.1 - Smart Search SKU (Combobox):

Ganti elemen <select> dropdown bawaan menjadi komponen Combobox / Autocomplete.

Pengguna dapat mengetik nama produk (misal: "croissant") dan daftar akan langsung terfilter dari total 136 SKU.

Opsional/Nice-to-have: Kelompokkan daftar berdasarkan kategori produk (Pastry, Savoury, dll).

FR 1.2 - Keyboard-Only Workflow:

Implementasi tab-index yang berurutan. Setelah memilih SKU, Tab akan pindah ke kolom Qty, Tab lagi ke Harga.

Menekan tombol Enter pada baris terakhir harus otomatis men-trigger fungsi Tambah Baris Produk.

FR 1.3 - Safe Send Guardrail (Pencegahan Duplikasi):

Tombol "Kirim ke Dapur & Sheet" harus memunculkan Modal Konfirmasi (berisi ringkasan Total Pesanan & Tujuan Ekspedisi).

Saat submit dikonfirmasi, tombol harus masuk ke Loading State (berputar/disable) untuk mencegah multiple clicks.

Tampilkan Toast Notification (Pesan Sukses/Gagal) di pojok layar setelah request ke Google Sheets / Database selesai.

Fase 2: Arsitektur Layout & Mobile Responsiveness

Fase ini berfokus pada navigasi dan kenyamanan akses lintas perangkat.

FR 2.1 - Sidebar Navigation Layout:

Ubah struktur Single Page menjadi Multiple Views (atau Tabs jika menggunakan SPA/React).

Buat komponen Sidebar (kiri) untuk Desktop/Tablet dengan menu:

Dashboard (Analitik)

Order Baru (Form Input)

Riwayat Pesanan (Log)

Katalog (Manajemen SKU)

FR 2.2 - Optimasi Tampilan Mobile:

Sembunyikan Sidebar pada ukuran layar di bawah 768px (Mobile), ganti dengan menu Hamburger atau Bottom Navigation Bar.

Pada halaman "Order Baru" di versi Mobile, ubah tabel baris produk menjadi tata letak Card (Kartu) bersusun vertikal agar tidak ada horizontal scroll.

Fase 3: Visualisasi Analitik (Rich Analytics)

Fase ini berfokus pada halaman Dashboard Manajemen.

FR 3.1 - KPI Cards Expansion:

Buat komponen Kartu (Card) untuk metrik: Total Omset, Jumlah Transaksi, Produk Terjual, Customer Aktif.

Sertakan Ikon (Lucide/Heroicons) dan indikator persentase naik/turun (growth indicator) jika data historis tersedia.

FR 3.2 - Integrasi Grafik (Chart):

Gunakan library grafik (rekomendasi: Recharts atau Chart.js).

Grafik 1 (Donut/Pie Chart): Untuk memvisualisasikan data "Performa Varian Terlaris" (maksimal top 5-7, sisanya "Lainnya").

Grafik 2 (Line/Bar Chart): Untuk tren omset harian/mingguan (jika endpoint data mendukung timeseries).

FR 3.3 - Dynamic Table untuk Top Customer:

Pada tabel "Top Customer Hari Ini", tambahkan Input Search lokal untuk mencari nama outlet/customer secara instan tanpa perlu memuat ulang halaman.

4. Persyaratan Non-Fungsional (Non-Functional Requirements)

Tech Stack Compatibility: Aplikasi saat ini di-hosting di Vercel (kemungkinan besar menggunakan React/Next.js/Vue). Komponen UI baru harus menggunakan framework styling yang ada (seperti Tailwind CSS) untuk menjaga konsistensi.

Performance: Render daftar 136 SKU pada combobox tidak boleh membuat aplikasi lagging. Gunakan teknik virtualization jika diperlukan, meski untuk 136 data standar DOM rendering masih sangat aman.

State Management: Pastikan state keranjang pesanan (baris produk) tidak hilang jika pengguna tidak sengaja berpindah tab/menu ke "Dashboard" dan kembali lagi ke "Order Baru" (gunakan Context atau global state seperti Zustand/Redux jika memungkinkan).

5. Kriteria Sukses (Acceptance Criteria)

Admin dapat menginput pesanan berisi 5 produk berbeda dalam waktu kurang dari 30 detik menggunakan bantuan keyboard workflow dan smart search.

Tidak ada lagi insiden data ganda (double-entry) di Google Sheets berkat loading state pada tombol kirim.

Halaman dapat diakses dengan baik dan proporsional di layar HP (lebar 360px - 430px) tanpa scrolling horizontal pada area keranjang belanja.