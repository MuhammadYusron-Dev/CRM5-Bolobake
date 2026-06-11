import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tierId = searchParams.get('tier_id');

    if (!tierId) {
      return NextResponse.json({ success: false, error: 'tier_id is required' }, { status: 400 });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'tier_prices!A2:D',
    });

    const rows = response.data.values || [];
    // Filter by tier and map
    const prices = rows
      .filter((row) => row[1] === tierId)
      .map((row) => ({
        id: row[0],
        tier: row[1],
        sku: row[2],
        price: Number(row[3])
      }));

    return NextResponse.json({ success: true, data: prices });
  } catch (error: any) {
    console.error('Failed to fetch pricing:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
