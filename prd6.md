Spesifikasi Upgrade UI/UX: Dashboard Analitik Bolobake (v2.0 - Ultimate Aesthetics)

Dokumen ini berisi panduan desain level lanjutan (advanced), komponen visual baru, serta kode utilitas animasi (Tailwind CSS) untuk membuat dashboard Bolobake terasa lebih premium, interaktif, dan tidak membosankan bagi admin.

1. Perbaikan Kontras & Kedalaman Visual (Depth & Shadows)

Berdasarkan implementasi saat ini, elemen-elemen masih terasa "flat". Kita perlu menambahkan dimensi.

A. Perbaikan Badge "Total Omset"

Teks hijau (+12% dari kemarin) langsung di atas background emas (gold) memiliki kontras yang rendah dan sulit dibaca.

Solusi: Gunakan efek Glassmorphism (kapsul transparan) untuk badge tersebut.

Kode Tailwind (Revisi):

<!-- Pada kartu emas/kuning, gunakan background putih transparan -->
<div class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/30 text-emerald-800 backdrop-blur-sm border border-white/40 mt-2 shadow-sm">
  <svg class="w-3.5 h-3.5 animate-float-up" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M7 17L17 7M17 7H7M17 7V17"/>
  </svg>
  <span>+12% dari kemarin</span>
</div>


B. Soft Shadows & Hover Lift pada Kartu KPI

Semua kartu putih ("Jumlah Transaksi", "Total Produk", dll) harus memiliki interaksi ketika kursor melewatinya.

Tambahkan class ini pada container setiap kartu KPI:
transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm border border-slate-100

Ini akan membuat kartu seolah-olah "terangkat" saat disorot mouse.

2. Penambahan Elemen Visual "Wow Factor"

A. Background Sparklines (Grafik Mini)

Dashboard modern tidak membiarkan ruang kosong di dalam kartu KPI.

Instruksi untuk AI Agent: Tambahkan Sparkline (grafik garis mini) yang sangat tipis dan pudar di bagian bawah (background) kartu "Total Omset" atau "Jumlah Transaksi".

Ini bisa menggunakan pustaka ringan seperti Recharts (TinyLineChart) atau sekadar file SVG bergelombang statis dengan opacity 10% di pojok kanan bawah kartu.

B. Animasi "Striped" pada Progress Bar Produk Terlaris

Ubah progress bar polos menjadi progress bar bergaris miring yang bergerak secara konstan (seperti tiang tempat cukur/barbershop, tapi elegan).

Kode Tailwind untuk Elemen Bar:

<div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
  <div class="h-full bg-amber-500 rounded-full progress-striped w-[49.2%] relative"></div>
</div>


C. Efek Pulsing pada Indikator "System Online"

Indikator hijau di pojok kanan atas ("System Online") harus terasa "hidup".

Tambahkan animasi animate-pulse pada lingkaran hijaunya, atau gunakan dot berkedip seperti radar:

<span class="relative flex h-2.5 w-2.5 mr-2">
  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
</span>


3. Personalisasi & Tipografi

A. Dynamic Greeting (Sapaan Waktu)

Di atas kata "Dashboard Analitik", tambahkan sapaan yang berubah sesuai jam sistem perangkat admin. Ini memberikan kesan aplikasi yang "pintar".

Pagi (05:00 - 11:59): Selamat Pagi, Admin ☀️

Siang (12:00 - 14:59): Selamat Siang, Admin 🌤️

Sore (15:00 - 18:59): Selamat Sore, Admin 🌅

Malam (19:00 - 04:59): Selamat Malam, Admin 🌙

Styling: Gunakan warna teks abu-abu lembut (text-slate-500 text-sm font-medium).

B. Ikonografi yang Lebih Berani (Bold Icons)

Gunakan versi dua warna (duotone) atau ikon dengan background lingkaran membulat (rounded square) untuk ikon-ikon di dalam kartu.

Contoh untuk Ikon Tas Belanja ("Jumlah Transaksi"):

<div class="p-3 bg-amber-50 rounded-xl">
  <svg class="w-6 h-6 text-amber-600" ... />
</div>


4. Ringkasan Kelas Animasi Tailwind Tambahan (Global CSS)

Tambahkan atau perbarui CSS Global Anda dengan utilitas berikut agar animasi bergaris dan floating berjalan lancar:

@layer utilities {
  /* Efek Mengapung */
  @keyframes floatUp {
    0%, 100% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(-3px) translateX(3px); }
  }
  .animate-float-up {
    animation: floatUp 2s ease-in-out infinite;
  }
  
  /* Progress Bar Garis Miring Bergerak */
  .progress-striped {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.15) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15) 75%,
      transparent 75%,
      transparent
    );
    background-size: 1rem 1rem;
    animation: progress-stripes 1s linear infinite;
  }
  @keyframes progress-stripes {
    from { background-position: 1rem 0; }
    to { background-position: 0 0; }
  }
}
