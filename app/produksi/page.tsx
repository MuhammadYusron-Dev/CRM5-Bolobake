import { GET as getOrders } from '@/app/api/orders/route';
import { KanbanBoard, ColumnDef } from '@/components/features/KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function ProduksiPage() {
  let initialOrders = [];

  try {
    const resOrders = await getOrders();
    const orderData = await resOrders.json();
    if (orderData.success) initialOrders = orderData.data;
  } catch (e) {
    console.error("Failed to fetch orders:", e);
  }

  const columns: ColumnDef[] = [
    {
      id: 'masuk',
      title: 'Pesanan Masuk',
      statuses: ['Pesanan Dibuat'],
      actionLabel: 'Konfirmasi (Jadwalkan)',
      nextStatus: 'Dikonfirmasi',
      colorClass: 'bg-slate-200/50 text-slate-800'
    },
    {
      id: 'antrean',
      title: 'Antrean Produksi',
      statuses: ['Dikonfirmasi'],
      actionLabel: 'Mulai Panggang',
      nextStatus: 'Produksi',
      colorClass: 'bg-blue-100 text-blue-900 border-blue-200'
    },
    {
      id: 'produksi',
      title: 'Sedang Dipanggang',
      statuses: ['Produksi'],
      actionLabel: 'Selesai & Oper ke Packing',
      nextStatus: 'Packing',
      colorClass: 'bg-purple-100 text-purple-900 border-purple-200'
    }
  ];

  return (
    <main className="h-screen overflow-hidden">
      <KanbanBoard 
        initialOrders={initialOrders}
        columns={columns}
        divisionName="Produksi"
        icon="produksi"
        showOverview={true}
      />
    </main>
  );
}
