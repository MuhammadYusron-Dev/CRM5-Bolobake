import { sheets, SPREADSHEET_ID, ensureInventorySheets } from '@/lib/google-sheets';
import { eventBus } from '@/lib/events';
import { updateInventoryRow, getInventory } from '@/lib/inventory';

export interface ProductionQueueItem {
  id: string;
  targetDate: string;
  sku: string;
  deficit: number;
  status: string;
  timestamp: string;
}

export async function getProductionQueue(): Promise<ProductionQueueItem[]> {
  await ensureInventorySheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionQueue!A2:F',
    });
    const rows = response.data.values || [];
    return rows.map(row => ({
      id: row[0] || '',
      targetDate: row[1] || '',
      sku: row[2] || '',
      deficit: parseInt(row[3] || '0', 10),
      status: row[4] || 'Menunggu',
      timestamp: row[5] || '',
    })).filter(item => item.id !== '');
  } catch (error) {
    console.error('Error fetching production queue:', error);
    return [];
  }
}

export async function addProductionQueue(targetDate: string, sku: string, deficit: number) {
  await ensureInventorySheets();
  try {
    const id = `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'ProductionQueue!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[id, targetDate, sku, deficit, 'Menunggu', timestamp]]
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
      range: 'ProductionQueue!A:F',
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

        // Add to Total Stock in Inventory
        const inventory = await getInventory();
        const invItem = inventory.find(i => i.sku === sku);
        if (invItem) {
          // Increase total stock by the produced amount
          await updateInventoryRow(sku, invItem.totalStock + deficit, invItem.reservedStock);
        } else {
          // If not in inventory (should rarely happen), create it
          await updateInventoryRow(sku, deficit, 0);
        }
      }
    }
  } catch (error) {
    console.error(`Error completing production ${queueId}:`, error);
  }
}

// Handle Stock Insufficient Event
eventBus.on('STOCK_INSUFFICIENT', async (payload) => {
  console.log(`[Production] Generating production queue for ${payload.sku}. Deficit: ${payload.deficit}`);
  await addProductionQueue(payload.productionDate, payload.sku, payload.deficit);
});
