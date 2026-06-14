"use client";

import React from 'react';
import { HelpModal } from '@/components/ui/HelpModal';
import { BookOpen, CheckCircle, Clock, AlertTriangle, User, Settings2 } from 'lucide-react';

export function ProductionTutorial() {
  return (
    <div className="print:hidden">
      <HelpModal title="Panduan Modul Produksi" triggerText="Panduan Produksi">
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><BookOpen className="w-4 h-4"/> 1. Cara Membaca Kanban</h3>
            <p className="mb-2">Halaman utama Produksi menggunakan sistem papan Kanban. Ada 3 kolom utama:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li><b>Pesanan Masuk:</b> Pesanan baru yang dikirim oleh divisi Sales. Cek stok bahan sebelum menjadwalkan.</li>
              <li><b>Antrean Produksi:</b> Pesanan siap diproses. Klik &quot;Mulai Panggang&quot; saat adonan masuk ke oven.</li>
              <li><b>Sedang Dipanggang:</b> Kue sedang dimasak. Klik &quot;Selesai&quot; saat kue diangkat dan siap dioper ke bagian Packing.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><Settings2 className="w-4 h-4"/> 2. Pengaturan BOM & Kebutuhan Adonan</h3>
            <p className="mb-2">Agar sistem bisa menghitung estimasi waktu dan kebutuhan bahan, Anda harus mengatur resep (BOM) terlebih dahulu:</p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Pindah ke tab <b>&quot;Kebutuhan Adonan & Bahan&quot;</b>.</li>
              <li>Klik tombol peringatan kuning (Pengaturan Resep).</li>
              <li>Isi <b>Base Dough</b> (jenis adonan dasar), <b>Berat per Pcs</b>, <b>Lama Panggang</b>, dan <b>Kapasitas Oven</b>.</li>
              <li>Setelah diatur, sistem otomatis menjumlahkan berapa kg adonan Croissant/Danish yang harus Anda buat hari itu.</li>
            </ol>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><CheckCircle className="w-4 h-4"/> 3. Target Produk, Reject & QC</h3>
            <p className="mb-2">Di tab <b>&quot;Target Produk&quot;</b>, Anda akan melihat kartu-kartu per hari:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li><b>Progres:</b> Gunakan tombol <code>+</code> untuk menambah jumlah produk matang, atau ketik angkanya langsung.</li>
              <li><b>Reject (<AlertTriangle className="w-3 h-3 inline"/>):</b> Jika ada kue gosong/cacat, tambahkan di sini. <i>Yield</i> (tingkat kesuksesan) akan dihitung otomatis.</li>
              <li><b>Lolos QC:</b> Tombol <b>MAX</b> (menyelesaikan 100% target seketika) hanya bisa ditekan jika Anda sudah menceklis kotak <b>Lolos QC</b>.</li>
              <li><b>Penugasan (<User className="w-3 h-3 inline"/>):</b> Ketik nama koki/PIC yang bertanggung jawab memanggang produk tersebut.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><Clock className="w-4 h-4"/> 4. Laporan & Timer</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
              <li><b>Timer Produksi:</b> Ada tombol jam melayang di sudut kanan bawah. Gunakan ini untuk menghitung waktu <i>proofing</i> atau waktu oven. Alarm akan berbunyi saat waktu habis.</li>
              <li><b>Laporan Harian:</b> Di bagian atas, tekan tombol <b>&quot;Laporan Harian&quot;</b> untuk merekap pekerjaan hari ini menjadi dokumen rapi (PDF) untuk dilaporkan ke Manajer.</li>
            </ul>
          </section>

        </div>
      </HelpModal>
    </div>
  );
}
