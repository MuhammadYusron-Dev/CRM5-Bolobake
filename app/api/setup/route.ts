import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';

export async function GET() {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = response.data.sheets?.map((s) => s.properties?.title) || [];
    
    const requests: any[] = [];
    const sheetsToCreate = [
      { title: 'Laporan Transaksi Harian', cols: 10 },
      { title: 'Master Katalog', cols: 5 },
      { title: 'customer_tiers', cols: 3 },
      { title: 'customers', cols: 6 },
      { title: 'tier_prices', cols: 4 },
      { title: 'production_capacities', cols: 3 },
      { title: 'audit_logs', cols: 6 },
    ];

    sheetsToCreate.forEach(sheetDef => {
      if (!existingSheets.includes(sheetDef.title)) {
        requests.push({
          addSheet: {
            properties: {
              title: sheetDef.title,
              gridProperties: { rowCount: 1000, columnCount: sheetDef.cols }
            }
          }
        });
      }
    });

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests },
      });
    }

    // Now set headers and default data
    const headerUpdates = [
      {
        range: 'Laporan Transaksi Harian!A1:I1',
        values: [['Timestamp', 'Customer', 'Rincian Produksi', 'Total Pcs', 'Subtotal', 'Ongkos Kirim', 'Grand Total', 'Catatan Produksi', 'Status']]
      },
      {
        range: 'Master Katalog!A1:E1',
        values: [['SKU ID', 'Nama Produk', 'Kategori', 'Harga Default', 'Status Aktif']]
      },
      {
        range: 'customer_tiers!A1:C1',
        values: [['tier_id', 'tier_name', 'default_discount_pct']]
      },
      {
        range: 'customers!A1:F1',
        values: [['customer_id', 'customer_name', 'tier_id', 'whatsapp_number', 'shipping_address', 'created_at']]
      },
      {
        range: 'tier_prices!A1:D1',
        values: [['price_id', 'tier_id', 'sku_code', 'custom_price']]
      },
      {
        range: 'production_capacities!A1:C1',
        values: [['date', 'max_capacity_pcs', 'booked_pcs']]
      },
      {
        range: 'audit_logs!A1:F1',
        values: [['log_id', 'timestamp', 'user_id', 'user_name', 'action_type', 'details']]
      }
    ];

    for (const update of headerUpdates) {
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: update.range,
      });

      if (!getRes.data.values || getRes.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: update.range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: update.values },
        });

        // Seed initial data for new tables
        if (update.range.includes('customer_tiers!')) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'customer_tiers!A2:C4',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [
                ['TIER_A', 'Distributor Utama', '10'],
                ['TIER_B', 'Reseller Kafe', '5'],
                ['RETAIL', 'Retail Walk-in', '0']
              ]
            }
          });
        }
        if (update.range.includes('customers!')) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'customers!A2:F3',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [
                ['CUST_001', 'Loom Coffee', 'TIER_B', '6281234567890', 'Solo', new Date().toISOString()],
                ['CUST_002', 'Budi Umum', 'RETAIL', '6280987654321', 'Boyolali', new Date().toISOString()]
              ]
            }
          });
        }
        if (update.range.includes('tier_prices!')) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'tier_prices!A2:D3',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [
                ['PRICE_001', 'TIER_B', 'Butter Croissant', '18000'],
                ['PRICE_002', 'TIER_A', 'Butter Croissant', '16000']
              ]
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Spreadsheet setup complete!' });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
