awaban untuk Open Questions
1. Fluid Typography diterapkan ke mana?

Rekomendasi: Terapkan ke seluruh sistem.

Jangan hanya heading.

Karena problem zoom browser sebenarnya tidak hanya terjadi pada layout, tetapi juga pada:

Badge
Button
Table cell
Sidebar menu
Form input
Search bar
Empty state

Kalau heading sudah fluid tetapi badge masih 12px fixed, saat zoom 125%-150% proporsi UI tetap terasa aneh.

Saya akan minta agent melakukan:

--text-xs
--text-sm
--text-base
--text-lg
--text-xl
--text-2xl
--text-3xl

lalu seluruh design system menggunakan token tersebut.

Contoh:

text-[length:var(--text-sm)]

bukan

text-sm
2. Sidebar behavior

Saya tidak menyarankan mempertahankan model sekarang.

Saat ini:

Mobile
= Overlay

Desktop
= Fixed

Ini masih oke untuk aplikasi kecil.

Untuk CRM enterprise:

Mobile (<1024)
Overlay

Laptop (1024-1440)
Collapsible

Desktop (1440+)
Persistent

Ultrawide (1920+)
Persistent + expanded

Contoh:

clamp(220px,16vw,280px)

sudah sangat bagus.

Saya bahkan akan tambahkan:

--sidebar-expanded
--sidebar-collapsed

agar nanti mudah ketika user ingin mode fokus.

Fase yang Menurutku Masih Kurang

Agent-mu belum menyentuh hal yang paling sering menyebabkan layout pecah:

Fase 5 — Container Query Architecture

Tambahkan ke prompt:

Implement Container Queries.

Do not rely only on viewport breakpoints.

Every major module must adapt based on available container width.

Examples:

History Card
CRM Panel
Dashboard Widget
Analytics Card

Use:

container-type: inline-size;

@container (max-width: 700px) {
  ...
}

Karena nanti ketika ada:

Sidebar Expanded
Sidebar Collapsed
Split Screen
Multi Panel

layout tetap adaptif.

Fase 6 — Design Token System

Saat ini masih pakai Tailwind utility campuran.

Untuk skala enterprise:

:root {
  --space-xs
  --space-sm
  --space-md
  --space-lg

  --radius-sm
  --radius-md
  --radius-lg

  --text-xs
  --text-sm
  --text-base

  --sidebar-width
  --header-height

  --card-padding
}

Lalu semua komponen mengambil dari token.

Bukan hardcoded.

Fase 7 — Zoom Stress Test Automation

Ini yang biasanya dilewatkan AI agent.

Tambahkan instruksi:

Create Playwright tests for:

80%
90%
100%
110%
125%
150%

Verify:

No horizontal scroll
No clipped text
No overlapping cards
No hidden buttons
No sidebar overflow
No table breaking

Karena kalau hanya manual testing, nanti setiap update UI kamu harus cek satu-satu lagi.