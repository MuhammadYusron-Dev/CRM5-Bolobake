Product Requirements Document (PRD)

Proyek: Bolobake B2B CRM - Peningkatan Lanjutan (Fase 2 & 3)
Status: Ready for Implementation
Target Pengguna: Admin Sales & Tim Manajemen Bolobake
Tujuan Utama: Mengurangi kesalahan operasional (human error) hingga <1% dan mempercepat proses kerja admin hingga 90%.

1. Arsitektur Sistem & Skema Database (Database Schema Changes)

Untuk mendukung fitur-fitur baru ini, database yang digunakan (baik itu Firebase, PostgreSQL, atau Google Sheets sebagai backend terstruktur) perlu memiliki tabel/koleksi dengan relasi sebagai berikut:

A. Tabel customer_tiers (Kategori Pelanggan)

Menentukan tiering untuk harga kustom.

{
  "tier_id": "string (PK) - e.g., 'TIER_A', 'TIER_B', 'RETAIL'",
  "tier_name": "string - e.g., 'Distributor Utama', 'Reseller Kafe', 'Retail Walk-in'",
  "default_discount_pct": "number - e.g., 0.0"
}


B. Tabel customers (Informasi Customer)

Menghubungkan profil pelanggan dengan tier harga.

{
  "customer_id": "string (PK)",
  "customer_name": "string",
  "tier_id": "string (FK -> customer_tiers.tier_id)",
  "whatsapp_number": "string (format: '628xxxxxxxx')",
  "shipping_address": "string",
  "created_at": "timestamp"
}


C. Tabel tier_prices (Matriks Harga SKU Khusus)

Menyimpan harga khusus per produk untuk setiap tier. Jika tidak ada entri di sini, sistem akan menggunakan harga dasar (base price) dari tabel SKU utama.

{
  "price_id": "string (PK)",
  "tier_id": "string (FK -> customer_tiers.tier_id)",
  "sku_code": "string (FK -> skus.sku_code)",
  "custom_price": "number"
}


D. Tabel production_capacities (Manajemen Kuota Dapur)

Melacak batas aman kapasitas produksi harian untuk mencegah overload.

{
  "date": "string (PK) - format: 'YYYY-MM-DD'",
  "max_capacity_pcs": "number - default: 1000",
  "booked_pcs": "number - total terpesan aktif"
}


E. Tabel audit_logs (Rekam Jejak Operasional)

Mencatat setiap aksi sensitif yang dilakukan oleh admin untuk keperluan troubleshooting.

{
  "log_id": "string (PK)",
  "timestamp": "timestamp",
  "user_id": "string",
  "user_name": "string",
  "action_type": "string - e.g., 'CREATE_ORDER', 'DELETE_ORDER', 'UNDO_ACTION'",
  "details": "string/text - JSON string berisi perubahan data"
}


2. Spesifikasi Detail Fitur (Functional Requirements)

Fitur 1: Sistem Harga Otomatis (Customer-Tier Auto-Pricing)

Aktor: Admin Sales

Alur Pengguna (User Flow):

Admin membuka form Order Baru.

Admin memilih nama pelanggan di dropdown "Informasi Customer" (misal: Loom Coffee).

Sistem mendeteksi bahwa Loom Coffee terdaftar di Tier B / Reseller Kafe.

Saat admin menambah baris produk (misal: Butter Croissant 75gr), sistem melakukan query ke tabel tier_prices untuk Tier B + Butter Croissant 75gr.

Kolom Harga Satuan otomatis terisi Rp 11.000 (mengunci harga tier, bukan harga retail Rp 13.000).

Input field Harga Satuan di-set menjadi disabled (read-only) untuk mencegah admin mengubah harga secara tidak sengaja.

Penanganan Edge Case: Jika SKU yang dipilih tidak memiliki harga khusus di tabel tier_prices, kembalikan (fallback) ke base_price dari katalog utama.

Fitur 2: Fitur Duplikasi Pesanan (One-Click Reorder)

Aktor: Admin Sales

Alur Pengguna (User Flow):

Admin masuk ke menu Riwayat Pesanan.

Pada setiap baris pesanan lampau, terdapat tombol dengan ikon "Duplicate/Reorder" bertuliskan Ulangi Pesanan.

Ketika diklik, sistem membuka tab Order Baru dan langsung mengisi:

Informasi Customer yang sama.

Daftar item SKU beserta kuantiti (qty) yang sama persis.

Opsi Pengiriman & Catatan Instruksi Dapur yang sama.

Kolom Tanggal Produksi & Tanggal Pengiriman dikosongkan (wajib diisi manual oleh admin untuk tanggal yang baru).

Admin meninjau pesanan dan mengklik kirim.

Fitur 3: Integrasi Kirim Ringkasan ke WhatsApp (One-Click WA Share)

Aktor: Admin Sales

Alur Pengguna (User Flow):

Setelah sukses menekan tombol "Kirim ke Dapur & Sheet", modal sukses akan muncul.

Di dalam modal tersebut, tampilkan tombol hijau menonjol: "Kirim Konfirmasi WA" dengan ikon WhatsApp.

Saat diklik, sistem membuka tab baru mengarah ke URL API WhatsApp Web:
https://api.whatsapp.com/send?phone={whatsapp_number}&text={encoded_text}

Variabel {encoded_text} berisi teks ringkasan pesanan yang diformat menggunakan Markdown WhatsApp (bold, italic, susunan rapi).

Spesifikasi Teks Template WhatsApp:

*BOLOBAKE ORDER CONFIRMATION* 🥖

Pelanggan: {customer_name}
Tgl Pengiriman: {delivery_date}
Ekspedisi: {shipping_method}

*Detail Pesanan:*
{loop: items}
- {qty}x {product_name} (@Rp {unit_price}) = Rp {total_item_price}
{endloop}

