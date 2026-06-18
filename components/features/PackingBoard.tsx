"use client";

import React from 'react';
import { KanbanBoard, ColumnDef } from '@/components/features/KanbanBoard';
import { PackingTutorial } from '@/components/features/PackingTutorial';

export function PackingBoard({ initialOrders, currentUser }: { initialOrders: any[], currentUser?: { userId: string; name: string; role: string } | null }) {
  const columns: ColumnDef[] = [
    {
      id: 'packing_masuk',
      title: 'Menunggu Packing',
      filterFn: (o: any) => o.currentStage === 'PACKING' && o.currentState === 'WAITING',
      colorClass: 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white border-transparent shadow-md'
    },
    {
      id: 'packing_proses',
      title: 'Sedang Dipacking',
      filterFn: (o: any) => o.currentStage === 'PACKING' && (o.currentState === 'IN_PROGRESS' || o.currentState === 'ACCEPTED' || o.currentState === 'QC_PENDING'),
      colorClass: 'bg-gradient-to-br from-indigo-600 to-purple-500 text-white border-transparent shadow-md'
    },
    {
      id: 'delivery',
      title: 'Pengiriman (Kurir)',
      filterFn: (o: any) => o.currentStage === 'DELIVERY' && o.currentState !== 'COMPLETED',
      colorClass: 'bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white border-transparent shadow-md'
    },
    {
      id: 'selesai',
      title: 'Selesai Dikirim',
      filterFn: (o: any) => o.currentState === 'COMPLETED' || o.currentStage === 'COMPLETED',
      colorClass: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-transparent shadow-md'
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
        currentUser={currentUser}
      />
    </div>
  );
}
