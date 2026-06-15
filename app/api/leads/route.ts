import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { getFromCache, setCache, invalidateCache } from '@/lib/cache';

const CACHE_KEY = 'leads_data';

const generateId = () => 'LEAD_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

export async function GET() {
  try {
    const cachedData = getFromCache(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'leads!A2:F',
    });

    const rows = response.data.values || [];
    
    const leads = rows.map((row, index) => ({
      id: row[0] || '',
      rowNumber: index + 2,
      name: row[1] || '',
      whatsapp: row[2] || '',
      status: row[3] || 'Prospek Baru',
      notes: row[4] || '',
      createdAt: row[5] || ''
    }));

    setCache(CACHE_KEY, leads);

    return NextResponse.json({ success: true, data: leads, cached: false });
  } catch (error: any) {
    console.error('Failed to fetch leads from Sheets:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newLead = {
      id: body.id || generateId(),
      name: body.name || '',
      whatsapp: body.whatsapp || '',
      status: body.status || 'Prospek Baru',
      notes: body.notes || '',
      createdAt: new Date().toISOString()
    };

    const rowData = [
      newLead.id,
      newLead.name,
      newLead.whatsapp,
      newLead.status,
      newLead.notes,
      newLead.createdAt
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'leads!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    invalidateCache(CACHE_KEY);

    return NextResponse.json({ success: true, message: 'Lead added', data: newLead });
  } catch (error: any) {
    console.error('Error adding lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.rowNumber) {
      return NextResponse.json({ success: false, error: 'rowNumber is required for update' }, { status: 400 });
    }

    const rowData = [
      body.id,
      body.name,
      body.whatsapp,
      body.status,
      body.notes,
      body.createdAt || new Date().toISOString()
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `leads!A${body.rowNumber}:F${body.rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    invalidateCache(CACHE_KEY);

    return NextResponse.json({ success: true, message: 'Lead updated' });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowNumber = searchParams.get('rowNumber');

    if (!rowNumber) {
      return NextResponse.json({ success: false, error: 'rowNumber is required' }, { status: 400 });
    }

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheet = spreadsheet.data.sheets?.find(
      (s: any) => s.properties?.title === 'leads'
    );

    if (!sheet || sheet.properties?.sheetId === undefined) {
      return NextResponse.json({ success: false, error: 'Sheet not found' }, { status: 404 });
    }

    const sheetId = sheet.properties.sheetId;
    const rowIndex = parseInt(rowNumber, 10) - 1;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    invalidateCache(CACHE_KEY);

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
