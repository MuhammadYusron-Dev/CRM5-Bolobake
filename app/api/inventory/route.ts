import { NextResponse } from 'next/server';
import { getInventory, updateInventoryRow } from '@/lib/inventory';

export async function GET() {
  try {
    const data = await getInventory();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sku, addedStock } = body;
    
    if (!sku || addedStock === undefined) {
      return NextResponse.json({ success: false, error: 'SKU and addedStock are required' }, { status: 400 });
    }

    const inventory = await getInventory();
    const item = inventory.find(i => i.sku === sku);
    
    if (item) {
      await updateInventoryRow(sku, item.totalStock + addedStock, item.reservedStock);
    } else {
      await updateInventoryRow(sku, addedStock, 0);
    }

    return NextResponse.json({ success: true, message: 'Stock added successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
