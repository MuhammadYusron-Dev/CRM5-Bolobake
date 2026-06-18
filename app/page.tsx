import { headers, cookies } from 'next/headers';
import { OrderManager } from '@/components/features/OrderManager';
import { GET as getOrders } from '@/app/api/orders/route';
import { GET as getCatalog } from '@/app/api/catalog/route';
import { GET as getCustomers } from '@/app/api/customers/route';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let currentUser = null;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      currentUser = {
        userId: payload.email || payload.username,
        name: payload.firstName ? `${payload.firstName} ${payload.lastName || ''}`.trim() : (payload.email || payload.username),
        role: payload.role || 'ADMIN'
      };
    }
  }

  let initialOrders = [];
  let initialCatalog = [];
  let initialCustomers = [];

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

  try {
    const resCust = await getCustomers();
    const custData = await resCust.json();
    if (custData.success) initialCustomers = custData.data;
  } catch (e) {
    console.error("Failed to fetch initial customers:", e);
  }

  return <OrderManager initialOrders={initialOrders} initialCatalog={initialCatalog} initialCustomers={initialCustomers} currentUser={currentUser} />;
}
