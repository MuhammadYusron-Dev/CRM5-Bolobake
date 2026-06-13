import { NextResponse } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { syncRekapSheet, syncCapacity, syncLaporanBorders } from '@/lib/rekap-sync';

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A2:M',
    });

    const rows = response.data.values || [];
    
    const orders = rows.map((row, index) => {
      let items: any[] = [];
      const colC = row[2] || '';
      const colD = row[3] || '';
      const colE = row[4] || '';

      // Backwards Compatibility Check
      // Jika kolom D (QTY) dan E (HARGA) kosong, dan kolom C mengandung "(",
      // berarti ini format lama.
      const isOldFormat = !colD && !colE && colC.includes('(');

      if (isOldFormat) {
        // Parse format lama: "- Nama Item (10 pcs @ 15000)"
        items = colC.split('\n').filter(Boolean).map((line: string, i: number) => {
          const match = line.match(/-\s*(.+?)\s*\((\d+)\s*pcs(?:.*?@\s*(\d+))?/i);
          if (match) {
            return {
              id: index * 1000 + i,
              sku: match[1].trim(),
              qty: parseInt(match[2], 10),
              price: match[3] ? parseInt(match[3], 10) : 0,
            };
          }
          return {
            id: index * 1000 + i,
            sku: line.replace(/^- /, ''),
            qty: 1,
            price: 0
          };
        });
      } else {
        // Parse format baru (3 kolom terpisah)
        const names = colC.split('\n');
        const qtys = colD.split('\n');
        const prices = colE.split('\n');
        
        items = names.map((name: string, i: number) => ({
          id: index * 1000 + i,
          sku: name.trim(),
          qty: parseInt(qtys[i] || '1', 10),
          price: parseInt(prices[i] || '0', 10)
        })).filter((item: any) => item.sku !== '');
      }

      return {
        id: new Date(row[0]).getTime() || Date.now() + index,
        rowNumber: index + 2, // A2 is row 2
        timestamp: row[0],
        customer: row[1] || '',
        items: items,
        totalPcs: Number(String(row[5] || '0').replace(/\D/g, '')) || 0,
        subtotal: Number(String(row[6] || '0').replace(/\D/g, '')) || 0,
        shippingCost: Number(String(row[7] || '0').replace(/\D/g, '')) || 0,
        grandTotal: Number(String(row[8] || '0').replace(/\D/g, '')) || 0,
        notes: row[9] || '',
        status: row[10] || '',
        productionDate: row[11] || '',
        deliveryDate: row[12] || '',
        isFreeShipping: Number(row[7]) === 0
      };
    });

    // Return in ascending order (sorted by production date from Google Sheets)
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.rowNumber) {
      return NextResponse.json({ success: false, error: 'rowNumber is required for update' }, { status: 400 });
    }

    const productNames = body.items.map((item: any) => item.sku).join('\n');
    const productQtys = body.items.map((item: any) => item.qty).join('\n');
    const productPrices = body.items.map((item: any) => item.price).join('\n');
    
    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      const [y, m, d] = dateString.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    };

    const prodDateStr = formatDate(body.productionDate);
    const delivDateStr = formatDate(body.deliveryDate);
    const timeColumnDisplay = `Produksi: ${prodDateStr}\nPengiriman: ${delivDateStr}`;

    const rowData = [
      timeColumnDisplay,        // Update Timestamp to display schedules
      body.customer,            // Customer
      productNames,             // NAMA PRODUK
      productQtys,              // QTY
      productPrices,            // HARGA
      body.totalPcs,            // Total Pcs
      body.subtotal,            // Subtotal
      body.shippingCost,        // Ongkos Kirim
      body.grandTotal,          // Grand Total
      body.notes || '',         // Catatan Produksi
      body.status || 'Pending', // Status
      body.productionDate || '',// Tanggal Produksi
      body.deliveryDate || ''   // Tanggal Pengiriman
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Laporan Transaksi Harian!A${body.rowNumber}:M${body.rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    // Sort sheet by Production Date
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === 'Laporan Transaksi Harian');
    if (sheet?.properties?.sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              sortRange: {
                range: { sheetId: sheet.properties.sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 13 },
                sortSpecs: [{ dimensionIndex: 11, sortOrder: 'ASCENDING' }]
              }
            }
          ]
        }
      });
    }

    // Sync human-readable Rekap Produksi sheet
    await syncRekapSheet();
    
    // Sync Laporan Transaksi Harian Borders
    await syncLaporanBorders();
    
    // Sync Production Capacity sheet
    if (body.productionDate) {
      await syncCapacity(body.productionDate);
    }

    return NextResponse.json({ success: true, message: 'Order updated in Sheets' });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: any;
    let imageUrl: string | null = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const imageFile = formData.get('image') as File | null;
      if (imageFile && imageFile.size > 0) {
        const { uploadImage } = await import('@/lib/google-sheets');
        imageUrl = await uploadImage(imageFile);
      }
      body = JSON.parse(formData.get('data') as string);
    } else {
      body = await request.json();
    }
    
    // Format items as a readable list including price
    const productNames = body.items.map((item: any) => item.sku).join('\n');
    const productQtys = body.items.map((item: any) => item.qty).join('\n');
    const productPrices = body.items.map((item: any) => item.price).join('\n');
    
    // Default Status
    const status = 'Pending';
    
    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      const [y, m, d] = dateString.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    };

    const prodDateStr = formatDate(body.productionDate);
    const delivDateStr = formatDate(body.deliveryDate);
    const timeColumnDisplay = `Produksi: ${prodDateStr}\nPengiriman: ${delivDateStr}`;

    const finalNotes = imageUrl ? `${body.notes || ''}\n[IMAGE_URL:${imageUrl}]` : (body.notes || '');

    const rowData = [
      timeColumnDisplay, // Timestamp (Column A)
      body.customer,            // Customer
      productNames,             // NAMA PRODUK
      productQtys,              // QTY
      productPrices,            // HARGA
      body.totalPcs,            // Total Pcs
      body.subtotal,            // Subtotal
      body.shippingCost,        // Ongkos Kirim
      body.grandTotal,          // Grand Total
      finalNotes,               // Catatan Produksi
      status,                   // Status
      body.productionDate || '',// Tanggal Produksi
      body.deliveryDate || ''   // Tanggal Pengiriman
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    // Sort sheet by Production Date
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === 'Laporan Transaksi Harian');
    if (sheet?.properties?.sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              sortRange: {
                range: { sheetId: sheet.properties.sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 13 },
                sortSpecs: [{ dimensionIndex: 11, sortOrder: 'ASCENDING' }]
              }
            }
          ]
        }
      });
    }

    // Sync human-readable Rekap Produksi sheet
    await syncRekapSheet();

    // Sync Laporan Transaksi Harian Borders
    await syncLaporanBorders();

    // Sync Production Capacity sheet
    if (body.productionDate) {
      await syncCapacity(body.productionDate);
    }

    return NextResponse.json({ success: true, message: 'Order saved to Sheets', id: body.id || Date.now() });
  } catch (error: any) {
    console.error('Error saving order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowNumber = searchParams.get('rowNumber');
    const clearAll = searchParams.get('clearAll');

    if (clearAll === 'true') {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Laporan Transaksi Harian!A2:M',
      });
      await syncRekapSheet();
      return NextResponse.json({ success: true, message: 'All orders cleared successfully' });
    }

    if (!rowNumber) {
      return NextResponse.json({ success: false, error: 'rowNumber is required' }, { status: 400 });
    }

    // First get the sheet ID for 'Laporan Transaksi Harian'
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheet = spreadsheet.data.sheets?.find(
      (s: any) => s.properties?.title === 'Laporan Transaksi Harian'
    );

    if (!sheet || sheet.properties?.sheetId === undefined) {
      return NextResponse.json({ success: false, error: 'Sheet not found' }, { status: 404 });
    }

    const sheetId = sheet.properties.sheetId;
    const rowIndex = parseInt(rowNumber, 10) - 1; // 0-indexed, row 2 is index 1

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

    // Sync human-readable Rekap Produksi sheet
    await syncRekapSheet();

    // Sync Laporan Transaksi Harian Borders
    await syncLaporanBorders();

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
