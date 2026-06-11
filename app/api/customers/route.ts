import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'customers!A2:E',
    });

    const rows = response.data.values || [];
    const customers = rows.map((row) => ({
      id: row[0],
      name: row[1],
      tier: row[2],
      whatsapp: row[3] || '',
      address: row[4] || ''
    }));

    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
