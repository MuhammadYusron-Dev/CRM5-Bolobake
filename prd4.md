Konteks Proyek: Aplikasi Bolobake B2B CRM. Kita perlu memperbarui dropdown pilihan "Informasi Customer" di form pemesanan menggunakan data nama outlet terbaru. Selain itu, kita akan menerapkan dasar fitur "Customer Tier Auto-Pricing", namun dengan pendekatan yang sangat sederhana: Logika Kondisional (Exception-based).

Tugas 1: Integrasikan Database Customer Baru

Tolong ganti list customer lama/dummy di dalam state atau konstanta dengan array of objects di bawah ini. Saya sudah menambahkan property tier: "STANDARD" untuk semuanya sebagai default.



const CUSTOMER_LIST = [

  { id: 1, name: "KENTANGGIHAN", tier: "STANDARD" },

  { id: 2, name: "DAPOERBARRU", tier: "STANDARD" },

  { id: 3, name: "BINNA COFFEE", tier: "STANDARD" },

  { id: 4, name: "LOOM COFFEE", tier: "STANDARD" },

  { id: 5, name: "KOPI STARLA", tier: "STANDARD" },

  { id: 6, name: "LATAR LAWU", tier: "STANDARD" },

  { id: 7, name: "KAFE LOKKA", tier: "STANDARD" },

  { id: 8, name: "BYUSS CAKERY", tier: "STANDARD" },

  { id: 9, name: "HANS COFFEE", tier: "STANDARD" },

  { id: 10, name: "TENTREM BUMI", tier: "STANDARD" },

  { id: 11, name: "SOCIALLATE (NEW)", tier: "STANDARD" },

  { id: 12, name: "NATAHATI COFFEE", tier: "STANDARD" },

  { id: 13, name: "PAMOR COFFEE", tier: "STANDARD" },

  { id: 14, name: "VINZ COFFEE", tier: "STANDARD" },

  { id: 15, name: "PADEL BEANS", tier: "STANDARD" },

  { id: 16, name: "SUNRISE COFFEE BYL", tier: "STANDARD" },

  { id: 17, name: "SUAKA", tier: "STANDARD" },

  { id: 18, name: "BARBERTOLOGY SMG", tier: "STANDARD" },

  { id: 19, name: "NOS COFFEE", tier: "STANDARD" },

  { id: 20, name: "BURGER TENTREM", tier: "STANDARD" },

  { id: 21, name: "MBG BANJARSARI KADIPIRO", tier: "STANDARD" },

  { id: 22, name: "KAK FIRDA", tier: "STANDARD" },

  { id: 23, name: "KOPI LAWANG PARI", tier: "STANDARD" },

  { id: 24, name: "FROSHMILK", tier: "STANDARD" },

  { id: 25, name: "SOCIELLE", tier: "STANDARD" },

  { id: 26, name: "DICKY MART / DEEBA CAFÉ", tier: "STANDARD" },

  { id: 27, name: "MODJOLA COFFEE", tier: "STANDARD" },

  { id: 28, name: "FRANGIPANI", tier: "STANDARD" },

  { id: 29, name: "TEH NDORO DONKER", tier: "STANDARD" },

  { id: 30, name: "LOVELY KITCHEN", tier: "STANDARD" },

  { id: 31, name: "KONEKSI SRAGEN", tier: "STANDARD" },

  { id: 32, name: "SHELLINA", tier: "STANDARD" },

  { id: 33, name: "FRACTAL COFFEE", tier: "STANDARD" },

  { id: 34, name: "PLANET STAR", tier: "STANDARD" },

  { id: 35, name: "LESUNG PIPI", tier: "STANDARD" },

  { id: 36, name: "KOPI LAWENAM", tier: "STANDARD" },

  { id: 37, name: "DWA HQ", tier: "STANDARD" },

  { id: 38, name: "OFFICE", tier: "STANDARD" },

  { id: 39, name: "BARBERTOLOGY SLO", tier: "STANDARD" },

  { id: 40, name: "TEPI LANGIT", tier: "STANDARD" },

  { id: 41, name: "THE GLAD HAND", tier: "STANDARD" },

  { id: 42, name: "VESSCO COFFEE", tier: "STANDARD" },

  { id: 43, name: "5:30 COFFEE", tier: "STANDARD" },

  { id: 44, name: "MY AKSA", tier: "STANDARD" },

  { id: 45, name: "HAMS", tier: "STANDARD" },

  { id: 46, name: "KAMPUNG ALIT", tier: "STANDARD" },

  { id: 47, name: "SAMADENGAN COFFEE", tier: "STANDARD" },

  { id: 48, name: "DANJO", tier: "STANDARD" },

  { id: 49, name: "ALOO SPACE", tier: "STANDARD" },

  { id: 50, name: "HAGIA COFFEE", tier: "STANDARD" },

  { id: 51, name: "KOPI PRO", tier: "STANDARD" },

  { id: 52, name: "DAPUR SOLO", tier: "STANDARD" },

  { id: 53, name: "PRATTER CROFFEE", tier: "STANDARD" },

  { id: 54, name: "KOPI SADE", tier: "STANDARD" },

  { id: 55, name: "BARBERTOLOGY TEGAL", tier: "STANDARD" },

  { id: 56, name: "MARAU COFFEE", tier: "STANDARD" },

  { id: 57, name: "GETTSEE COFFEE", tier: "STANDARD" },

  { id: 58, name: "KAVARNA", tier: "STANDARD" },

  { id: 59, name: "DELIMALA", tier: "STANDARD" },

  { id: 60, name: "NEXT COFFEE", tier: "STANDARD" },

  { id: 61, name: "HANOMAN SERENITY", tier: "STANDARD" },

  { id: 62, name: "KOPI TANGGA PUTAR", tier: "STANDARD" },

  { id: 63, name: "MOONCHA MATCHA", tier: "STANDARD" },

  { id: 64, name: "SOGARU", tier: "STANDARD" },

  { id: 65, name: "MAA COFFEE", tier: "STANDARD" },

  { id: 66, name: "AMOR COFFEE", tier: "STANDARD" },

  { id: 67, name: "COFFEIN", tier: "STANDARD" },

  { id: 68, name: "NAUKA COFFEE", tier: "STANDARD" },

  { id: 69, name: "AROMA COFFEE", tier: "STANDARD" },

  { id: 70, name: "SELARAS COFFEE", tier: "STANDARD" },

  { id: 71, name: "KOKONO EATERY", tier: "STANDARD" },

  { id: 72, name: "HARMET POINT", tier: "STANDARD" },

  { id: 73, name: "RIWEN", tier: "STANDARD" },

  { id: 74, name: "AIDA DWI", tier: "STANDARD" },

  { id: 75, name: "KAK ELMI", tier: "STANDARD" },

  { id: 76, name: "TOSERBA MAKARIMA", tier: "STANDARD" },

  { id: 77, name: "ALL TIMES COFFEE", tier: "STANDARD" },

  { id: 78, name: "ANAK PANAH SOBA", tier: "STANDARD" },

  { id: 79, name: "MAKALU", tier: "STANDARD" },

  { id: 80, name: "523 HUB", tier: "STANDARD" },

  { id: 81, name: "HAUST", tier: "STANDARD" },

  { id: 82, name: "RATORYS TEA HOUSE", tier: "STANDARD" },

  { id: 83, name: "WAHIDIN COFFEE", tier: "STANDARD" },

  { id: 84, name: "TENGGIR COFFEE", tier: "STANDARD" },

  { id: 85, name: "TUAN KOPI", tier: "STANDARD" },

  { id: 86, name: "TITIK KOMA", tier: "STANDARD" },

  { id: 87, name: "VALUE COFFEE", tier: "STANDARD" },

  { id: 88, name: "RUSTIC COFFEE", tier: "STANDARD" },

  { id: 89, name: "KOITO BATU", tier: "STANDARD" },

  { id: 90, name: "GARASA TEDUH", tier: "STANDARD" },

  { id: 91, name: "ADLER", tier: "STANDARD" },

  { id: 92, name: "MH CAFE", tier: "STANDARD" },

  { id: 93, name: "DISTRIK COFFEE", tier: "STANDARD" },

  { id: 94, name: "KOBAIN COFFEE", tier: "STANDARD" },

  { id: 95, name: "INSIGHT COFFEE SMG", tier: "STANDARD" },

  { id: 96, name: "LAWU KALA SENJA", tier: "STANDARD" },

  { id: 97, name: "SAREH COFFEE", tier: "STANDARD" },

  { id: 98, name: "KAK INTAN", tier: "STANDARD" },

  { id: 99, name: "AZANA BOUTIQUE HOTEL", tier: "STANDARD" },

  { id: 100, name: "CHEF AGUNG", tier: "STANDARD" },

  { id: 101, name: "ZEZI COFFEE", tier: "STANDARD" },

  { id: 102, name: "NOTA COFFEE", tier: "STANDARD" },

  { id: 103, name: "KOPI PASIR BENGAWAN", tier: "STANDARD" },

  { id: 104, name: "SELERA KOPI", tier: "STANDARD" },

  { id: 105, name: "TOMU", tier: "STANDARD" },

  { id: 106, name: "ANTICOVEE SALATIGA", tier: "STANDARD" },

  { id: 107, name: "ARUNIKA COFFEE", tier: "STANDARD" },

  { id: 108, name: "COZY COFFEE", tier: "STANDARD" },

  { id: 109, name: "CURRY SAMURAI", tier: "STANDARD" },

  { id: 110, name: "RANAKA", tier: "STANDARD" },

  { id: 111, name: "STEEL HOUSE", tier: "STANDARD" },

  { id: 112, name: "KOPI KUSUMA SOLO", tier: "STANDARD" },

  { id: 113, name: "ARMEY KITCHEN", tier: "STANDARD" },

  { id: 114, name: "THREEA COFFEE", tier: "STANDARD" },

  { id: 115, name: "TETRA MIZU", tier: "STANDARD" },

  { id: 116, name: "SEWU HATI", tier: "STANDARD" },

  { id: 117, name: "PASMING", tier: "STANDARD" },

  { id: 118, name: "AIMER COFFEE", tier: "STANDARD" },

  { id: 119, name: "BU ROSA", tier: "STANDARD" },

  { id: 120, name: "DOUBLE DECKER", tier: "STANDARD" },

  { id: 121, name: "ALDO", tier: "STANDARD" },

  { id: 122, name: "JASTY GARDEN", tier: "STANDARD" }

];

