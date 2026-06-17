import { NextResponse } from 'next/server';
import { getProductionQueue, completeProduction, updateProductionQueue } from '@/lib/production';

export async function GET() {
  try {
    const data = await getProductionQueue();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { queueId } = body;
    
    if (!queueId) {
      return NextResponse.json({ success: false, error: 'Queue ID is required' }, { status: 400 });
    }

    await completeProduction(queueId);

    return NextResponse.json({ success: true, message: 'Production completed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { queueId, status, assignedTo } = body;

    if (!queueId) {
      return NextResponse.json({ success: false, error: 'Queue ID is required' }, { status: 400 });
    }

    await updateProductionQueue(queueId, { status, assignedTo });

    return NextResponse.json({ success: true, message: 'Production queue updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
