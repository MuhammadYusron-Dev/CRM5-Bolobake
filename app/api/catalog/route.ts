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
      isActive: row[4] !== 'FALSE', // TRUE by default or if 'TRUE'
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
