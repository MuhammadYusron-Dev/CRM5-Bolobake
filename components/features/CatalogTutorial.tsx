"use client";

import React from 'react';
import { HelpModal } from '@/components/ui/HelpModal';
import { Package, ScanLine, Edit, History } from 'lucide-react';

export function CatalogTutorial() {
  return (
    <div className="print:hidden">
      <HelpModal title="Panduan Modul Catalog Manager" triggerText="Panduan Katalog">
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><Package className="w-4 h-4"/> 1. Database Katalog</h3>
            <p className="mb-2">Ini adalah daftar seluruh produk/SKU yang tersedia.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Gunakan kolom pencarian untuk menemukan produk dengan cepat.</li>
              <li>Klik tombol <b>Aktif/Nonaktif</b> untuk menyembunyikan produk dari form pemesanan.</li>
              <li>Anda bisa mengedit atau menghapus produk melalui tombol aksi di sebelah kanan.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><ScanLine className="w-4 h-4"/> 2. AI Scanner</h3>
            <p className="mb-2">Fitur untuk memasukkan produk secara otomatis dari gambar/PDF.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Unggah file daftar harga atau menu Anda.</li>
              <li>Sistem AI akan otomatis membaca nama, harga, dan kategori produk.</li>
              <li>Review hasilnya, centang produk yang ingin disimpan, lalu klik <b>Simpan</b>.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><Edit className="w-4 h-4"/> 3. Input Manual</h3>
            <p className="mb-2">Jika AI tidak mendeteksi atau Anda hanya ingin menambahkan 1-2 item:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>Gunakan tab <b>Input Manual</b>.</li>
              <li>Isi Nama Produk, Kategori, Harga, dan Satuan, lalu klik <b>Tambahkan Produk Baru</b>.</li>
            </ul>
          </section>

          <section className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-primary"><History className="w-4 h-4"/> 4. Riwayat & Undo</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
              <li>Jika Anda tidak sengaja menghapus atau mengubah produk, klik tombol <b>Undo</b> di sudut kanan atas tabel.</li>
              <li>Gunakan tombol berikon <b>jam (History)</b> untuk melihat riwayat aksi terakhir yang bisa dibatalkan.</li>
            </ul>
          </section>

        </div>
      </HelpModal>
    </div>
  );
}
