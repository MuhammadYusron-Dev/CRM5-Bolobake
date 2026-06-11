import { headers } from 'next/headers';
import { OrderManager } from '@/components/features/OrderManager';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  let initialOrders = [];
  let initialCatalog = [];

  try {
    const resOrders = await fetch(`${baseUrl}/api/orders`, { cache: 'no-store' });
    const orderData = await resOrders.json();
    if (orderData.success) initialOrders = orderData.data;
  } catch (e) {
    console.error("Failed to fetch initial orders:", e);
  }

  try {
    const resCatalog = await fetch(`${baseUrl}/api/catalog`, { cache: 'no-store' });
    const catalogData = await resCatalog.json();
    if (catalogData.success) initialCatalog = catalogData.data;
  } catch (e) {
    console.error("Failed to fetch initial catalog:", e);
  }

  return <OrderManager initialOrders={initialOrders} initialCatalog={initialCatalog} />;
}
