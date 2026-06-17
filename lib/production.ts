import { sheets, SPREADSHEET_ID, ensureInventorySheets } from '@/lib/google-sheets';
import { adjustStock } from '@/lib/inventory';
import { eventBus } from '@/lib/events';

export interface ProductionProgressItem {
  dateKey: string;
  sku: string;
  doneQty: number;
  rejectQty: number;
  qcChecked: boolean;
  assignedTo: string;
}

export async function getProductionProgress(): Promise<ProductionProgressItem[]> {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionProgress!A2:F',
    });
    const rows = response.data.values || [];
    return rows.map(row => ({
      dateKey: row[0] || '',
      sku: row[1] || '',
      doneQty: parseInt(row[2] || '0', 10),
      rejectQty: parseInt(row[3] || '0', 10),
      qcChecked: row[4] === 'TRUE',
      assignedTo: row[5] || '',
    })).filter(item => item.dateKey !== '' && item.sku !== '');
  } catch (error) {
    console.error('Error fetching production progress:', error);
    return [];
  }
}

export async function upsertProductionProgress(item: ProductionProgressItem) {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionProgress!A:F',
    });
    const rows = response.data.values || [];
    
    const rowIndex = rows.findIndex(row => row[0] === item.dateKey && row[1] === item.sku);

    const values = [[
      item.dateKey,
      item.sku,
      item.doneQty,
      item.rejectQty,
      item.qcChecked ? 'TRUE' : 'FALSE',
      item.assignedTo
    ]];

    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `ProductionProgress!A${rowIndex + 1}:F${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'ProductionProgress!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    }
  } catch (error) {
    console.error('Error upserting production progress:', error);
  }
}

export async function completeProductionBatch(sku: string, dateKey: string, doneQty: number, sourceOrderIds: string[]) {
  // 1. Add finished stock to inventory
  if (doneQty > 0) {
    await adjustStock(
      sku, 
      doneQty, 
      0, 
      'PRODUCTION', 
      'PRODUCTION_BATCH', 
      `${dateKey}-${sku}`, 
      `Produksi selesai untuk target ${dateKey}`
    );
  }

  // 2. Resolve Kanban status
  if (sourceOrderIds && sourceOrderIds.length > 0) {
    await resolveOrdersStatus(sourceOrderIds);
  }
}

export async function resolveOrdersStatus(orderIds: string[]) {
  if (orderIds.length === 0) return;
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Laporan Transaksi Harian!A2:R',
    });
    const rows = response.data.values || [];
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    
    for (const orderId of orderIds) {
      const rowIndex = rows.findIndex((r) => {
        const rowId = new Date(r[0]).getTime() || '';
        return String(rowId) === String(orderId) || String(r[0]) === String(orderId);
      });

      if (rowIndex !== -1) {
        const actualRowNumber = rowIndex + 2;
        const currentRow = rows[rowIndex];
        
        while (currentRow.length < 18) currentRow.push('');

        currentRow[10] = 'Packing';
        
        currentRow[13] = currentRow[13] || now; // Dikonfirmasi
        currentRow[14] = currentRow[14] || now; // Produksi
        currentRow[15] = currentRow[15] || now; // Packing

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Laporan Transaksi Harian!K${actualRowNumber}:R${actualRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [currentRow.slice(10, 18)],
          },
        });
      }
    }
  } catch (e) {
    console.error('Failed to resolve orders status', e);
  }
}

