"use client";

import React, { useEffect, useState } from 'react';
import { KanbanBoard, ColumnDef } from '@/components/features/KanbanBoard';
import { ProductionTimers } from '@/components/features/ProductionTimers';
import { ProductionTutorial } from '@/components/features/ProductionTutorial';

export function ProductionBoard({ initialOrders }: { initialOrders: any[] }) {
  const columns: ColumnDef[] = [
    {
      id: 'masuk',
      title: 'Pesanan Masuk',
      description: 'Daftar pesanan baru. Pastikan stok bahan cukup sebelum menekan konfirmasi jadwal.',
      statuses: ['Pesanan Dibuat'],
      actionLabel: 'Konfirmasi (Jadwalkan)',
      nextStatus: 'Dikonfirmasi',
      colorClass: 'bg-slate-200/50 text-slate-800'
    },
    {
      id: 'antrean',
      title: 'Antrean Produksi',
      description: 'Pesanan siap produksi. Klik "Mulai Panggang" HANYA SAAT adonan fisik benar-benar masuk ke oven.',
      statuses: ['Dikonfirmasi'],
      actionLabel: 'Mulai Panggang',
      nextStatus: 'Produksi',
      colorClass: 'bg-blue-100 text-blue-900 border-blue-200'
    },
    {
      id: 'produksi',
      title: 'Sedang Dipanggang',
      description: 'Proses pemanggangan. Klik "Selesai" HANYA JIKA kue telah matang, diangkat, dan siap dioper ke tim Packing.',
      statuses: ['Produksi'],
      actionLabel: 'Selesai & Oper ke Packing',
      nextStatus: 'Packing',
      colorClass: 'bg-purple-100 text-purple-900 border-purple-200'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <KanbanBoard 
        initialOrders={initialOrders}
        columns={columns}
        divisionName="Produksi"
        icon="produksi"
        showOverview={true}
        extraHeaderAction={<ProductionTutorial />}
      />
      <ProductionTimers />
    </div>
  );
}
