import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID, ensureVisualCatalogSheet } from '@/lib/google-sheets';

export async function GET() {
  try {
    await ensureVisualCatalogSheet();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'Visual Catalog'!A2:H",
    });

    const rows = response.data.values || [];
    
    // Map array to object
    const catalog = rows.map((row) => ({
      id: row[0] || '',
      nama: row[1] || '',
      kategori: row[2] || '',
      harga: Number(row[3]) || 0,
      gambar: row[4] || '',
      spesifikasi: row[5] || '',
      masaSimpan: row[6] || '',
      saranPenyajian: row[7] || '',
    }));

    return NextResponse.json({ success: true, data: catalog });
  } catch (error: any) {
    console.error('Failed to read visual catalog data:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedData = await request.json();
    await ensureVisualCatalogSheet();

    // Map object to array
    const rows = updatedData.map((item: any) => [
      item.id,
      item.nama,
      item.kategori,
      item.harga.toString(),
      item.gambar,
      item.spesifikasi,
      item.masaSimpan,
      item.saranPenyajian
    ]);

    // Clear existing data first
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: "'Visual Catalog'!A2:H",
    });

    if (rows.length > 0) {
      // Append new data
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "'Visual Catalog'!A2:H",
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows }
      });
    }
    
    return NextResponse.json({ success: true, message: 'Data successfully updated to Google Sheets' });
  } catch (error: any) {
    console.error('Failed to update visual catalog data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update data' },
      { status: 500 }
    );
  }
}
