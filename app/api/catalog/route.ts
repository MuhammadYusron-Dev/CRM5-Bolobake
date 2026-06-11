import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A2:F', // Include new Satuan column
    });

    const rows = response.data.values || [];
    
    // Map array to object
    const catalog = rows.map((row) => ({
      id: row[0],
      nama: row[1],
      kategori: row[2],
      harga: Number(row[3]) || 0,
      aktif: row[4] !== 'FALSE', // TRUE by default or if 'TRUE'
      satuan: row[5] || 'pcs', // Default to pcs if empty
    }));

    return NextResponse.json({ success: true, data: catalog });
  } catch (error: any) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Support both single item and array of items
    const items = Array.isArray(body) ? body : [body];
    const rowsData = items.map((item, index) => {
      const skuId = item.id || `SKU-${Date.now().toString().slice(-4)}-${index}`;
      return [
        skuId,
        item.nama,
        item.kategori || 'General',
        item.harga.toString(),
        item.aktif !== false ? 'TRUE' : 'FALSE',
        item.satuan || 'pcs'
      ];
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rowsData,
      },
    });

    return NextResponse.json({ success: true, message: `${rowsData.length} products added to catalog` });
  } catch (error: any) {
    console.error('Error adding to catalog:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, aktif } = body;
    
    if (!id) throw new Error("ID (SKU) is required");

    // Cari baris SKU di Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A:A',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) {
        rowIndex = i + 1; // Google Sheets adalah 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error("SKU tidak ditemukan di database");
    }

    // Update kolom E (Status Aktif) pada baris yang ditemukan
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Master Katalog!E${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[aktif ? 'TRUE' : 'FALSE']],
      },
    });

    return NextResponse.json({ success: true, message: `Status updated for ${id}` });
  } catch (error: any) {
    console.error('Error updating catalog:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
