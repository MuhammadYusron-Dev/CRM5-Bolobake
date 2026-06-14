"use client";

import React from 'react';
import { HelpModal } from '@/components/ui/HelpModal';
import { PackageCheck, Truck, CheckCircle2 } from 'lucide-react';

export function PackingTutorial() {
  return (
    <div className="print:hidden">
      <HelpModal title="Panduan Modul Packing & Delivery" triggerText="Panduan Packing">
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><PackageCheck className="w-4 h-4"/> 1. Siap Packing</h3>
            <p className="mb-2">Pesanan yang telah selesai diproduksi akan masuk ke kolom ini.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Tim Packing harus menyiapkan kotak, kemasan, dan melengkapi pesanan.</li>
              <li>Perhatikan <b>Catatan Pengiriman</b> jika ada (misal: &quot;Gunakan box khusus ulang tahun&quot;).</li>
              <li>Setelah semua siap dikirim, klik tombol <b>&quot;Kirim via Kurir&quot;</b>.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><Truck className="w-4 h-4"/> 2. Dalam Pengiriman</h3>
            <p className="mb-2">Pesanan di kolom ini sedang dalam perjalanan menuju klien.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Pastikan resi atau kurir sudah dikonfirmasi.</li>
              <li>Tunggu konfirmasi dari klien bahwa pesanan telah diterima dengan baik.</li>
              <li>Klik tombol <b>&quot;Pesanan Diterima&quot;</b> untuk menyelesaikan pesanan.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><CheckCircle2 className="w-4 h-4"/> 3. Selesai (Diterima)</h3>
            <p className="mb-2">Pesanan yang sudah sampai ke pelanggan dan diselesaikan akan berada di kolom ini.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Status ini adalah tahap akhir dari siklus pesanan.</li>
              <li>Data akan terekam secara permanen di riwayat pesanan (Dashboard) beserta timestamps pengiriman.</li>
            </ul>
          </section>

        </div>
      </HelpModal>
    </div>
  );
}
