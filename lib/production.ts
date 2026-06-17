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
    const id = `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionQueue!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        // ID, Target Date, SKU, Deficit, Status, Timestamp, Source Order ID, Assigned To
        values: [[id, targetDate, sku, deficit, 'Pending', timestamp, sourceOrderId, '']]
      }
    });
  } catch (error) {
    console.error('Error adding to production queue:', error);
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
      // ID[0], TargetDate[1], SKU[2], Deficit[3], Status[4], Timestamp[5], SourceOrderId[6], AssignedTo[7]
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
      
      // If status changed to Completed, trigger complete logic
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
  console.log(`[Production] Generating production queue for ${payload.sku}. Deficit: ${payload.deficit}`);
  await addProductionQueue(payload.productionDate, payload.sku, payload.deficit, payload.orderId);
});

