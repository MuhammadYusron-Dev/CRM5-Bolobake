"use client";

import React from 'react';
import { KanbanBoard, ColumnDef } from '@/components/features/KanbanBoard';
import { PackingTutorial } from '@/components/features/PackingTutorial';

export function PackingBoard({ initialOrders }: { initialOrders: any[] }) {
  const columns: ColumnDef[] = [
    {
      id: 'packing',
      title: 'Siap Packing',
      statuses: ['Packing'],
      actionLabel: 'Kirim via Kurir',
      nextStatus: 'Delivery',
      colorClass: 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white border-transparent shadow-md'
    },
    {
      id: 'delivery',
      title: 'Dalam Pengiriman',
      statuses: ['Delivery'],
      actionLabel: 'Pesanan Diterima',
      nextStatus: 'Diterima',
      colorClass: 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white border-transparent shadow-md'
    },
    {
      id: 'selesai',
      title: 'Selesai (Diterima)',
      statuses: ['Diterima'],
      colorClass: 'bg-gradient-to-br from-orange-500 to-red-500 text-white border-transparent shadow-md'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <KanbanBoard 
        initialOrders={initialOrders}
        columns={columns}
        divisionName="Packing & Delivery"
        icon="packing"
        extraHeaderAction={<PackingTutorial />}
      />
    </div>
  );
}
