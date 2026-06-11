Spesifikasi Upgrade UI/UX: Dashboard Analitik Bolobake

Dokumen ini berisi panduan desain, komponen visual baru, serta kode utilitas animasi (Tailwind CSS) untuk meningkatkan estetika dashboard Bolobake, khususnya pada kartu KPI, daftar produk, dan tabel pelanggan.

1. Upgrade Kartu KPI (Key Performance Indicators)

A. Kartu "Total Omset" (Indikator Tren Dinamis & Animasi)

Saat ini, teks "+12% dari kemarin" masih polos. Kita akan mengubahnya menjadi Tren Badge dinamis dengan indikator warna dan animasi mikro.

Logika Warna & Ikon:

Jika Tren Positif (Naik): * Background Badge: Hijau lembut (bg-emerald-500/20 atau bg-green-100)

Teks & Ikon: Hijau emerald (text-emerald-400 jika kartu warna gelap, atau text-emerald-600 jika kartu warna terang)

Ikon: Panah serong atas-kanan ($\nearrow$ / ArrowUpRight)

Jika Tren Negatif (Turun):

Background Badge: Merah lembut (bg-rose-500/20 atau bg-rose-100)

Teks & Ikon: Merah rose (text-rose-400 atau text-rose-600)

Ikon: Panah serong bawah-kanan ($\searrow$ / ArrowDownRight)

Efek Animasi Mikro (Floating Arrow):
Buat ikon panah bergerak naik-turun secara halus menggunakan custom keyframe CSS atau Tailwind utility classes.

Tambahkan utility keyframe berikut pada global CSS Anda:

@keyframes floatUp {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-3px) translateX(3px); }
}
.animate-float-up {
  animation: floatUp 2s ease-in-out infinite;
}

@keyframes floatDown {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(3px) translateX(3px); }
}
.animate-float-down {
  animation: floatDown 2s ease-in-out infinite;
}


Struktur Komponen HTML/React (Tailwind):

<!-- Contoh jika tren POSITIF -->
<div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 mt-2">
  <svg class="w-3.5 h-3.5 animate-float-up" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 17L17 7M17 7H7M17 7V17"/>
  </svg>
  <span>+12% dari kemarin</span>
</div>


B. Ide Upgrade & Ikon Kreatif untuk Kartu Lainnya

1. Kartu "Jumlah Transaksi"

Ikon Tambahan: Gunakan ikon tas belanja (Shopping Bag) dengan warna aksen kuning/amber hangat.

Efek Hover: Saat kursor diarahkan (hover) ke kartu ini, buat ikon tas belanja melakukan gerakan memantul kecil sekali (single bounce).

Subteks Dinamis: Di bawah angka "15", tambahkan keterangan kecil:
• 3 pesanan sedang diproduksi dengan dot hijau berkedip (pulsing green dot).

<span class="relative flex h-2 w-2 mr-1">
  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
</span>


2. Kartu "Total Produk"

Ikon Tambahan: Gunakan ikon Box terbuka atau Croissant mini.

Efek Hover: Buat ikon sedikit berputar (rotate-12) saat di-hover.

Informasi Tambahan: Di bawah angka "24.347", tambahkan visualisasi mini bar horizontal tipis yang menunjukkan rasio produk Savoury vs Pastry yang terjual.

3. Kartu "Customer Aktif"

Ikon Tambahan: Ikon grup pelanggan (Users) dengan aksen warna biru lembut.

Efek Hover: Buat ikon membesar sedikit secara halus (transition-transform duration-300 hover:scale-110).

Informasi Tambahan: Tambahkan teks "9 outlet baru bulan ini" untuk menunjukkan pertumbuhan customer B2B Anda.

2. Peningkatan Visual pada Area Lainnya

A. Progress Bar pada "Performa Varian Terlaris"

Gradasi Warna Progress Bar: Ubah warna progress bar polos menjadi gradasi warna (gradient color) hangat yang menggugah selera (contoh: dari cokelat tua ke emas panggang bg-gradient-to-r from-amber-600 to-amber-400).

Efek Shimmer (Kilau): Tambahkan efek kilau menyapu pada progress bar teratas (peringkat 1) secara berkala agar terlihat sebagai produk terlaris utama.

B. Peringkat Estetik pada "Top Customer"

Saat ini nomor peringkat (1, 2, 3) pada daftar pelanggan terbaik menggunakan angka biasa. Mari kita buat sistem Medal Badge:

Peringkat 1: Lingkaran kecil berwarna emas mengkilap (bg-amber-100 text-amber-700 font-bold border border-amber-300) berserta ikon mahkota kecil atau bintang kuning 👑.

Peringkat 2: Lingkaran berwarna perak (bg-slate-100 text-slate-700 border border-slate-300) 🥈.

Peringkat 3: Lingkaran berwarna perunggu (bg-orange-50 text-orange-700 border border-orange-200) 🥉.

Efek Interaktif: Baris pelanggan akan berubah warna latarnya menjadi abu-abu tipis transparan (hover:bg-slate-50 transition-colors cursor-pointer) saat disorot kursor, membuat tabel terasa lebih responsif.

3. Ringkasan Kelas Tailwind Tambahan yang Diperlukan

Berikan kelas-kelas berikut kepada pengembang Anda untuk disalin ke file global CSS/Tailwind configuration:

@layer utilities {
  /* Efek Kilau Shimmer pada Progress Bar */
  .shimmer-bar {
    position: relative;
    overflow: hidden;
  }
  .shimmer-bar::after {
    content: '';
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 20%,
      rgba(255, 255, 255, 0.5) 60%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2.5s infinite;
  }
  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }
}
