export interface VisualProduct {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  gambar: string;
  spesifikasi: string;
  masaSimpan: string;
  saranPenyajian: string;
}

export const visualCatalogData: VisualProduct[] = [
  // PASTRY
  {
    id: "VC-P01",
    nama: "Almond Croissant",
    kategori: "PASTRY",
    harga: 35000,
    gambar: "https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Croissant klasik dengan isian krim almond yang lembut dan taburan almond panggang renyah di atasnya.",
    masaSimpan: "2 hari dalam suhu ruang, 5 hari dalam chiller.",
    saranPenyajian: "Panaskan dalam oven 150°C selama 3-5 menit sebelum dihidangkan untuk tekstur yang kembali renyah."
  },
  {
    id: "VC-P02",
    nama: "Butter Croissant",
    kategori: "PASTRY",
    harga: 25000,
    gambar: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Croissant berlapis dengan mentega premium (French Butter), tekstur luar yang garing dan bagian dalam yang lembut (honeycomb sempurna).",
    masaSimpan: "2 hari dalam suhu ruang.",
    saranPenyajian: "Sangat cocok dinikmati dengan kopi atau teh hangat di pagi hari."
  },
  {
    id: "VC-P03",
    nama: "Pain au Chocolat",
    kategori: "PASTRY",
    harga: 30000,
    gambar: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Viennoiserie klasik Prancis yang berisi cokelat batangan semi-manis berkualitas tinggi.",
    masaSimpan: "2 hari dalam suhu ruang.",
    saranPenyajian: "Sajikan hangat agar cokelat di dalamnya sedikit meleleh."
  },
  {
    id: "VC-P04",
    nama: "Cinnamon Roll",
    kategori: "PASTRY",
    harga: 28000,
    gambar: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Roti gulung kayu manis dengan glaze gula dan cream cheese manis.",
    masaSimpan: "3 hari dalam suhu ruang tertutup rapat.",
    saranPenyajian: "Panaskan microwave selama 15 detik untuk mendapatkan kelembutan maksimal."
  },

  // DESSERT
  {
    id: "VC-D01",
    nama: "Classic Tiramisu",
    kategori: "DESSERT",
    harga: 45000,
    gambar: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Dessert khas Italia berlapis ladyfinger yang direndam kopi espresso, dengan mascarpone cream dan taburan bubuk kakao murni.",
    masaSimpan: "3-4 hari dalam kulkas (wajib dingin).",
    saranPenyajian: "Sajikan dalam keadaan dingin langsung dari chiller."
  },
  {
    id: "VC-D02",
    nama: "Strawberry Shortcake",
    kategori: "DESSERT",
    harga: 55000,
    gambar: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Kue spons vanilla yang sangat lembut berlapis fresh cream ringan dan potongan strawberry segar.",
    masaSimpan: "2 hari dalam kulkas.",
    saranPenyajian: "Potong selagi dingin dengan pisau yang dipanaskan sedikit agar potongannya rapi."
  },
  {
    id: "VC-D03",
    nama: "Matcha Opera Cake",
    kategori: "DESSERT",
    harga: 60000,
    gambar: "https://images.unsplash.com/photo-1605335133611-fb457bb9f1cd?q=80&w=600&auto=format&fit=crop", // using generic green cake/dessert
    spesifikasi: "Layer cake elegan dengan Joconde sponge rasa matcha, matcha buttercream, dan dark chocolate ganache.",
    masaSimpan: "5 hari dalam kulkas.",
    saranPenyajian: "Biarkan di suhu ruang 10 menit sebelum disantap agar buttercream lebih lumer."
  },

  // BREAD
  {
    id: "VC-B01",
    nama: "Sourdough Loaf",
    kategori: "BREAD",
    harga: 65000,
    gambar: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Roti artisan dengan ragi alami (wild yeast), memiliki kerak (crust) yang garing dan remah (crumb) yang kenyal dengan rasa sedikit asam otentik.",
    masaSimpan: "4 hari pada suhu ruang, bisa dibekukan hingga 1 bulan.",
    saranPenyajian: "Iris tipis, panggang sebentar, sajikan dengan butter atau olive oil & balsamic."
  },
  {
    id: "VC-B02",
    nama: "Baguette Tradisional",
    kategori: "BREAD",
    harga: 25000,
    gambar: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Roti Prancis klasik panjang dengan crust yang tebal & renyah serta tekstur dalam yang kenyal.",
    masaSimpan: "Terbaik dikonsumsi di hari yang sama. Maksimal 2 hari.",
    saranPenyajian: "Gunakan untuk membuat sandwich atau garlic bread."
  },
  {
    id: "VC-B03",
    nama: "Multigrain Whole Wheat",
    kategori: "BREAD",
    harga: 48000,
    gambar: "https://images.unsplash.com/photo-1549931311-4796102288db?q=80&w=600&auto=format&fit=crop",
    spesifikasi: "Roti gandum utuh yang sehat dengan campuran biji-bijian (sunflower, flaxseed, chia) yang kaya serat.",
    masaSimpan: "5 hari di suhu ruang dalam wadah kedap udara.",
    saranPenyajian: "Sangat pas untuk toast pagi hari dipadukan dengan selai kacang atau alpukat tumbuk."
  }
];
