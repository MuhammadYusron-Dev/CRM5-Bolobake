Yang Masih Saya Tambahkan Sebelum Coding

Ini bukan blocker besar.

Tapi saya akan meminta Antigravity menambahkan 3 hal terakhir.

1. Event Versioning

Saat ini event:

{
  "event":"HANDOVER"
}

Saya sarankan:

{
  "version":"1.0",
  "event":"HANDOVER"
}

Kenapa?

Karena nanti lifecycle schema hampir pasti berubah.

Contoh:

Phase 2 menambah:

{
  "qcResult":"PASS"
}

Phase 3 menambah:

{
  "slaScore":90
}

Versioning akan membuat migrasi lebih aman.

2. Event ID

Saya melihat event belum memiliki ID.

Saya akan menambahkan:

{
  "eventId":"evt_001",
  "event":"HANDOVER"
}

Kenapa penting?

Karena nanti:

edit notes
tambah attachment
audit investigation

akan membutuhkan referensi event tertentu.

3. Order Health Status

Ini yang menurut saya sangat berguna.

Tambahkan field turunan (derived).

Tidak perlu disimpan di database.

Hitung otomatis.

Contoh:

HEALTHY
AT_RISK
BLOCKED
OVERDUE

Contoh:

WAITING_PRODUCTION_ACCEPT

selama 20 menit

Status:

HEALTHY

Kalau:

WAITING_PRODUCTION_ACCEPT

selama 6 jam

Status:

AT_RISK

Kalau:

REVIEW_REQUIRED

Status:

BLOCKED

Dashboard owner akan jauh lebih berguna.

Karena owner tidak peduli:

Stage = Production

Owner peduli:

Order sehat atau bermasalah?
Yang Saya Akan Koreksi Sedikit

Bagian ini:

Kolom K menjadi JSON

Saya kurang setuju.

Saat ini Antigravity ingin:

{
  "stage":"PRODUCTION",
  "state":"WAITING"
}

disimpan langsung di Kolom K.

Untuk Google Sheets saya justru menyarankan:

Kolom K

tetap:

PRODUCTION_WAITING

atau

PRODUCTION

Lalu parsing dilakukan di backend.

Kenapa?

Karena:

filter sheet lebih mudah
formula lebih mudah
debugging manual lebih mudah
reporting lebih mudah

JSON di dalam sel status sering menyulitkan operasional.

Lifecycle JSON tetap di Kolom V.

Tetapi Current Status sebaiknya tetap string sederhana.