import { NextResponse } from 'next/server';
import { getInventory, adjustStock } from '@/lib/inventory';

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

    await adjustStock(
      sku, 
      addedStock, 
      0, 
      'ADJUSTMENT', 
      'MANUAL_INPUT', 
      `ADJ-${Date.now()}`, 
      'Manual stock adjustment by admin'
    );

    return NextResponse.json({ success: true, message: 'Stock added successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
