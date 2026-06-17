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
}

export async function getProductionQueue(): Promise<ProductionQueueItem[]> {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionQueue!A2:I',
    });
    const rows = response.data.values || [];
    return rows.map(row => ({
      id: row[0] || '',
      targetDate: row[1] || '',
      sku: row[2] || '',
      deficit: parseInt(row[3] || '0', 10),
      status: row[4] || 'Menunggu',
      timestamp: row[5] || '',
      sourceOrderId: row[6] || '',
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
      range: 'ProductionQueue!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, targetDate, sku, deficit, 'Menunggu', timestamp, sourceOrderId]]
      }
    });
  } catch (error) {
    console.error('Error adding to production queue:', error);
  }
}

export async function completeProduction(queueId: string) {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionQueue!A:G',
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === queueId);

    if (rowIndex !== -1) {
      const row = rows[rowIndex];
      const sku = row[2];
      const deficit = parseInt(row[3] || '0', 10);
      const status = row[4];

      if (status !== 'Selesai') {
        // Update status to Selesai
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `ProductionQueue!E${rowIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Selesai']]
          }
        });

        // Add to Total Stock in Inventory and log movement
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
    console.error(`Error completing production ${queueId}:`, error);
  }
}

// Handle Stock Insufficient Event
eventBus.on('STOCK_INSUFFICIENT', async (payload) => {
  console.log(`[Production] Generating production queue for ${payload.sku}. Deficit: ${payload.deficit}`);
  await addProductionQueue(payload.productionDate, payload.sku, payload.deficit, payload.orderId);
});

