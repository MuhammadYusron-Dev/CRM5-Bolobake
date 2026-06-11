import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function GET() {
  try {
    // Check existing sheets
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = response.data.sheets?.map((s) => s.properties?.title) || [];
    
    const requests: any[] = [];

    // Create Laporan Transaksi Harian if not exists
    if (!existingSheets.includes('Laporan Transaksi Harian')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Laporan Transaksi Harian',
            gridProperties: { rowCount: 1000, columnCount: 10 }
          }
        }
      });
    }

    // Create Master Katalog if not exists
    if (!existingSheets.includes('Master Katalog')) {
      requests.push({
        addSheet: {
          properties: {
            title: 'Master Katalog',
            gridProperties: { rowCount: 500, columnCount: 5 }
          }
        }
      });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests,
        },
      });
    }

    // Now, let's set the headers if they are empty
    // For Laporan Transaksi Harian
    const laporanResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A1:I1',
    });

    if (!laporanResponse.data.values || laporanResponse.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Laporan Transaksi Harian!A1:I1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            ['Timestamp', 'Customer', 'Rincian Produksi', 'Total Pcs', 'Subtotal', 'Ongkos Kirim', 'Grand Total', 'Catatan Produksi', 'Status']
          ],
        },
      });
    }

    // For Master Katalog
    const katalogResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Katalog!A1:E1',
    });

    if (!katalogResponse.data.values || katalogResponse.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Master Katalog!A1:E1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            ['SKU ID', 'Nama Produk', 'Kategori', 'Harga Default', 'Status Aktif']
          ],
        },
      });
      
      // Seed some initial data so the dashboard doesn't break
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Master Katalog!A2:E9',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            ['SKU-001', 'Classic Bagel', 'Bread', '15000', 'TRUE'],
            ['SKU-002', 'Sourdough Loaf', 'Bread', '45000', 'TRUE'],
            ['SKU-003', 'Butter Croissant', 'Pastry', '20000', 'TRUE'],
            ['SKU-004', 'Cinnamon Roll', 'Pastry', '22000', 'TRUE'],
            ['SKU-005', 'Baguette Traditional', 'Bread', '25000', 'TRUE'],
            ['SKU-006', 'Pain au Chocolat', 'Pastry', '24000', 'TRUE'],
            ['SKU-007', 'Focaccia Rosemary', 'Bread', '35000', 'TRUE'],
            ['SKU-008', 'Brioche Bun (Pack of 6)', 'Bread', '40000', 'TRUE'],
          ],
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Spreadsheet setup complete!' });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
