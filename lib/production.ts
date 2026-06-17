import { sheets, SPREADSHEET_ID, ensureInventorySheets } from '@/lib/google-sheets';
import { eventBus } from '@/lib/events';
import { adjustStock } from '@/lib/inventory';

export interface ProductionQueueItem {
  id: string;
  targetDate: string;
  sku: string;
  deficit: number;
  status: string;
  timestamp: string;
  sourceOrderId?: string;
  assignedTo?: string;
}

export async function getProductionQueue(): Promise<ProductionQueueItem[]> {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionQueue!A2:J',
    });
    const rows = response.data.values || [];
    return rows.map(row => ({
      id: row[0] || '',
      targetDate: row[1] || '',
      sku: row[2] || '',
      deficit: parseInt(row[3] || '0', 10),
      status: row[4] || 'Pending',
      timestamp: row[5] || '',
      sourceOrderId: row[6] || '',
      assignedTo: row[7] || '',
    })).filter(item => item.id !== '');
  } catch (error) {
    console.error('Error fetching production queue:', error);
    return [];
  }
}

export async function addProductionQueue(targetDate: string, sku: string, deficit: number, sourceOrderId: string = '') {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionQueue!A:H',
    });
    const rows = response.data.values || [];
    
    // Find existing pending queue for this SKU and Date
    const rowIndex = rows.findIndex(row => 
      row[2] === sku && 
      row[1] === targetDate && 
      ['Pending', 'Waiting Stock', 'In Progress'].includes(row[4] || 'Pending')
    );

    if (rowIndex !== -1) {
      // Update existing
      const currentRow = rows[rowIndex];
      const orderIdsStr = currentRow[6] || '';
      const orderIds = orderIdsStr.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
      
      if (sourceOrderId && !orderIds.includes(sourceOrderId)) {
        orderIds.push(sourceOrderId);
      }
      const newOrderIdsStr = orderIds.join(', ');

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `ProductionQueue!D${rowIndex + 1}:G${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          // Update Deficit[3/D], Status[4/E], Timestamp[5/F], SourceOrderId[6/G]
          values: [[deficit, currentRow[4], currentRow[5], newOrderIdsStr]]
        }
      });
    } else {
      // Create new
      const id = `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const timestamp = new Date().toISOString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'ProductionQueue!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[id, targetDate, sku, deficit, 'Pending', timestamp, sourceOrderId, '']]
        }
      });
    }
  } catch (error) {
    console.error('Error adding/upserting to production queue:', error);
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
        
        // Pad array if needed up to column R (index 17)
        while (currentRow.length < 18) currentRow.push('');

        // Update status to 'Packing' (column K, index 10)
        currentRow[10] = 'Packing';
        
        // Update timestamps
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

export async function updateProductionQueue(queueId: string, updates: Partial<ProductionQueueItem>) {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionQueue!A:H',
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === queueId);

    if (rowIndex !== -1) {
      const currentRow = rows[rowIndex];
      const newStatus = updates.status !== undefined ? updates.status : currentRow[4];
      const newAssignedTo = updates.assignedTo !== undefined ? updates.assignedTo : (currentRow[7] || '');
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `ProductionQueue!E${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newStatus]] }
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `ProductionQueue!H${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newAssignedTo]] }
      });
      
      if (newStatus === 'Completed' && currentRow[4] !== 'Completed') {
        const sku = currentRow[2];
        const deficit = parseInt(currentRow[3] || '0', 10);
        await adjustStock(
          sku, 
          deficit, 
          0, 
          'PRODUCTION', 
          'PRODUCTION_QUEUE', 
          queueId, 
          'Production completed'
        );

        // Auto-resolve Kanban status
        const orderIdsStr = currentRow[6] || '';
        const sourceOrderIds = orderIdsStr.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
        if (sourceOrderIds.length > 0) {
          await resolveOrdersStatus(sourceOrderIds);
        }
      }
    }
  } catch (error) {
    console.error(`Error updating production queue ${queueId}:`, error);
  }
}

export async function completeProduction(queueId: string) {
  await updateProductionQueue(queueId, { status: 'Completed' });
}

// Handle Stock Insufficient Event
eventBus.on('STOCK_INSUFFICIENT', async (payload) => {
  console.log(`[Production] Generating/updating production queue for ${payload.sku}. Deficit: ${payload.deficit}`);
  await addProductionQueue(payload.productionDate, payload.sku, payload.deficit, payload.orderId);
});

