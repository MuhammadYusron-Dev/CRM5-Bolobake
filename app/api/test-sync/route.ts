import { NextResponse } from 'next/server';
import { syncRekapSheet } from '@/lib/rekap-sync';

export async function GET() {
  const result = await syncRekapSheet();
  return NextResponse.json({ success: result });
}
