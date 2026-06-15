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
      colorClass: 'bg-orange-100 text-orange-900 border-orange-200'
    },
    {
      id: 'delivery',
      title: 'Dalam Pengiriman',
      statuses: ['Delivery'],
      actionLabel: 'Pesanan Diterima',
      nextStatus: 'Diterima',
      colorClass: 'bg-teal-100 text-teal-900 border-teal-200'
    },
    {
      id: 'selesai',
      title: 'Selesai (Diterima)',
      statuses: ['Diterima'],
      colorClass: 'bg-green-100 text-green-900 border-green-200'
    }
  ];

  return (
    <div className="h-full flex flex-col -m-4 sm:-m-6 lg:-m-8">
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
