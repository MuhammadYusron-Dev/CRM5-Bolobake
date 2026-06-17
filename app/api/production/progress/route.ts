import { NextResponse } from 'next/server';
import { getProductionProgress, upsertProductionProgress, completeProductionBatch } from '@/lib/production';

export async function GET() {
  try {
    const data = await getProductionProgress();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, item, sourceOrderIds } = body;

    if (action === 'completeBatch') {
      await completeProductionBatch(item.sku, item.dateKey, item.doneQty, sourceOrderIds || []);
      return NextResponse.json({ success: true, message: 'Batch completed successfully' });
    }

    if (action === 'upsert') {
      if (!item || !item.dateKey || !item.sku) {
        return NextResponse.json({ success: false, error: 'dateKey and sku are required' }, { status: 400 });
      }
      await upsertProductionProgress(item);
      return NextResponse.json({ success: true, message: 'Progress saved' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error in production/progress:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
