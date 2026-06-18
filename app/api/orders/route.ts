import { NextResponse, after } from 'next/server';
import { sheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { runFullBackgroundSync } from '@/lib/rekap-sync';
import { getFromCache, setCache, invalidateCache } from '@/lib/cache';
import { SLA_CONFIG } from '@/lib/config/sla';
import { OrderStage, OrderState, OrderHealth, LifecycleEvent } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'orders_data';

export async function GET() {
  try {
    const cachedData = getFromCache(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A2:V',
    });

    const rows = response.data.values || [];
    
    // Filter out empty/ghost rows left behind after clearing the spreadsheet
    const validRows = rows.filter(row => {
      // A row must have at least a timestamp (col A) or a customer name (col B) to be valid
      const hasTimestamp = row[0] && String(row[0]).trim() !== '';
      const hasCustomer = row[1] && String(row[1]).trim() !== '';
      return hasTimestamp || hasCustomer;
    });

    const orders = validRows.map((row, index) => {
      // Recalculate the actual row number in the spreadsheet
      const actualRowNumber = rows.indexOf(row) + 2; // +2 because A2 is the first data row
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
        const sampleStatuses = (row[19] || '').split('\n');
        const sampleFeedbacks = (row[20] || '').split('\n');
        
        items = names.map((name: string, i: number) => ({
          id: index * 1000 + i,
          sku: name.trim(),
          qty: parseInt(qtys[i] || '1', 10),
          price: parseInt(prices[i] || '0', 10),
          sampleStatus: sampleStatuses[i] || 'Pending',
          sampleFeedback: sampleFeedbacks[i] || ''
        })).filter((item: any) => item.sku !== '');
      }

      return {
        id: (() => {
          const parsed = new Date(row[0]).getTime();
          return (!isNaN(parsed) && parsed > 0) ? parsed : Date.now() + actualRowNumber;
        })(),
        rowNumber: actualRowNumber, // actual position in spreadsheet
        timestamp: row[0],
        customer: row[1] || '',
        items: items,
        totalPcs: Number(String(row[5] || '0').replace(/\D/g, '')) || 0,
        subtotal: Number(String(row[6] || '0').replace(/\D/g, '')) || 0,
        shippingCost: Number(String(row[7] || '0').replace(/\D/g, '')) || 0,
        grandTotal: Number(String(row[8] || '0').replace(/\D/g, '')) || 0,
        ...(() => {
          let rawNotes = row[9] || '';
          let existingDeliveryNotes = row[18] || '';

          if (rawNotes && !existingDeliveryNotes) {
            const lines = rawNotes.split('\n');
            const prodNotes: string[] = [];
            const delivNotes: string[] = [];

            for (const line of lines) {
              if (/(delivery|kirim|pengiriman|ambil|diambil|pickup|central)/i.test(line)) {
                delivNotes.push(line.trim());
              } else {
                prodNotes.push(line.trim());
              }
            }

            if (delivNotes.length > 0) {
              rawNotes = prodNotes.filter(Boolean).join('\n').trim();
              existingDeliveryNotes = delivNotes.filter(Boolean).join('\n').trim();
            }
          }

          return {
            notes: rawNotes,
            deliveryNotes: existingDeliveryNotes
          };
        })(),
        ...(() => {
          const statusStr = row[10] || 'Pesanan Dibuat';
          let currentStage: OrderStage = 'ADMIN';
          let currentState: OrderState = 'IN_PROGRESS';
          
          if (statusStr.includes('_') && !statusStr.includes(' ')) {
            const parts = statusStr.split('_');
            currentStage = parts[0] as OrderStage;
            currentState = parts.slice(1).join('_') as OrderState;
          } else {
            // Legacy mapping
            const low = statusStr.toLowerCase();
            if (low.includes('produksi')) { currentStage = 'PRODUCTION'; currentState = 'ACCEPTED'; }
            else if (low.includes('packing')) { currentStage = 'PACKING'; currentState = 'ACCEPTED'; }
            else if (low.includes('delivery')) { currentStage = 'DELIVERY'; currentState = 'ACCEPTED'; }
            else if (low.includes('diterima')) { currentStage = 'COMPLETED'; currentState = 'COMPLETED'; }
            else if (low.includes('dikonfirmasi')) { currentStage = 'PRODUCTION'; currentState = 'WAITING'; }
            else { currentStage = 'ADMIN'; currentState = 'IN_PROGRESS'; }
          }

          let lifecycleData: LifecycleEvent[] = [];
          if (row[21]) {
            try {
              lifecycleData = JSON.parse(row[21]);
            } catch (e) {}
          }

          if (lifecycleData.length === 0) {
            // Virtual timeline for legacy
            if (row[13]) {
              lifecycleData.push({ version: '1.0', eventId: 'legacy_1', event: 'HANDOVER', source: 'MIGRATION', actor: { userId: 'system', name: 'Legacy Data', role: 'ADMIN' }, timestamp: row[13], toStage: 'PRODUCTION' });
            }
            if (row[14]) {
              lifecycleData.push({ version: '1.0', eventId: 'legacy_2', event: 'ACCEPT', source: 'MIGRATION', actor: { userId: 'system', name: 'Legacy Data', role: 'PRODUCTION' }, timestamp: row[14], stage: 'PRODUCTION' });
            }
          }

          let qcMeta = undefined;
          if (currentState === 'QC_PENDING') {
            const lastComplete = [...lifecycleData].reverse().find(e => e.event === 'COMPLETE' && (e.stage === 'PRODUCTION' || e.stage === 'PACKING'));
            if (lastComplete) {
              qcMeta = {
                pendingAt: lastComplete.timestamp,
                stageOwner: lastComplete.stage || 'PRODUCTION',
                isBlocked: true
              };
            }
          }

          let healthStatus: OrderHealth = 'HEALTHY';
          
          if (currentState === 'REVIEW_REQUIRED') {
            healthStatus = 'BLOCKED';
          } else if (currentState === 'WAITING' && lifecycleData.length > 0) {
            const lastHandover = [...lifecycleData].reverse().find(e => e.event === 'HANDOVER');
            if (lastHandover && lastHandover.timestamp) {
              const minutesWaiting = (Date.now() - new Date(lastHandover.timestamp).getTime()) / 60000;
              let threshold = 120; // Default
              if (currentStage === 'PRODUCTION') threshold = SLA_CONFIG.PRODUCTION_WAITING_MINUTES;
              if (currentStage === 'PACKING') threshold = SLA_CONFIG.PACKING_WAITING_MINUTES;
              if (currentStage === 'DELIVERY') threshold = SLA_CONFIG.DELIVERY_WAITING_MINUTES;
              
              if (minutesWaiting > threshold) {
                healthStatus = 'AT_RISK';
              }
            }
          } else if (currentStage !== 'COMPLETED' && row[12]) {
             // Overdue check
             const deliveryDate = new Date(row[12]);
             if (deliveryDate.getTime() < Date.now() - 86400000) { // Overdue by a day
               healthStatus = 'OVERDUE';
             }
          }

          return {
            status: statusStr,
            currentStage,
            currentState,
            healthStatus,
            lifecycleData,
            qcMeta
          };
        })(),
        productionDate: row[11] || '',
        deliveryDate: row[12] || '',
        isFreeShipping: Number(row[7]) === 0,
        statusTimestamps: {
          dikonfirmasi: row[13] || '',
          produksi: row[14] || '',
          packing: row[15] || '',
          delivery: row[16] || '',
          diterima: row[17] || ''
        }
      };
    });

    // Sort handled by front-end mostly, but return mapped
    setCache(CACHE_KEY, orders);

    return NextResponse.json({ success: true, data: orders, cached: false });
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
    const sampleStatuses = body.items.map((item: any) => item.sampleStatus || 'Pending').join('\n');
    const sampleFeedbacks = body.items.map((item: any) => item.sampleFeedback || '').join('\n');
    
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
      body.status || 'Pesanan Dibuat', // Status
      body.productionDate || '',// Tanggal Produksi
      body.deliveryDate || '',  // Tanggal Pengiriman
      body.statusTimestamps?.dikonfirmasi || '',
      body.statusTimestamps?.produksi || '',
      body.statusTimestamps?.packing || '',
      body.statusTimestamps?.delivery || '',
      body.statusTimestamps?.diterima || '',
      body.deliveryNotes || '', // Catatan Pengiriman
      sampleStatuses,           // Status Follow-up Sampel
      sampleFeedbacks           // Feedback Sampel
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Laporan Transaksi Harian!A${body.rowNumber}:U${body.rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    invalidateCache(CACHE_KEY);

    after(async () => {
      try {
        await runFullBackgroundSync(body.productionDate);
      } catch (e) {
        console.error('Background sync failed', e);
      }
    });

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
    const sampleStatuses = body.items.map((item: any) => item.sampleStatus || 'Pending').join('\n');
    const sampleFeedbacks = body.items.map((item: any) => item.sampleFeedback || '').join('\n');
    
    // Default Status
    const status = body.status || 'Pesanan Dibuat';
    

    const finalNotes = imageUrl ? `${body.notes || ''}\n[IMAGE_URL:${imageUrl}]` : (body.notes || '');

    const rowData = [
      new Date().toISOString(), // Timestamp (Column A) - proper ISO format for reliable parsing
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
      body.deliveryDate || '',  // Tanggal Pengiriman
      body.statusTimestamps?.dikonfirmasi || '',
      body.statusTimestamps?.produksi || '',
      body.statusTimestamps?.packing || '',
      body.statusTimestamps?.delivery || '',
      body.statusTimestamps?.diterima || '',
      body.deliveryNotes || '',
      sampleStatuses,
      sampleFeedbacks,
      JSON.stringify([{
        version: "1.0",
        eventId: `evt_${Date.now()}_create`,
        event: "CREATE",
        source: "WEB_APP",
        actor: {
          userId: body.userId || 'system',
          name: body.userName || 'System',
          role: body.userRole || 'ADMIN'
        },
        stage: "ADMIN",
        timestamp: new Date().toISOString(),
        notes: body.notes || '',
        attachments: imageUrl ? [imageUrl] : []
      }])
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A:V',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    invalidateCache(CACHE_KEY);

    after(async () => {
      try {
        await runFullBackgroundSync(body.productionDate);
      } catch (e) {
        console.error('Background sync failed', e);
      }

      try {
        const { eventBus } = await import('@/lib/events');
        await import('@/lib/inventory');
        await import('@/lib/production');
        
        eventBus.emit('ORDER_CREATED', {
          id: body.id || Date.now(),
          customer: body.customer,
          items: body.items,
          productionDate: body.productionDate,
          deliveryDate: body.deliveryDate
        });
      } catch (e) {
        console.error('Event Bus trigger failed', e);
      }
    });

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
        range: 'Laporan Transaksi Harian!A2:V',
      });
      invalidateCache(CACHE_KEY);
      await runFullBackgroundSync();
      
      // Reset all booked capacities to 0
      const capRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'production_capacities!A2:C',
      });
      const capRows = capRes.data.values || [];
      if (capRows.length > 0) {
        const resetRows = capRows.map((row: any) => [row[0], row[1], 0]);
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: 'production_capacities!A2:C',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: resetRows }
        });
      }

      return NextResponse.json({ success: true, message: 'All orders cleared successfully' });
    }

    if (!rowNumber) {
      return NextResponse.json({ success: false, error: 'rowNumber is required' }, { status: 400 });
    }

    // Get the order date before deleting to sync capacity later
    const rowDataRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Laporan Transaksi Harian!A${rowNumber}:R${rowNumber}`
    });
    const deletedOrderDate = rowDataRes.data.values?.[0]?.[11];

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

    invalidateCache(CACHE_KEY);

    after(async () => {
      try {
        await runFullBackgroundSync(deletedOrderDate);
      } catch (e) {
        console.error('Background sync failed', e);
      }
    });

    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.status) {
      return NextResponse.json({ success: false, error: 'status is required' }, { status: 400 });
    }

    const newStatus = body.status;
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    let rowNumber = body.rowNumber;

    if (!rowNumber && body.id) {
      // Fetch all to find the rowNumber by id (id is mapped from timestamp/row)
      // The id in frontend is new Date(row[0]).getTime() or similar.
      // Actually, if we just need to find the row by Timestamp (column A) or ID?
      // Since `id` isn't saved directly in sheets, we might not be able to find it easily 
      // without fetching everything.
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Laporan Transaksi Harian!A2:A',
      });
      const rows = getRes.data.values || [];
      const rowIndex = rows.findIndex((r, idx) => {
        const rowId = new Date(r[0]).getTime() || '';
        return String(rowId) === String(body.id) || String(r[0]) === String(body.id);
      });
      if (rowIndex !== -1) {
        rowNumber = rowIndex + 2;
      }
    }

    if (!rowNumber) {
       return NextResponse.json({ success: false, error: 'rowNumber or id is required to find the order' }, { status: 400 });
    }

    // We only update columns K (status) to R (timestamps)
    // K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17
    
    // First, fetch the current timestamps so we don't overwrite them
    const rowDataRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Laporan Transaksi Harian!K${rowNumber}:R${rowNumber}`
    });
    
    const existing = rowDataRes.data.values?.[0] || [];
    // Pad array if needed
    while (existing.length < 8) existing.push('');

    // existing[0] = Status (K)
    // existing[1] = Prod Date (L)
    // existing[2] = Deliv Date (M)
    // existing[3] = Dikonfirmasi (N)
    // existing[4] = Produksi (O)
    // existing[5] = Packing (P)
    // existing[6] = Delivery (Q)
    // existing[7] = Diterima (R)

    existing[0] = newStatus;
    
    // Update timestamp based on new status
    if (newStatus === 'Dikonfirmasi') existing[3] = existing[3] || now;
    if (newStatus === 'Produksi') existing[4] = existing[4] || now;
    if (newStatus === 'Packing') existing[5] = existing[5] || now;
    if (newStatus === 'Delivery') existing[6] = existing[6] || now;
    if (newStatus === 'Diterima') existing[7] = existing[7] || now;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Laporan Transaksi Harian!K${rowNumber}:R${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [existing],
      },
    });

    invalidateCache(CACHE_KEY);

    return NextResponse.json({ success: true, message: 'Status updated successfully', data: { status: newStatus, timestamps: existing.slice(3) } });
  } catch (error: any) {
    console.error('Error updating status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
