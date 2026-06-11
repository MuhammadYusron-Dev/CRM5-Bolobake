import { NextResponse } from 'next/server';
import { CUSTOMER_LIST } from '@/lib/customers';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: CUSTOMER_LIST });
  } catch (error: any) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