Subtotal: Rp {subtotal}
Ongkir: Rp {shipping_fee}
*Total Pembayaran: Rp {grand_total}*

Catatan Dapur: {kitchen_instruction || '-'}

_Pesanan telah dicatat di sistem dan masuk antrean produksi. Terima kasih!_


Fitur 4: Smart Text Parser AI (Copy-Paste Chat to Order)

Aktor: Admin Sales

Alur Pengguna (User Flow):

Di bagian teratas halaman Order Baru, terdapat area teks (Textarea) dengan tombol "Proses Pesanan AI".

Admin menyalin chat tidak beraturan dari pelanggan di WA dan menempelkannya (paste) ke area tersebut.

Admin klik "Proses Pesanan AI".

Sistem mengirimkan teks tersebut ke API Gemini 2.5 Flash untuk diubah menjadi struktur JSON terformat.

Hasil respons JSON dibaca oleh aplikasi, lalu secara otomatis memicu fungsi penambahan item pada form pemesanan secara instan.

Panduan API & Payload Gemini untuk Pengembang:

Model: gemini-2.5-flash-preview-09-2025

Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}

Sistem Prompt (System Instruction):

Kamu adalah asisten parser pesanan khusus untuk toko roti Bolobake. 
Tugasmu adalah menganalisis teks percakapan kasual dan mengubahnya menjadi format JSON terstruktur untuk pesanan.
Daftar SKU yang valid dalam sistem kami mencakup kata kunci seperti: "Mochi Croissant Tiramisu", "Butter Croissant 75gr", "Butter Croissant 30gr", "Pain Au Suisse", "Almond Croissant", dll.
Gunakan pencocokan nama yang paling mendekati jika ada typo.

Format respons WAJIB berupa JSON murni dengan skema berikut:
{
  "customer_name": string atau null,
  "delivery_date": "YYYY-MM-DD" atau null,
  "items": [
    {
      "detected_sku": string, // Nama SKU yang paling mendekati katalog resmi
      "qty": number
    }
  ]
}
Jangan berikan teks penjelasan apa pun di luar JSON tersebut.


Fitur 5: Validasi Batas Kapasitas Produksi (Capacity Warning)

Aktor: Admin Sales & Tim Produksi

Alur Pengguna (User Flow):

Saat admin memilih Tanggal Produksi pada formulir, picu event onChange.

Jalankan fungsi pengecekan kapasitas dapur:
checkCapacity(targetDate) -> Mengembalikan total kuantitas (pcs) dari seluruh pesanan yang dijadwalkan pada tanggal tersebut.

Jika booked_pcs + current_order_qty > max_capacity_pcs:

Tampilkan Banner Alert berwarna kuning/merah di bawah input tanggal: ⚠️ "Peringatan: Kapasitas produksi tanggal {date} tersisa {available_pcs} pcs. Total pesanan ini adalah {current_order_pcs} pcs!"

Sistem tidak mengunci tombol kirim (tetap diperbolehkan atas diskresi admin), namun memberikan warning keras agar admin melakukan konfirmasi ulang dengan kepala produksi.

Fitur 6: Tombol Batalkan / Kembalikan (Undo Action & Audit Log)

Aktor: Admin Sales & Manajemen

Alur Pengguna (User Flow):

Ketika admin mengklik "Hapus Baris Produk" atau "Kirim ke Dapur", aksi langsung dieksekusi untuk menjaga kecepatan aplikasi.

Namun, tampilkan Snack-bar / Toast Notification di bagian bawah tengah layar dengan tombol "BATALKAN (UNDO)" yang bertahan selama 10 detik.

Jika tombol "Undo" diklik oleh admin sebelum waktu habis:

Ambil state cadangan (previous state) yang disimpan sesaat sebelum aksi dilakukan.

Kembalikan data form ke kondisi semula.

Jika aksi yang dibatalkan adalah pengiriman data ke Sheet, kirimkan request penghapusan baris barusan ke database/Sheet.

Setiap aksi penting ini akan secara otomatis menambahkan satu entri ke tabel audit_logs untuk transparansi operasional.

3. Matriks Kesiapan API & Integrasi

Berikut adalah ringkasan aksi API yang perlu disediakan oleh tim backend/Antigravity:

Endpoint / Fungsi

Metode

Payload Deskripsi

Tujuan

/api/customers

GET

Mengambil data customer beserta informasi tier_id dan nomor WA.

Autocomplete form customer.

/api/pricing/tier

GET

Parameter: tier_id. Mengambil daftar harga kustom produk untuk tier tersebut.

Auto-pricing di sisi client.

/api/capacity/check

GET

Parameter: date. Mengembalikan sisa kapasitas produksi.

Validasi slot produksi harian.

/api/logs

POST

Payload: { user, action, details }.

Audit log pengawasan admin.

/api/parse-order

POST

Payload: { raw_text }. Mengirimkan teks ke Google Gemini API.

Otomatisasi isi form berbasis AI.

4. Kriteria Penerimaan Pengujian (Acceptance Criteria)

Pengujian Auto-Pricing: Ketika memilih customer dengan kategori "Tier A", harga Butter Croissant 75gr harus otomatis berubah ke harga grosir dan input harga tidak bisa diedit secara manual.

Pengujian Reorder: Saat tombol Reorder ditekan pada pesanan lama ber-ID #105, form baru harus terisi seluruh produk pesanan #105 dengan kuantiti yang sama, namun kolom tanggal wajib kosong.

Pengujian AI Parser: Saat admin menempelkan teks: "Tolong kirim moci tirmisu 10 ya untuk besok", sistem harus berhasil menambahkan produk Mochi Croissant Tiramisu dengan qty 10 ke dalam baris belanja secara otomatis.