import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { getFromCache, setCache, invalidateCache } from '@/lib/cache';

const CACHE_KEY = 'customers_data';

// Helper to generate IDs
const generateId = () => 'CUST_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

export async function GET() {
  try {
    const cachedData = getFromCache(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'customers!A2:G',
    });

    const rows = response.data.values || [];
    
    const customers = rows.map((row, index) => ({
      id: row[0] || '',
      rowNumber: index + 2,
      name: row[1] || '',
      tier: row[2] || 'STANDARD',
      whatsapp: row[3] || '',
      address: row[4] || '',
      createdAt: row[5] || '',
      notes: row[6] || ''
    }));

    setCache(CACHE_KEY, customers);

    return NextResponse.json({ success: true, data: customers, cached: false });
  } catch (error: any) {
    console.error('Failed to fetch customers from Sheets:', error);
    
    // Fallback to static list if sheet doesn't exist yet
    try {
        const { CUSTOMER_LIST } = require('@/lib/customers');
        return NextResponse.json({ success: true, data: CUSTOMER_LIST.map((c: any) => ({ ...c, id: `CUST_${c.id}`, whatsapp: '', address: '', createdAt: new Date().toISOString() })) });
    } catch(e) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newCustomer = {
      id: body.id || generateId(),
      name: body.name || '',
      tier: body.tier || 'STANDARD',
      whatsapp: body.whatsapp || '',
      address: body.address || '',
      createdAt: new Date().toISOString(),
      notes: body.notes || ''
    };

    const rowData = [
      newCustomer.id,
      newCustomer.name,
      newCustomer.tier,
      newCustomer.whatsapp,
      newCustomer.address,
      newCustomer.createdAt,
      newCustomer.notes
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'customers!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    invalidateCache(CACHE_KEY);

    return NextResponse.json({ success: true, message: 'Customer added', data: newCustomer });
  } catch (error: any) {
    console.error('Error adding customer:', error);
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
      body.tier,
      body.whatsapp,
      body.address,
      body.createdAt || new Date().toISOString(),
      body.notes || ''
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `customers!A${body.rowNumber}:G${body.rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    invalidateCache(CACHE_KEY);

    return NextResponse.json({ success: true, message: 'Customer updated' });
  } catch (error: any) {
    console.error('Error updating customer:', error);
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
      (s: any) => s.properties?.title === 'customers'
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

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
