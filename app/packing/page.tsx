import { GET as getOrders } from '@/app/api/orders/route';
import { KanbanBoard, ColumnDef } from '@/components/features/KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function PackingPage() {
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
      // No action label because it's the final state
      colorClass: 'bg-green-100 text-green-900 border-green-200'
    }
  ];

  return (
    <main className="h-screen overflow-hidden">
      <KanbanBoard 
        initialOrders={initialOrders}
        columns={columns}
        divisionName="Packing & Delivery"
        icon="packing"
      />
    </main>
  );
}
