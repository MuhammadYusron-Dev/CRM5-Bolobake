import { NextResponse } from 'next/server';
import { getInventoryMovements } from '@/lib/inventory';

export async function GET() {
  try {
    const data = await getInventoryMovements();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
