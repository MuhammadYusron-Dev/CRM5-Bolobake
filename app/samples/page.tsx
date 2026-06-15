import { headers } from 'next/headers';
import { SampleTracker } from '@/components/features/SampleTracker';
import { GET as getOrders } from '@/app/api/orders/route';
import { GET as getCatalog } from '@/app/api/catalog/route';

export const dynamic = 'force-dynamic';

export default async function SamplesPage() {
  let initialOrders = [];
  let initialCatalog = [];

  try {
    const resOrders = await getOrders();
    const orderData = await resOrders.json();
    if (orderData.success) initialOrders = orderData.data;
  } catch (e) {
    console.error("Failed to fetch initial orders:", e);
  }

  try {
    const resCatalog = await getCatalog();
    const catalogData = await resCatalog.json();
    if (catalogData.success) initialCatalog = catalogData.data;
  } catch (e) {
    console.error("Failed to fetch initial catalog:", e);
  }

  return <SampleTracker initialOrders={initialOrders} initialCatalog={initialCatalog} />;
}
