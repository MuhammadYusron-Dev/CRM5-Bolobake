import { GET as getOrders } from '@/app/api/orders/route';
import { SalesCRM } from '@/components/features/SalesCRM';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  let initialOrders = [];

  try {
    const resOrders = await getOrders();
    const orderData = await resOrders.json();
    if (orderData.success) initialOrders = orderData.data;
  } catch (e) {
    console.error("Failed to fetch initial orders:", e);
  }

  return <SalesCRM initialOrders={initialOrders} />;
}
