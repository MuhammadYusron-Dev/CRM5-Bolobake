"use client";

import React from 'react';
import { HelpModal } from '@/components/ui/HelpModal';
import { PlusCircle, Search, LayoutDashboard, Send } from 'lucide-react';

export function SalesTutorial() {
  return (
    <div className="print:hidden">
      <HelpModal title="Panduan Modul Sales / Dashboard" triggerText="Panduan Sales">
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><PlusCircle className="w-4 h-4"/> 1. Buat Pesanan Baru</h3>
            <p className="mb-2">Gunakan menu ini untuk memasukkan order dari klien B2B.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Pilih pelanggan dan tentukan tanggal pengiriman & produksi.</li>
              <li>Pilih produk dari katalog yang tersedia dan tentukan jumlahnya.</li>
              <li>Sistem akan otomatis menghitung estimasi harga berdasarkan data katalog.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><Send className="w-4 h-4"/> 2. Meneruskan ke Produksi</h3>
            <p className="mb-2">Setelah pesanan dibuat, pesanan tersebut akan masuk ke <b>Riwayat Pesanan</b>:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Temukan pesanan yang statusnya masih <i>Pesanan Dibuat</i>.</li>
              <li>Pastikan DP atau pembayaran awal telah diterima jika diperlukan.</li>
              <li>Pesanan ini akan langsung terlihat oleh Divisi Produksi di kolom <i>Pesanan Masuk</i> pada papan Kanban mereka.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><Search className="w-4 h-4"/> 3. Melacak Riwayat Pesanan</h3>
            <p className="mb-2">Di menu <b>Riwayat Pesanan</b>, Anda dapat:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Memantau status tiap pesanan secara <i>real-time</i> (Dikonfirmasi, Sedang Produksi, dll).</li>
              <li>Mengedit pesanan (jika masih memungkinkan).</li>
              <li>Membuat ulang pesanan yang sama <i>(Reorder)</i> untuk klien rutin.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><LayoutDashboard className="w-4 h-4"/> 4. Dashboard Analitik</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
              <li>Pantau metrik utama seperti <b>Total Omzet</b>, <b>Pesanan Aktif</b>, dan performa <b>Top Produk</b>.</li>
              <li>Gunakan filter tanggal di bagian atas untuk melihat laporan pada periode tertentu.</li>
            </ul>
          </section>

        </div>
      </HelpModal>
    </div>
  );
}
