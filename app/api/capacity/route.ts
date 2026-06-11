import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ success: false, error: 'date is required' }, { status: 400 });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'production_capacities!A2:C',
    });

    const rows = response.data.values || [];
    const capacityRow = rows.find(row => row[0] === date);
    
    if (capacityRow) {
      return NextResponse.json({ 
        success: true, 
        data: {
          date: capacityRow[0],
          max_capacity_pcs: Number(capacityRow[1] || 1000),
          booked_pcs: Number(capacityRow[2] || 0)
        }
      });
    }

    // Default capacity if not defined for the date
    return NextResponse.json({ 
      success: true, 
      data: {
        date,
        max_capacity_pcs: 1000,
        booked_pcs: 0
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch capacity:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