Tugas 2: Implementasi Logika Harga Kondisional (Conditional Pricing)

Saat ini hampir 100% outlet memakai harga standar. Jadi jangan buat form harga menjadi disabled/read-only dulu, tetap biarkan admin bisa mengedit harga jika diperlukan.

Tolong terapkan helper function sederhana untuk logika harga saat user memilih produk dari SKU:



Buat pengecualian harga khusus berbasis tier dan sku. Sebagai contoh dummy saat ini, siapkan fungsi getSkuPrice(skuCode, customerTier):

Jika customerTier === "STANDARD", kembalikan harga dasar dari katalog SKU (harga biasa).

Jika nanti ada customer yang kita ubah datanya menjadi tier: "SPECIAL_A", maka fungsi ini akan mengembalikan harga khusus jika ada, atau fallback ke harga dasar.

Ketika admin menambah baris produk baru dan sudah memilih SKU, field "Harga Satuan" akan otomatis terisi dengan nilai yang di-return oleh fungsi getSkuPrice tersebut.

Tujuan: Dengan struktur ini, kode kita sudah siap (future-proof). Kapan pun owner ingin memberikan harga khusus ke salah satu kafe (misal LOOM COFFEE), kita tinggal mengubah properti tier di data CUSTOMER_LIST dari "STANDARD" ke tier khusus, lalu menambahkan dictionary harganya, tanpa merombak ulang form pesanan.