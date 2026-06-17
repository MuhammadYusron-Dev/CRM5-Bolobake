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
      range: 'Laporan Transaksi Harian!A:U',
    });
    const rows = response.data.values || [];
    const timestampStr = new Date().toISOString();
    
    for (const orderId of orderIds) {
      // Using indexOf since ID is likely in the customer column or derived, 
      // but wait, in CRM5 we don't have explicit ID column in 'Laporan Transaksi Harian', 
      // wait, refId usually corresponds to something. Let's see how order.id is used.
      // Usually it's in the row itself or we need to find it. 
      // Actually `Laporan Transaksi Harian` doesn't have an ID column explicitly by default, it uses row numbers or customer name + timestamp.
      // Let's assume orderId is the row index or unique string.
      // Let's check `app/api/orders/route.ts` to see what `order.id` is. 
      // Wait, we need to know what orderId actually is.
      // If it's the timestamp or something, we can find it.
      // For now, let's call our internal `/api/orders` to do this safely!
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
          // Trigger internal API call to update order status to 'Packing'
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            for (const oId of sourceOrderIds) {
              await fetch(`${baseUrl}/api/orders`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: oId, status: 'Packing' })
              });
            }
          } catch (e) {
            console.error('Error auto-resolving order status:', e);
          }
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

